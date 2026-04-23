import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useUser } from '@/contexts/UserContext';
import { 
  Tabs, 
  TabsList, 
  TabsTrigger, 
  TabsContent 
} from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { CalendarDays, Clock, User, FileText } from 'lucide-react';
import BookingChatButton from '@/components/chat/BookingChatButton';
import { format, isAfter, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

const ReservationCard = ({ booking }) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-card border rounded-xl shadow-sm hover:shadow-md transition-all gap-4">
       <div className="flex gap-4">
          <div className="bg-primary/10 p-3 rounded-full h-12 w-12 flex items-center justify-center shrink-0">
             <User className="w-6 h-6 text-primary" />
          </div>
          <div>
             <h4 className="font-bold text-foreground">{booking.dentist_name || 'Odontólogo'}</h4>
             <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-sm text-muted-foreground mt-1">
                <span className="flex items-center gap-1">
                   <CalendarDays className="w-3 h-3" />
                   {format(parseISO(booking.start_time), "dd MMM yyyy", { locale: es })}
                </span>
                <span className="hidden sm:inline">•</span>
                <span className="flex items-center gap-1">
                   <Clock className="w-3 h-3" />
                   {format(parseISO(booking.start_time), "h:mm a")} - {format(parseISO(booking.end_time), "h:mm a")}
                </span>
             </div>
             <p className="text-xs text-muted-foreground mt-1 font-medium">{booking.clinic?.name}</p>
          </div>
       </div>

       <div className="flex flex-col items-end gap-2 w-full sm:w-auto">
          <Badge variant={
             booking.status === 'confirmed' ? 'default' : 
             booking.status === 'pending' ? 'secondary' : 'outline'
          } className="capitalize">
             {booking.status === 'confirmed' ? 'Confirmada' : 
              booking.status === 'pending' ? 'Pendiente' : 
              booking.status === 'cancelled' ? 'Cancelada' : booking.status}
          </Badge>
          
          <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
             {(booking.status === 'confirmed' || booking.status === 'completed') && (
                <Button variant="outline" size="sm" onClick={() => navigate(`/invoice/${booking.id}`)}>
                    <FileText className="w-4 h-4 mr-2" />
                    Factura
                </Button>
             )}
             <BookingChatButton booking={booking} className="flex-1 sm:flex-none" />
          </div>
       </div>
    </div>
  );
};

const ReservationsList = () => {
  const { profile } = useUser();
  const [activeBookings, setActiveBookings] = useState([]);
  const [historyBookings, setHistoryBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.id) return;

    const fetchReservations = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('bookings')
          .select(`
            *,
            clinic:clinics!bookings_clinic_id_fkey (id, name, host_id),
            profiles!dentist_id (full_name, avatar_url)
          `)
          .eq('clinic.host_id', profile.id)
          .order('start_time', { ascending: false });

        if (error) throw error;

        const now = new Date();
        const active = [];
        const history = [];

        data.forEach(booking => {
           // Flatten dentist name for easier access
           const enrichedBooking = {
              ...booking,
              dentist_name: booking.profiles?.full_name,
              profiles: booking.profiles // Pass full profile object for chat
           };

           // Definition of active: Confirmed and NOT yet ended (end_time > now)
           // Actually, standard is usually Future Start Time, but if it's currently happening, it's active.
           // Prompt Task 5 says "Button disabled if end_time has passed".
           // Reservations list split: "Activas" (start_time > now). But we want to include current ones too?
           // Let's stick to the prompt from previous turn: "Activas (confirmed with start_time > now)"
           const isFuture = isAfter(parseISO(booking.start_time), now);
           
           if (booking.status === 'confirmed' && isFuture) {
              active.push(enrichedBooking);
           } else {
              history.push(enrichedBooking);
           }
        });

        active.sort((a, b) => new Date(a.start_time) - new Date(b.start_time));

        setActiveBookings(active);
        setHistoryBookings(history);

      } catch (err) {
        console.error("Error fetching reservations:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchReservations();
  }, [profile]);

  if (loading) {
    return (
      <div className="space-y-4">
         <Skeleton className="h-10 w-48 mb-6" />
         {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
       <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">Gestión de Reservas</h2>
       </div>

       <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
             <TabsTrigger value="active">Activas ({activeBookings.length})</TabsTrigger>
             <TabsTrigger value="history">Historial</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-6 space-y-4">
             {activeBookings.length > 0 ? (
                activeBookings.map(booking => (
                   <ReservationCard key={booking.id} booking={booking} />
                ))
             ) : (
                <div className="text-center py-12 bg-muted/30 rounded-xl border border-dashed">
                   <div className="bg-muted p-4 rounded-full inline-flex mb-3">
                      <CalendarDays className="w-6 h-6 text-muted-foreground" />
                   </div>
                   <h3 className="font-semibold text-lg">Sin reservas activas</h3>
                   <p className="text-muted-foreground">No tienes reservas confirmadas próximas.</p>
                </div>
             )}
          </TabsContent>

          <TabsContent value="history" className="mt-6 space-y-4">
             {historyBookings.length > 0 ? (
                historyBookings.map(booking => (
                   <ReservationCard key={booking.id} booking={booking} />
                ))
             ) : (
                <div className="text-center py-12 text-muted-foreground">
                   No hay historial de reservas.
                </div>
             )}
          </TabsContent>
       </Tabs>
    </div>
  );
};

export default ReservationsList;