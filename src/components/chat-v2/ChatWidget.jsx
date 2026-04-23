import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare } from 'lucide-react';
import { useGlobalChat } from '@/contexts/ChatContext';
import { useChat } from '@/hooks/useChat';
import ChatWindow from './ChatWindow';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const ChatWidget = () => {
  const { user } = useAuth();
  const { isWidgetOpen, setIsWidgetOpen, unreadCount, clearUnread, activeSession, setActiveSession } = useGlobalChat();
  const { createSession } = useChat();

  if (!user || user.role === 'admin' || user.role === 'support') return null;

  const toggleWidget = async () => {
    if (!isWidgetOpen) {
      clearUnread();
      if (!activeSession) {
        const newSession = await createSession();
        if (newSession) setActiveSession(newSession);
      }
    }
    setIsWidgetOpen(!isWidgetOpen);
  };

  return (
    <>
      <AnimatePresence>
        {isWidgetOpen && (
          <ChatWindow onClose={() => setIsWidgetOpen(false)} />
        )}
      </AnimatePresence>

      <motion.button
        onClick={toggleWidget}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center z-50 hover:shadow-xl transition-shadow"
      >
        <MessageSquare className="h-6 w-6" />
        {unreadCount > 0 && !isWidgetOpen && (
          <Badge 
            variant="destructive" 
            className="absolute -top-2 -right-2 h-6 w-6 flex items-center justify-center p-0 rounded-full border-2 border-background"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </motion.button>
    </>
  );
};

export default ChatWidget;