import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabaseClient } from '@/config/supabaseConfig';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';

const BookingChatContext = createContext(undefined);

export const BookingChatProvider = ({ children, bookingId }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [unreadCount, setUnreadCount] = useState(0);
  
  const typingTimeoutRef = useRef(null);

  // Fetch message history
  const fetchMessages = useCallback(async () => {
    if (!bookingId || !user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('booking_chat_messages')
        .select(`
          *,
          sender:profiles!sender_id(id, full_name, avatar_url),
          read_receipts(user_id, read_at)
        `)
        .eq('booking_id', bookingId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
      
      const unread = data?.filter(msg => 
        msg.sender_id !== user.id && (!msg.read_receipts || !msg.read_receipts.some(r => r.user_id === user.id))
      ).length || 0;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudieron cargar los mensajes.',
      });
    } finally {
      setLoading(false);
    }
  }, [bookingId, user, toast]);

  // Task 2: Realtime Subscription
  // This useEffect ensures messages appear in real-time without needing to close/reopen chat.
  useEffect(() => {
    if (!bookingId || !user) return;

    const channel = supabase
      .channel(`booking-messages-${bookingId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'booking_chat_messages',
        filter: `booking_id=eq.${bookingId}`
      }, async (payload) => {
        // Fetch sender details to display avatar/name correctly immediately
        const { data: senderData } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .eq('id', payload.new.sender_id)
          .single();

        const newMessage = {
          ...payload.new,
          sender: senderData,
          read_receipts: []
        };

        setMessages(prev => {
          // Avoid duplicates
          if (prev.some(m => m.id === newMessage.id)) return prev;
          return [...prev, newMessage];
        });
        
        if (payload.new.sender_id !== user.id) {
          setUnreadCount(prev => prev + 1);
        }
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'read_receipts'
      }, (payload) => {
          setMessages(prev => prev.map(msg => {
              if (msg.id === payload.new.message_id) {
                  const existing = msg.read_receipts || [];
                  if (!existing.some(r => r.user_id === payload.new.user_id)) {
                      return {
                          ...msg,
                          read_receipts: [...existing, { user_id: payload.new.user_id, read_at: payload.new.read_at }]
                      };
                  }
              }
              return msg;
          }));
      })
      .subscribe();

    // Clean up subscription on unmount
    return () => {
      supabaseClient.removeChannel(channel);
    };
  }, [bookingId, user]);

  // Mark message as read
  const markAsRead = useCallback(async (messageId) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('read_receipts')
        .upsert({
          message_id: messageId,
          user_id: user.id,
          read_at: new Date().toISOString()
        }, { onConflict: 'message_id,user_id' });

      if (error) throw error;

      setMessages(prev => prev.map(msg => {
        if (msg.id === messageId) {
          const receipts = msg.read_receipts || [];
          if (!receipts.some(r => r.user_id === user.id)) {
            return {
              ...msg,
              read_receipts: [...receipts, { user_id: user.id, read_at: new Date().toISOString() }]
            };
          }
        }
        return msg;
      }));

      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  }, [user]);

  // Mark all messages as read
  const markAllAsRead = useCallback(async () => {
    if (!user || !bookingId) return;
    
    const unreadMessages = messages.filter(msg => {
        const isMyMessage = msg.sender_id === user.id;
        const hasRead = msg.read_receipts && msg.read_receipts.some(r => r.user_id === user.id);
        return !isMyMessage && !hasRead;
    });

    if (unreadMessages.length === 0) return;

    const receipts = unreadMessages.map(msg => ({
        message_id: msg.id,
        user_id: user.id,
        read_at: new Date().toISOString()
    }));

    try {
        const { error } = await supabaseClient.from('read_receipts').upsert(receipts, { onConflict: 'message_id,user_id' });
        
        if (error) throw error;
        
        setMessages(prev => prev.map(msg => {
            if (unreadMessages.some(u => u.id === msg.id)) {
                const existing = msg.read_receipts || [];
                if (!existing.some(r => r.user_id === user.id)) {
                     return {
                        ...msg,
                        read_receipts: [...existing, { user_id: user.id, read_at: new Date().toISOString() }]
                    };
                }
            }
            return msg;
        }));
        setUnreadCount(0);
    } catch (err) {
        console.error("Error in markAllAsRead:", err);
    }

  }, [user, bookingId, messages]);

  // Send message
  const sendMessage = useCallback(async (messageData) => {
    if (!user || !bookingId) return;

    // Supports both old string signature and new object signature
    const content = typeof messageData === 'string' ? messageData : messageData.content;
    const { 
        content_type = 'text', 
        attachment_url = null, 
        attachment_name = null, 
        attachment_size = null,
        location_latitude = null,
        location_longitude = null,
        location_clinic_name = null
    } = typeof messageData === 'object' ? messageData : {};

    if ((!content || !content.trim()) && content_type === 'text') return;

    setSending(true);
    try {
      const { error } = await supabase
        .from('booking_chat_messages')
        .insert({
          booking_id: bookingId,
          sender_id: user.id,
          content: content?.trim() || '',
          is_read: false,
          content_type,
          attachment_url,
          attachment_name,
          attachment_size,
          location_latitude,
          location_longitude,
          location_clinic_name
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo enviar el mensaje.',
      });
    } finally {
      setSending(false);
    }
  }, [bookingId, user, toast]);

  // Set typing status
  const setTypingStatus = useCallback(async (isTyping) => {
    if (!user || !bookingId) return;
    
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    try {
       await supabase
        .from('typing_indicators')
        .upsert({
          booking_id: bookingId,
          user_id: user.id,
          is_typing: isTyping,
          updated_at: new Date().toISOString()
        }, { onConflict: 'booking_id,user_id' });

      if (isTyping) {
        typingTimeoutRef.current = setTimeout(() => {
            setTypingStatus(false);
        }, 3000);
      }
    } catch (e) { console.error(e); }

  }, [user, bookingId]);

  // Initial load
  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const value = useMemo(() => ({
    messages,
    loading,
    sending,
    bookingId, // Expose bookingId
    typingUsers: Array.from(typingUsers),
    unreadCount,
    sendMessage,
    markAsRead,
    markAllAsRead,
    setTypingStatus,
    refreshMessages: fetchMessages
  }), [
    messages,
    loading,
    sending,
    bookingId,
    typingUsers,
    unreadCount,
    sendMessage,
    markAsRead,
    markAllAsRead,
    setTypingStatus,
    fetchMessages
  ]);

  return (
    <BookingChatContext.Provider value={value}>
      {children}
    </BookingChatContext.Provider>
  );
};

export const useBookingChat = () => {
  const context = useContext(BookingChatContext);
  if (!context) {
    throw new Error('useBookingChat must be used within BookingChatProvider');
  }
  return context;
};