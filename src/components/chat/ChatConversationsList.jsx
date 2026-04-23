import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useNavigate } from 'react-router-dom';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, MessageSquare, Loader2 } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import OnlineStatusBadge from './OnlineStatusBadge';
import { cn } from '@/lib/utils';

const ChatConversationsList = ({ onSelectConversation, selectedBookingId }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [onlineStatuses, setOnlineStatuses] = useState(new Map());

  useEffect(() => {
    fetchConversations();
    subscribeToUpdates();
  }, [user]);

  const fetchConversations = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Get all bookings for the user (as dentist or host)
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          id,
          clinic_id,
          dentist_id,
          start_time,
          status,
          clinics!inner(name, host_id),
          dentist:profiles!dentist_id(id, full_name, avatar_url)
        `)
        .or(`dentist_id.eq.${user.id},clinics.host_id.eq.${user.id}`)
        .in('status', ['confirmed', 'pending'])
        .order('start_time', { ascending: false });

      if (bookingsError) throw bookingsError;

      // Get last messages for each booking
      const conversationsData = await Promise.all(
        bookings.map(async (booking) => {
          const { data: lastMessage } = await supabase
            .from('booking_chat_messages')
            .select('content, created_at, sender_id')
            .eq('booking_id', booking.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          const { count: unreadCount } = await supabase
            .from('booking_chat_messages')
            .select('*', { count: 'exact', head: true })
            .eq('booking_id', booking.id)
            .neq('sender_id', user.id)
            .not('read_receipts', 'cs', `{"user_id":"${user.id}"}`);

          const otherUserId = booking.dentist_id === user.id 
            ? booking.clinics.host_id 
            : booking.dentist_id;

          const { data: otherUserData } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .eq('id', otherUserId)
            .single();

          return {
            bookingId: booking.id,
            clinicName: booking.clinics.name,
            otherUser: otherUserData,
            lastMessage: lastMessage?.content || 'Sin mensajes',
            lastMessageTime: lastMessage?.created_at || booking.start_time,
            unreadCount: unreadCount || 0,
            status: booking.status
          };
        })
      );

      setConversations(conversationsData.sort((a, b) => 
        new Date(b.lastMessageTime) - new Date(a.lastMessageTime)
      ));

      // Fetch online statuses
      const userIds = conversationsData.map(c => c.otherUser.id);
      const { data: presenceData } = await supabase
        .from('user_presence')
        .select('*')
        .in('user_id', userIds);

      if (presenceData) {
        const statusMap = new Map();
        presenceData.forEach(p => {
          statusMap.set(p.user_id, { is_online: p.is_online, last_seen: p.last_seen });
        });
        setOnlineStatuses(statusMap);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToUpdates = () => {
    if (!user) return;

    const subscription = supabase
      .channel('chat-updates')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'booking_chat_messages'
      }, () => {
        fetchConversations();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  };

  const filteredConversations = conversations.filter(conv =>
    conv.clinicName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.otherUser?.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar conversaciones..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <MessageSquare className="w-12 h-12 text-muted-foreground mb-3" />
            <p className="text-sm font-medium text-muted-foreground">
              {searchQuery ? 'No se encontraron conversaciones' : 'No tienes conversaciones activas'}
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {filteredConversations.map((conv) => {
              const status = onlineStatuses.get(conv.otherUser?.id) || { is_online: false };
              
              return (
                <button
                  key={conv.bookingId}
                  onClick={() => onSelectConversation?.(conv)}
                  className={cn(
                    "w-full p-4 hover:bg-muted/50 transition-colors text-left",
                    selectedBookingId === conv.bookingId && "bg-muted"
                  )}
                >
                  <div className="flex gap-3">
                    <div className="relative">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={conv.otherUser?.avatar_url} />
                        <AvatarFallback>
                          {conv.otherUser?.full_name?.[0] || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-1 -right-1">
                        <OnlineStatusBadge
                          isOnline={status.is_online}
                          lastSeen={status.last_seen}
                          size="sm"
                          showText={false}
                        />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div>
                          <h4 className="font-semibold text-sm truncate">
                            {conv.otherUser?.full_name}
                          </h4>
                          <p className="text-xs text-muted-foreground truncate">
                            {conv.clinicName}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatDistanceToNow(parseISO(conv.lastMessageTime), {
                              addSuffix: true,
                              locale: es
                            })}
                          </span>
                          {conv.unreadCount > 0 && (
                            <Badge variant="default" className="h-5 min-w-[20px] flex items-center justify-center px-1.5">
                              {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {conv.lastMessage}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default ChatConversationsList;