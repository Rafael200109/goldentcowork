import React, { useState, useEffect } from 'react';
import { MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import BookingChatWindow from './BookingChatWindow';
import { BookingChatProvider } from '@/contexts/BookingChatContext';
import { isAfter, parseISO } from 'date-fns';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabaseClient } from '@/config/supabaseConfig';
import { cn } from '@/lib/utils';

const BookingChatButton = ({ booking, className, isHost }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  // Real-time unread counter for the button
  // Moved useEffect to the top level to avoid conditional hook execution error
  useEffect(() => {
      if (!user || !booking?.id || !isHost) return;
      
      const fetchCount = async () => {
          const { count } = await supabase
            .from('booking_chat_messages')
            .select('*', { count: 'exact', head: true })
            .eq('booking_id', booking.id)
            .neq('sender_id', user.id)
            .eq('is_read', false);
          
          setUnreadCount(count || 0);
      };
      
      fetchCount();

      const channel = supabaseClient.channel(`badge-${booking.id}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'booking_chat_messages', filter: `booking_id=eq.${booking.id}` }, 
        (payload) => {
            if (payload.new.sender_id !== user.id) {
                setUnreadCount(prev => prev + 1);
            }
        })
        .subscribe();
        
      return () => supabaseClient.removeChannel(channel);
  }, [booking?.id, user, isHost]);

  // Task 1: Permissions - Only show to hosts
  // Moved check after hooks
  if (!isHost) {
    return null;
  }

  // Expired if current time is AFTER end time
  const isExpired = booking?.end_time && isAfter(new Date(), parseISO(booking.end_time));
  const isDisabled = isExpired;

  // Determine the "other user" to chat with
  let otherUser = null;
  if (user && booking) {
    if (user.id === booking.dentist_id) {
       // I am the dentist (shouldn't see this button usually based on permissions, but logic remains valid)
       if (booking.clinic) {
           otherUser = { 
               id: booking.clinic.host_id, 
               full_name: 'Anfitrión', 
               avatar_url: null 
           };
       }
    } else {
        // I am the host, chat with dentist
        otherUser = booking.profiles || { id: booking.dentist_id, full_name: booking.dentist_name || 'Odontólogo' };
    }
  }

  if (isDisabled) {
     return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className="inline-block">
                        <Button variant="ghost" size="sm" disabled className={className}>
                            <MessageSquare className="w-4 h-4 mr-2" />
                            Chat
                        </Button>
                    </div>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Chat finalizado (reserva completada)</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
     );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className={className} onClick={() => setUnreadCount(0)}>
          <MessageSquare className="w-4 h-4 mr-2" />
          Chat
          {unreadCount > 0 && (
             <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center rounded-full text-[10px]">
                 {unreadCount}
             </Badge>
          )}
        </Button>
      </DialogTrigger>
      {/* Task 3: Responsiveness 
          - Mobile: Full width/height, fixed bottom
          - Tablet: 90% width/height, centered
          - Desktop: 600x600, centered (absolute behavior relative to viewport)
      */}
      <DialogContent 
        className={cn(
            "p-0 overflow-hidden gap-0 bg-background",
            // Mobile Styles (< 768px)
            "fixed bottom-0 left-0 top-auto translate-y-0 translate-x-0 w-full h-[100dvh] max-w-none rounded-none border-0",
            // Tablet Styles (>= 768px)
            "md:fixed md:top-[50%] md:left-[50%] md:translate-x-[-50%] md:translate-y-[-50%] md:w-[90%] md:h-[90%] md:rounded-xl md:border",
            // Desktop Styles (>= 1024px)
            "lg:w-[600px] lg:h-[600px]"
        )}
      >
         <BookingChatProvider bookingId={booking.id}>
            <BookingChatWindow otherUser={otherUser} />
         </BookingChatProvider>
      </DialogContent>
    </Dialog>
  );
};

export default BookingChatButton;