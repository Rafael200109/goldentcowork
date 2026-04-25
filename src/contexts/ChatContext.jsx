import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabaseClient } from '@/config/supabaseConfig';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useChat } from '@/hooks/useChat';

const ChatContext = createContext({});

export const ChatProvider = ({ children }) => {
  const { user } = useAuth();
  const { getActiveUserSession } = useChat();
  
  const [activeSession, setActiveSession] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [isWidgetOpen, setIsWidgetOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      setActiveSession(null);
      return;
    }

    getActiveUserSession().then(session => {
      if (session) setActiveSession(session);
    });
  }, [user, getActiveUserSession]);

  useEffect(() => {
    if (!activeSession) return;

    const messageSubscription = supabase
      .channel(`chat_messages_${activeSession.id}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'chat_messages',
        filter: `session_id=eq.${activeSession.id}`
      }, payload => {
        if (payload.new.sender_id !== user?.id && !isWidgetOpen) {
          setUnreadCount(prev => prev + 1);
        }
      })
      .subscribe();

    const sessionSubscription = supabase
      .channel(`chat_session_${activeSession.id}`)
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'chat_sessions',
        filter: `id=eq.${activeSession.id}`
      }, () => {
        setActiveSession(null);
        setIsWidgetOpen(false);
      })
      .subscribe();

    return () => {
      supabaseClient.removeChannel(messageSubscription);
      supabaseClient.removeChannel(sessionSubscription);
    };
  }, [activeSession, user, isWidgetOpen]);

  const incrementUnread = () => setUnreadCount(prev => prev + 1);
  const clearUnread = () => setUnreadCount(0);
  const setTyping = (typing) => setIsTyping(typing);

  return (
    <ChatContext.Provider value={{
      activeSession,
      setActiveSession,
      unreadCount,
      incrementUnread,
      clearUnread,
      isTyping,
      setTyping,
      isWidgetOpen,
      setIsWidgetOpen
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useGlobalChat = () => useContext(ChatContext);