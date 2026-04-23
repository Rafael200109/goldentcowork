import React from 'react';
import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { useNotifications } from '@/contexts/NotificationsContext';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';

const NotificationItem = ({ notification, onRead }) => (
  <div
    className={`flex items-start p-3 transition-colors hover:bg-muted/50 ${!notification.is_read ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
    onClick={() => !notification.is_read && onRead(notification.id)}
  >
    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-secondary flex items-center justify-center mr-4">
      <Bell className="h-5 w-5 text-secondary-foreground" />
    </div>
    <div className="flex-grow">
      <p className="font-semibold text-sm">{notification.title}</p>
      <p className="text-xs text-muted-foreground">{notification.message}</p>
      <p className="text-xs text-muted-foreground mt-1">
        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: es })}
      </p>
    </div>
    {!notification.is_read && (
      <div className="flex-shrink-0 w-3 h-3 bg-blue-500 rounded-full self-center ml-2" title="No leído"></div>
    )}
  </div>
);

export function NotificationsPanel() {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications();

  const recentNotifications = notifications.slice(0, 5);

  // Automatically mark all notifications as read when the panel is opened
  const handleOpenChange = (isOpen) => {
    if (isOpen && unreadCount > 0) {
      markAllAsRead();
    }
  };

  return (
    <Popover onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 border-b">
          <h4 className="font-medium text-sm">Notificaciones</h4>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-4 space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="h-4 w-[150px]" />
                  </div>
                </div>
              ))}
            </div>
          ) : recentNotifications.length > 0 ? (
            recentNotifications.map((notification) => (
              <Link to={notification.link || '#'} key={notification.id} className="block cursor-pointer">
                <NotificationItem notification={notification} onRead={markAsRead} />
              </Link>
            ))
          ) : (
            <p className="p-4 text-center text-sm text-muted-foreground">No tienes notificaciones nuevas.</p>
          )}
        </div>
        <div className="p-2 border-t text-center">
          <Button variant="link" asChild className="w-full">
            <Link to="/notifications">Ver todas las notificaciones</Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}