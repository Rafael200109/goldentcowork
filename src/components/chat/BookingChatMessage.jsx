import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Check, CheckCheck } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import ChatAttachmentMessage from './ChatAttachmentMessage';

const BookingChatMessage = ({ message, showReadReceipt = true }) => {
  const { user } = useAuth();
  const isMe = message.sender_id === user?.id;
  
  // Check if message has been read by the other party
  const isRead = message.read_receipts && message.read_receipts.length > 0 && 
    message.read_receipts.some(r => r.user_id !== user?.id);

  // Format message content with basic markdown support (only for text messages)
  const formatContent = (text) => {
    if (!text) return '';
    
    // Bold: **text** or __text__
    let formatted = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    formatted = formatted.replace(/__(.+?)__/g, '<strong>$1</strong>');
    
    // Italic: *text* or _text_
    formatted = formatted.replace(/\*(.+?)\*/g, '<em>$1</em>');
    formatted = formatted.replace(/_(.+?)_/g, '<em>$1</em>');
    
    // Links: [text](url)
    formatted = formatted.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="underline text-primary hover:text-primary/80">$1</a>');
    
    // Auto-link URLs
    formatted = formatted.replace(
      /(https?:\/\/[^\s]+)/g,
      '<a href="$1" target="_blank" rel="noopener noreferrer" class="underline text-primary hover:text-primary/80">$1</a>'
    );
    
    return formatted;
  };

  const isText = !message.content_type || message.content_type === 'text';

  return (
    <div 
      className={cn(
        "flex gap-3 group hover:bg-muted/30 transition-colors rounded-lg p-2 -mx-2",
        isMe ? "flex-row-reverse" : "flex-row"
      )}
    >
      <Avatar className="w-8 h-8 mt-1 flex-shrink-0">
        <AvatarImage src={message.sender?.avatar_url} alt={message.sender?.full_name} />
        <AvatarFallback className="text-xs">
          {message.sender?.full_name?.[0] || '?'}
        </AvatarFallback>
      </Avatar>

      <div className={cn("flex flex-col gap-1 max-w-[75%]", isMe && "items-end")}>
        {!isMe && (
          <span className="text-xs font-medium text-muted-foreground px-1">
            {message.sender?.full_name}
          </span>
        )}
        
        <div
          className={cn(
            "rounded-2xl px-4 py-2 text-sm shadow-sm break-words overflow-hidden",
            isMe
              ? "bg-primary text-primary-foreground rounded-tr-none"
              : "bg-muted text-foreground rounded-tl-none",
            !isText && "p-2" // Less padding for attachments container
          )}
        >
          {isText ? (
             <div 
               dangerouslySetInnerHTML={{ __html: formatContent(message.content) }}
               className="prose prose-sm max-w-none dark:prose-invert [&_a]:break-all"
             />
          ) : (
             <ChatAttachmentMessage message={message} isOwn={isMe} />
          )}
        </div>

        <div className={cn(
          "flex items-center gap-1.5 px-1 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity",
          isMe ? "flex-row-reverse" : "flex-row"
        )}>
          <span className={cn(
            "text-muted-foreground",
            isMe && "text-primary-foreground/70"
          )}>
            {formatDistanceToNow(parseISO(message.created_at), { 
              addSuffix: true, 
              locale: es 
            })}
          </span>
          
          {isMe && showReadReceipt && (
            <div className="text-primary-foreground/70" title={isRead ? "Leído" : "Enviado"}>
              {isRead ? (
                <CheckCheck className="w-3.5 h-3.5" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
            </div>
          )}
          
          {message.edited_at && (
            <span className="text-muted-foreground italic">
              (editado)
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingChatMessage;