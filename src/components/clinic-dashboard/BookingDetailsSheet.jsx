import React, { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
    Tabs,
    TabsList,
    TabsTrigger,
    TabsContent
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Calendar, Clock, User, Building, DollarSign, AlertTriangle, Loader2, MessageCircle, FileText } from 'lucide-react';
import { es } from 'date-fns/locale';
import { useToast } from '@/components/ui/use-toast';
import { supabaseClient } from '@/config/supabaseConfig';
import { formatInTimeZone } from 'date-fns-tz';
import BookingChat from '@/components/chat/BookingChat';
import { useNavigate } from 'react-router-dom';

const InfoRow = ({ icon, label, value }) => (
  <div className="flex items-start space-x-3">
    <div className="mt-1">{icon}</div>
    <div>
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="text-base font-semibold">{value}</p>
    </div>
  </div>
);

const BookingDetailsSheet = ({ booking, isOpen, onClose, onBookingCancelled }) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isCancelling, setIsCancelling] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);

  const handleCancelBooking = async () => {
    if (!booking) return;
    setIsCancelling(true);
    try {
      const { error } = await supabaseClient.rpc('host_cancel_booking', { p_booking_id: booking.booking_id || booking.id });
      if (error) throw error;

      toast({
        variant: 'success',
        title: 'Reserva Cancelada',
        description: 'La reserva ha sido cancelada y se ha solicitado el reembolso.',
      });
      onBookingCancelled();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error al cancelar',
        description: error.message || 'No se pudo cancelar la reserva. Inténtalo de nuevo.',
      });
    } finally {
      setIsCancelling(false);
      setIsAlertOpen(false);
    }
  };

  const handleViewInvoice = () => {
    if (booking?.id || booking?.booking_id) {
        navigate(`/invoice/${booking.booking_id || booking.id}`);
    }
  };

  if (!booking) return null;

  const isCancellable = booking.status === 'confirmed';
  const isConfirmed = booking.status === 'confirmed';
  // Invoices are typically available for confirmed or completed bookings where payment is processed
  const hasInvoice = booking.status === 'confirmed' || booking.status === 'completed' || booking.status === 'paid';
  
  const timeZone = 'America/Santo_Domingo';
  
  const formatDate = (date, fmt) => {
    try {
      return formatInTimeZone(date, timeZone, fmt, { locale: es });
    } catch (e) {
      console.error("Error formatting date:", e);
      return "Fecha inválida";
    }
  };
  
  return (
    <>
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent className="sm:max-w-xl w-full flex flex-col h-full">
          <SheetHeader className="mb-4">
            <SheetTitle>Detalles de la Reserva</SheetTitle>
            <SheetDescription>
              Gestiona la reserva o comunícate con el odontólogo.
            </SheetDescription>
          </SheetHeader>
          
          <Tabs defaultValue="details" className="flex-1 flex flex-col h-full overflow-hidden">
            <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="details">Detalles</TabsTrigger>
                <TabsTrigger value="chat" disabled={!isConfirmed}>
                    <div className="flex items-center gap-2">
                        <MessageCircle className="w-4 h-4" />
                        Chat
                    </div>
                </TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="flex-1 overflow-y-auto pr-2">
                <div className="space-y-6 py-2">
                    <InfoRow
                    icon={<User className="h-5 w-5 text-primary" />}
                    label="Odontólogo"
                    value={booking.dentist_name || 'N/A'}
                    />
                    <InfoRow
                    icon={<Building className="h-5 w-5 text-primary" />}
                    label="Clínica"
                    value={booking.clinic_name || 'N/A'}
                    />
                    <Separator />
                    <InfoRow
                    icon={<Calendar className="h-5 w-5 text-primary" />}
                    label="Fecha"
                    value={formatDate(booking.start_time, "eeee, d 'de' MMMM, yyyy")}
                    />
                    <InfoRow
                    icon={<Clock className="h-5 w-5 text-primary" />}
                    label="Horario"
                    value={`${formatDate(booking.start_time, 'p')} - ${formatDate(booking.end_time, 'p')}`}
                    />
                    <Separator />
                    <InfoRow
                    icon={<DollarSign className="h-5 w-5 text-primary" />}
                    label="Precio Total"
                    value={`RD${Number(booking.total_price).toLocaleString('es-DO', { minimumFractionDigits: 2 })}`}
                    />
                    <InfoRow
                    icon={<AlertTriangle className="h-5 w-5 text-primary" />}
                    label="Estado"
                    value={booking.status}
                    />

                    {hasInvoice && (
                        <div className="pt-4">
                            <Button 
                                variant="outline" 
                                className="w-full border-primary/20 hover:border-primary/50 hover:bg-primary/5 text-primary"
                                onClick={handleViewInvoice}
                            >
                                <FileText className="w-4 h-4 mr-2" />
                                Ver Factura y Descargar PDF
                            </Button>
                        </div>
                    )}
                </div>
            </TabsContent>

            <TabsContent value="chat" className="flex-1 flex flex-col h-full overflow-hidden">
                {/* Task 6: Pass isHost to BookingChat */}
                <BookingChat booking={booking} isHost={true} />
            </TabsContent>
          </Tabs>

          <SheetFooter className="mt-auto pt-4 border-t">
            <SheetClose asChild>
              <Button variant="outline">Cerrar</Button>
            </SheetClose>
            {isCancellable && (
              <Button
                variant="destructive"
                onClick={() => setIsAlertOpen(true)}
                disabled={isCancelling}
              >
                {isCancelling ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <AlertTriangle className="mr-2 h-4 w-4" />
                )}
                Cancelar Reserva
              </Button>
            )}
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro de que quieres cancelar esta reserva?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción es irreversible. Se cancelará la reserva para el odontólogo y se iniciará una solicitud de reembolso a la plataforma. Asegúrate de que esta acción cumple con las políticas de cancelación.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCancelling}>No, mantener reserva</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelBooking} disabled={isCancelling} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isCancelling ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Sí, cancelar y reembolsar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default BookingDetailsSheet;