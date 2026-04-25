import { supabaseClient } from '@/config/supabaseConfig';

export const bookingChatService = {
  /**
   * Fetches messages for a specific booking
   */
  async fetchMessages(bookingId) {
    const { data, error } = await supabase
      .from('booking_chat_messages')
      .select(`
        *,
        sender:profiles!sender_id (
          id,
          full_name,
          avatar_url
        )
      `)
      .eq('booking_id', bookingId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
  },

  /**
   * Sends a new message
   */
  async sendMessage(bookingId, senderId, content) {
    const { data, error } = await supabase
      .from('booking_chat_messages')
      .insert({
        booking_id: bookingId,
        sender_id: senderId,
        content: content,
        is_read: false
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Marks unread messages as read for the current viewer
   */
  async markMessagesAsRead(bookingId, userId) {
    // Mark messages as read where I am NOT the sender
    const { error } = await supabase
      .from('booking_chat_messages')
      .update({ is_read: true })
      .eq('booking_id', bookingId)
      .neq('sender_id', userId)
      .eq('is_read', false);

    if (error) throw error;
  },

  /**
   * Subscribes to new messages for a booking
   */
  subscribeToMessages(bookingId, onMessageReceived) {
    const subscription = supabase
      .channel(`booking-chat-${bookingId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'booking_chat_messages',
          filter: `booking_id=eq.${bookingId}`
        },
        async (payload) => {
          // Fetch the complete message with sender details
          const { data, error } = await supabase
            .from('booking_chat_messages')
            .select(`
              *,
              sender:profiles!sender_id (
                id,
                full_name,
                avatar_url
              )
            `)
            .eq('id', payload.new.id)
            .single();

          if (!error && data) {
            onMessageReceived(data);
          }
        }
      )
      .subscribe();

    return () => {
      supabaseClient.removeChannel(subscription);
    };
  }
};