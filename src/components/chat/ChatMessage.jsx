import React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Check, CheckCheck } from 'lucide-react';

const ChatMessage = ({ message, isOwnMessage }) => {
  const formattedTime = format(new Date(message.created_at), 'h:mm a', { locale: es });

  return (
    <div
      className={cn(
        "flex w-full gap-3 mb-4",
        isOwnMessage ? "justify-end" : "justify-start"
      )}
    >
      {!isOwnMessage && (
        <Avatar className="w-8 h-8 mt-1">
          <AvatarImage src={message.sender?.avatar_url} />
          <AvatarFallback className="bg-primary/10 text-primary text-xs">
            {message.sender?.full_name?.substring(0, 2).toUpperCase() || 'US'}
          </AvatarFallback>
        </Avatar>
      )}

      <div
        className={cn(
          "max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm relative group",
          isOwnMessage
            ? "bg-primary text-primary-foreground rounded-tr-sm"
            : "bg-white dark:bg-card border border-border/50 text-foreground rounded-tl-sm"
        )}
      >
        {!isOwnMessage && (
          <p className="text-[10px] font-bold text-muted-foreground/70 mb-1 opacity-70">
            {message.sender?.full_name}
          </p>
        )}
        
        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
            {message.content}
        </p>
        
        <div className={cn(
            "flex items-center gap-1 justify-end mt-1",
             isOwnMessage ? "text-primary-foreground/70" : "text-muted-foreground/70"
        )}>
          <span className="text-[10px] font-medium">{formattedTime}</span>
          {isOwnMessage && (
            <span>
              {message.is_read ? (
                <CheckCheck className="w-3 h-3" />
              ) : (
                <Check className="w-3 h-3" />
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;