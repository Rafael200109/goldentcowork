import React from 'react';
import { Link } from 'react-router-dom';
import { useNotifications } from '@/contexts/NotificationsContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, CheckCheck, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';

const NotificationItem = ({ notification, onRead }) => (
  <div
    className={`flex items-start p-4 border-b transition-colors hover:bg-muted/50 ${!notification.is_read ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
  >
    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-secondary flex items-center justify-center mr-4">
      <Bell className="h-5 w-5 text-secondary-foreground" />
    </div>
    <div className="flex-grow">
      <p className="font-semibold">{notification.title}</p>
      <p className="text-sm text-muted-foreground">{notification.message}</p>
      <p className="text-xs text-muted-foreground mt-1">
        {format(new Date(notification.created_at), "d 'de' MMMM 'de' yyyy, h:mm a", { locale: es })}
      </p>
      {notification.link && (
        <Button variant="link" asChild className="p-0 h-auto mt-1">
          <Link to={notification.link}>Ver detalles</Link>
        </Button>
      )}
    </div>
    {!notification.is_read && (
      <Button variant="ghost" size="sm" onClick={() => onRead(notification.id)}>
        <CheckCheck className="mr-2 h-4 w-4" />
        Marcar como leída
      </Button>
    )}
  </div>
);

export const NotificationsPage = () => {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications();

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link to={-1}>
                <Button variant="outline" size="icon">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <CardTitle className="text-2xl">Mis Notificaciones</CardTitle>
            </div>
            {unreadCount > 0 && (
              <Button onClick={markAllAsRead}>
                <CheckCheck className="mr-2 h-4 w-4" />
                Marcar todas como leídas
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="border-t">
            {loading ? (
              <div className="p-4 space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[250px]" />
                      <Skeleton className="h-4 w-[200px]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications.length > 0 ? (
              notifications.map((notification) => (
                <NotificationItem key={notification.id} notification={notification} onRead={markAsRead} />
              ))
            ) : (
              <div className="text-center p-10">
                <Bell className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-lg font-medium">Todo al día</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  No tienes notificaciones. Te avisaremos cuando haya algo nuevo.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};