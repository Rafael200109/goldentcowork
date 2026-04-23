import React from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { User, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const ChatMessage = ({ message, currentUserId }) => {
  const isMine = message.sender_id === currentUserId;
  const isAdmin = message.sender_type === 'admin';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "flex w-full mb-4",
        isMine ? "justify-end" : "justify-start"
      )}
    >
      <div className={cn(
        "flex max-w-[80%] gap-2",
        isMine ? "flex-row-reverse" : "flex-row"
      )}>
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarFallback className={cn(
            isMine ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
          )}>
            {isAdmin ? <ShieldAlert className="h-4 w-4" /> : <User className="h-4 w-4" />}
          </AvatarFallback>
        </Avatar>
        
        <div className={cn(
          "flex flex-col gap-1",
          isMine ? "items-end" : "items-start"
        )}>
          <div className={cn(
            "px-4 py-2 rounded-2xl text-sm whitespace-pre-wrap break-words",
            isMine 
              ? "bg-primary text-primary-foreground rounded-tr-sm" 
              : "bg-muted text-foreground rounded-tl-sm"
          )}>
            {message.message}
          </div>
          <span className="text-[10px] text-muted-foreground">
            {format(new Date(message.created_at), 'HH:mm', { locale: es })}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default ChatMessage;