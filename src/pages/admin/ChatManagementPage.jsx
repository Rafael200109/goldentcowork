import React from 'react';
import { motion } from 'framer-motion';
import ChatPanel from '@/components/chat-v2/ChatPanel';

const ChatManagementPage = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Soporte en Tiempo Real</h1>
        <p className="text-muted-foreground mt-1">Gestiona los chats temporales de soporte con los usuarios.</p>
      </div>

      <ChatPanel />
    </motion.div>
  );
};

export default ChatManagementPage;