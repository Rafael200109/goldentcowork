import { useEffect, useRef } from 'react';
import { supabaseClient } from '@/config/supabaseConfig';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { useNotifications } from '@/contexts/NotificationsContext';

export const useBookingChatNotifications = (options = {}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { fetchNotifications } = useNotifications();
  const audioRef = useRef(null);
  
  const {
    enableSound = true,
    enableToast = true,
    focusedBookingId = null
  } = options;

  useEffect(() => {
    if (!user) return;

    // Create audio element for notification sound
    if (enableSound && !audioRef.current) {
      audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSyAy/DVgjMGHm7A7+OZSA0PVqzn77BdGAg+lunyyWgjBS1+yO/PhCwFI3K88N6UQgoUX7Tp7KlWFQpFnuDyvmsfBS1+ye/Phy4FI3K68N6SQgoSY7fn7KdUFgpDnN/yvmwhBSp8xu/PiCsFI2+38d+RQAoTY7Xm7KhUFQpDnN/xvWseBSt7xO/Oh CEFF');
    }

    // Subscribe to new messages in all user's bookings
    const subscription = supabase
      .channel(`user-chat-notifications-${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'booking_chat_messages'
      }, async (payload) => {
        const newMessage = payload.new;
        
        // Don't notify for own messages
        if (newMessage.sender_id === user.id) return;

        // Don't notify if currently viewing this conversation
        if (focusedBookingId === newMessage.booking_id && !document.hidden) return;

        // Fetch booking and sender details
        const { data: booking } = await supabase
          .from('bookings')
          .select(`
            id,
            clinic_id,
            dentist_id,
            clinics!inner(name, host_id)
          `)
          .eq('id', newMessage.booking_id)
          .single();

        // Check if user is participant
        const isParticipant = booking && (
          booking.dentist_id === user.id ||
          booking.clinics.host_id === user.id
        );

        if (!isParticipant) return;

        const { data: sender } = await supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('id', newMessage.sender_id)
          .single();

        // Show toast notification
        if (enableToast) {
          toast({
            title: `Nuevo mensaje de ${sender?.full_name || 'Usuario'}`,
            description: newMessage.content.length > 50 
              ? `${newMessage.content.substring(0, 50)}...` 
              : newMessage.content,
            duration: 5000
          });
        }

        // Play sound
        if (enableSound && audioRef.current) {
          try {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(err => {
              console.log('Could not play notification sound:', err);
            });
          } catch (error) {
            console.log('Audio playback error:', error);
          }
        }

        // Refresh global notifications
        fetchNotifications();
      })
      .subscribe();

    return () => {
      supabaseClient.removeChannel(subscription);
    };
  }, [user, enableSound, enableToast, focusedBookingId, toast, fetchNotifications]);

  return null;
};