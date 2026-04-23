import React, { useState, useEffect, useRef } from 'react';
import { useUser } from '@/contexts/UserContext';
import { bookingChatService } from '@/lib/bookingChatService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import ChatMessage from './ChatMessage';

const BookingChat = ({ booking }) => {
  const { profile } = useUser();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!booking?.id || !profile?.id) return;

    const loadMessages = async () => {
      try {
        setLoading(true);
        const data = await bookingChatService.fetchMessages(booking.id);
        setMessages(data);
        await bookingChatService.markMessagesAsRead(booking.id, profile.id);
      } catch (err) {
        console.error("Failed to load messages", err);
        setError("Error al cargar los mensajes.");
      } finally {
        setLoading(false);
      }
    };

    loadMessages();

    // Subscribe to realtime changes
    const unsubscribe = bookingChatService.subscribeToMessages(booking.id, (newMessage) => {
      setMessages((prev) => {
        // Avoid duplicates
        if (prev.find(m => m.id === newMessage.id)) return prev;
        return [...prev, newMessage];
      });
      
      // If the message is not from me, mark it as read immediately if chat is open
      if (newMessage.sender_id !== profile.id) {
          bookingChatService.markMessagesAsRead(booking.id, profile.id).catch(console.error);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [booking?.id, profile?.id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !profile) return;

    setSending(true);
    try {
      await bookingChatService.sendMessage(booking.id, profile.id, newMessage.trim());
      setNewMessage('');
    } catch (err) {
      console.error("Failed to send message", err);
      setError("No se pudo enviar el mensaje.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-[500px] bg-gray-50/50 dark:bg-zinc-900/50">
      {/* Chat Header */}
      <div className="p-4 border-b bg-white dark:bg-background flex items-center justify-between shadow-sm z-10">
         <div>
            <h3 className="font-semibold text-sm">Chat de Reserva</h3>
            <p className="text-xs text-muted-foreground">{booking.clinic?.name || 'Clínica'}</p>
         </div>
         {/* Typing indicator placeholder */}
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4">
        {loading ? (
          <div className="flex justify-center items-center h-full pt-10">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
           <Alert variant="destructive">
             <AlertCircle className="h-4 w-4" />
             <AlertDescription>{error}</AlertDescription>
           </Alert>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-2 pt-10 opacity-60">
             <div className="p-4 bg-muted rounded-full">
                <Send className="w-6 h-6 text-muted-foreground" />
             </div>
             <p className="text-sm font-medium">Inicia la conversación</p>
             <p className="text-xs text-muted-foreground max-w-[200px]">Coordina los detalles de tu cita aquí.</p>
          </div>
        ) : (
          <div className="flex flex-col space-y-2 pb-4">
            {messages.map((msg) => (
              <ChatMessage 
                key={msg.id} 
                message={msg} 
                isOwnMessage={msg.sender_id === profile.id} 
              />
            ))}
            <div ref={scrollRef} />
          </div>
        )}
      </ScrollArea>

      {/* Input Area */}
      <div className="p-4 bg-white dark:bg-background border-t">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Escribe un mensaje..."
            className="flex-1"
            disabled={sending || loading}
          />
          <Button type="submit" size="icon" disabled={sending || loading || !newMessage.trim()}>
             {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default BookingChat;