import React from 'react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const OnlineStatusBadge = ({ isOnline, lastSeen, size = 'md', showText = true, className }) => {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3'
  };

  const formatLastSeen = () => {
    if (!lastSeen) return 'Desconectado';
    
    try {
      const lastSeenDate = typeof lastSeen === 'string' ? parseISO(lastSeen) : lastSeen;
      return `Visto ${formatDistanceToNow(lastSeenDate, { 
        addSuffix: true, 
        locale: es 
      })}`;
    } catch (error) {
      return 'Desconectado';
    }
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="relative">
        <div
          className={cn(
            "rounded-full",
            sizeClasses[size],
            isOnline 
              ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" 
              : "bg-gray-400"
          )}
        />
        {isOnline && (
          <div
            className={cn(
              "absolute inset-0 rounded-full bg-green-500 animate-ping opacity-75",
              sizeClasses[size]
            )}
          />
        )}
      </div>
      
      {showText && (
        <span className="text-xs text-muted-foreground">
          {isOnline ? 'En línea' : formatLastSeen()}
        </span>
      )}
    </div>
  );
};

export default OnlineStatusBadge;