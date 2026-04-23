import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, CheckCircle, XCircle, Loader2, FileText, X } from 'lucide-react';
import { es } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { formatInTimeZone } from 'date-fns-tz';
import BookingChatButton from '@/components/chat/BookingChatButton';

const BookingCard = ({ booking, onInvoiceClick, onCancelClick, currentUserId, cancellingBookingId }) => {
  const timeZone = 'America/Santo_Domingo';

  // Task 5: Calculate isHost
  const isHost = currentUserId === booking.clinic?.host_id;
  
  // Check if booking can be cancelled by dentist
  const canCancel = booking.status === 'confirmed' && new Date(booking.start_time) > new Date() && !isHost;

  const formatDate = (date, fmt) => {
    try {
      return formatInTimeZone(date, timeZone, fmt, { locale: es });
    } catch (e) {
      console.error("Error formatting date:", e);
      return "Fecha inválida";
    }
  };

  const statusConfig = {
    confirmed: { text: 'Confirmada', icon: <CheckCircle className="w-4 h-4" />, style: 'bg-blue-100 text-blue-800' },
    completed: { text: 'Completada', icon: <CheckCircle className="w-4 h-4" />, style: 'bg-green-100 text-green-800' },
    cancelled: { text: 'Cancelada', icon: <XCircle className="w-4 h-4" />, style: 'bg-red-100 text-red-800' },
    pending: { text: 'Pendiente', icon: <Clock className="w-4 h-4" />, style: 'bg-yellow-100 text-yellow-800' },
    cancelled_by_host: { text: 'Cancelada por Anfitrión', icon: <XCircle className="w-4 h-4" />, style: 'bg-orange-100 text-orange-800' },
    cancelled_by_dentist: { text: 'Cancelada por Ti', icon: <XCircle className="w-4 h-4" />, style: 'bg-purple-100 text-purple-800' },
  };

  const { text, icon, style } = statusConfig[booking.status] || { text: booking.status, icon: <Clock />, style: 'bg-gray-100 text-gray-800' };

  return (
    <Card className="transition-all hover:shadow-md">
      <CardContent className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex-grow">
          <p className="font-semibold text-primary">{booking.clinic.name}</p>
          <div className="flex items-center text-sm text-muted-foreground mt-1">
            <Calendar className="w-4 h-4 mr-2" />
            {formatDate(booking.start_time, "EEEE, d 'de' MMMM, yyyy")}
          </div>
          <div className="flex items-center text-sm text-muted-foreground mt-1">
            <Clock className="w-4 h-4 mr-2" />
            {`${formatDate(booking.start_time, 'p')} - ${formatDate(booking.end_time, 'p')}`}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 w-full sm:w-auto">
          <div className={`flex items-center gap-2 text-xs font-medium px-3 py-1 rounded-full self-start sm:self-center ${style}`}>
            {icon}
            <span className="capitalize">{text}</span>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            {(booking.status === 'confirmed' || booking.status === 'completed') && (
              <Button variant="outline" size="sm" onClick={() => onInvoiceClick(booking.id)}>
                <FileText className="w-4 h-4 mr-2" />
                Factura
              </Button>
            )}
            
            {canCancel && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onCancelClick(booking.id)} 
                disabled={cancellingBookingId === booking.id}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                {cancellingBookingId === booking.id ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <X className="w-4 h-4 mr-2" />
                )}
                {cancellingBookingId === booking.id ? 'Cancelando...' : 'Cancelar'}
              </Button>
            )}
            
            <BookingChatButton booking={booking} className="flex-1 sm:flex-none" isHost={isHost} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const MyBookingsPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingBookingId, setCancellingBookingId] = useState(null);

  const fetchBookings = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const now = new Date().toISOString();
      const { error: updateError } = await supabase
        .from('bookings')
        .update({ status: 'completed' })
        .eq('dentist_id', user.id)
        .eq('status', 'confirmed')
        .lt('end_time', now);

      if (updateError) console.warn("Update status error:", updateError);

      const { data, error } = await supabase
        .from('bookings')
        .select('*, clinic:clinics!bookings_clinic_id_fkey(name, host_id)')
        .eq('dentist_id', user.id)
        .order('start_time', { ascending: false });

      if (error) throw error;
      setBookings(data);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudieron cargar tus reservas.',
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleInvoiceClick = (bookingId) => {
    navigate(`/invoice/${bookingId}`);
  };

  const handleCancelBooking = async (bookingId) => {
    if (cancellingBookingId) return; // Prevent multiple cancellations
    
    setCancellingBookingId(bookingId);
    try {
      const { data, error } = await supabase.rpc('dentist_cancel_booking', {
        p_booking_id: bookingId
      });

      if (error) throw error;

      // Update local state
      setBookings(prev => prev.map(booking => 
        booking.id === bookingId 
          ? { ...booking, status: 'cancelled_by_dentist' }
          : booking
      ));

      toast({
        title: 'Reserva cancelada',
        description: data.message || 'Tu reserva ha sido cancelada exitosamente.',
      });

      // Refresh bookings to get updated data
      await fetchBookings();
      
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast({
        variant: 'destructive',
        title: 'Error al cancelar',
        description: error.message || 'No se pudo cancelar la reserva. Inténtalo de nuevo.',
      });
    } finally {
      setCancellingBookingId(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-4xl mx-auto"
    >
      <Card className="glassmorphism">
        <CardHeader>
          <CardTitle className="text-3xl font-bold gradient-text">Mis Reservas</CardTitle>
          <CardDescription>Aquí puedes ver y gestionar todas tus reservas de espacios.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="history" className="w-full">
            <TabsList className="grid w-full grid-cols-1">
              <TabsTrigger value="history">Historial</TabsTrigger>
            </TabsList>
            <TabsContent value="history" className="mt-6">
              {loading ? (
                <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin" /></div>
              ) : bookings.length > 0 ? (
                <div className="space-y-4">
                  {bookings.map(b => <BookingCard key={b.id} booking={b} onInvoiceClick={handleInvoiceClick} onCancelClick={handleCancelBooking} currentUserId={user.id} cancellingBookingId={cancellingBookingId} />)}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No tienes reservas en tu historial.</p>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  );
};