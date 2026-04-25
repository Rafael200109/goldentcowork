import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  AlertDialog, AlertDialogAction, AlertDialogCancel, 
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter, 
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger 
} from "@/components/ui/alert-dialog";
import { useChat } from '@/hooks/useChat';
import { useGlobalChat } from '@/contexts/ChatContext';
import ChatMessage from './ChatMessage';
import { supabaseClient } from '@/config/supabaseConfig';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const ChatWindow = ({ onClose }) => {
  const { user } = useAuth();
  const { activeSession, setActiveSession, isTyping } = useGlobalChat();
  const { fetchMessages, sendMessage, closeSession, loading } = useChat();
  
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (activeSession) {
      fetchMessages(activeSession.id).then(setMessages);

      const channel = supabase
        .channel(`chat_messages_${activeSession.id}_window`)
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'chat_messages',
          filter: `session_id=eq.${activeSession.id}`
        }, payload => {
          setMessages(prev => {
             if (prev.some(m => m.id === payload.new.id)) return prev;
             return [...prev, payload.new];
          });
        })
        .subscribe();

      return () => {
        supabaseClient.removeChannel(channel);
      };
    }
  }, [activeSession, fetchMessages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !activeSession || isSending) return;

    const messageText = inputText.trim();
    setInputText('');
    setIsSending(true);

    const newMsg = await sendMessage(activeSession.id, messageText, 'user');
    if (newMsg) {
      setMessages(prev => [...prev, newMsg]);
    }
    setIsSending(false);
  };

  const handleCloseTicket = async () => {
    if (!activeSession) return;
    await closeSession(activeSession.id);
    setActiveSession(null);
    onClose();
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="fixed bottom-20 right-4 sm:right-6 w-[calc(100vw-2rem)] sm:w-[400px] h-[500px] max-h-[80vh] bg-background border shadow-2xl rounded-2xl flex flex-col z-50 overflow-hidden"
    >
      <div className="flex items-center justify-between p-4 border-b bg-muted/30">
        <div>
          <h3 className="font-semibold text-foreground">Soporte en línea</h3>
          <p className="text-xs text-muted-foreground">
            {activeSession ? `Ticket: ${activeSession.ticket_id.split('-')[0]}` : 'Iniciar nuevo chat'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activeSession && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Cerrar sesión de chat?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción eliminará permanentemente la sesión de chat y todos los mensajes asociados.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleCloseTicket} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Cerrar Ticket
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto">
        {loading && messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            <p className="mb-2">No hay mensajes aún.</p>
            <p className="text-sm">Envía un mensaje para comenzar la conversación.</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} currentUserId={user?.id} />
            ))}
            
            {isTyping && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex w-full mb-4 justify-start">
                <div className="bg-muted text-muted-foreground px-4 py-2 rounded-2xl rounded-tl-sm text-sm flex gap-1 items-center">
                  <span className="animate-bounce">•</span>
                  <span className="animate-bounce delay-100">•</span>
                  <span className="animate-bounce delay-200">•</span>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>

      <div className="p-3 border-t bg-background">
        <form onSubmit={handleSend} className="flex gap-2">
          <Input 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Escribe tu mensaje..."
            className="flex-1"
            disabled={!activeSession || isSending}
          />
          <Button type="submit" size="icon" disabled={!inputText.trim() || !activeSession || isSending}>
            {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </div>
    </motion.div>
  );
};

export default ChatWindow;