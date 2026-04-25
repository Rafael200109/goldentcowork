import React, { useState } from 'react';
import { supabaseClient } from '@/config/supabaseConfig';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { emailService } from '@/lib/emailService';
import { format } from 'date-fns';

const BookingConfirmationActions = ({ booking, onActionComplete }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isLoadingConfirm, setIsLoadingConfirm] = useState(false);
  const [isLoadingCancel, setIsLoadingCancel] = useState(false);

  const handleConfirmPayment = async () => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo identificar al administrador.' });
      return;
    }
    
    // Check expiration - client side pre-check
    if (booking.expires_at && new Date(booking.expires_at) <= new Date()) {
        toast({ 
          variant: 'destructive', 
          title: 'Reserva Expirada', 
          description: 'Esta reserva ha expirado y no puede ser confirmada. Debes cancelarla o esperar a que el sistema la limpie.' 
        });
        return;
    }

    setIsLoadingConfirm(true);
    try {
      const { error } = await supabaseClient.rpc('confirm_cardnet_payment', {
        p_booking_id: booking.id,
        p_admin_id: user.id
      });
      
      if (error) {
        throw error;
      }
      
      // Send Confirmation Email for Cardnet
      try {
        if (booking.profiles?.email) {
            const emailData = {
                dentistName: booking.profiles.full_name,
                clinicName: booking.clinics?.name,
                date: format(new Date(booking.start_time), 'dd/MM/yyyy'),
                timeRange: `${format(new Date(booking.start_time), 'hh:mm a')} - ${format(new Date(booking.end_time), 'hh:mm a')}`,
                totalPrice: Number(booking.total_price).toLocaleString('es-DO', { minimumFractionDigits: 2 }),
                invoiceLink: `${window.location.origin}/invoice/${booking.id}`,
                transactionId: 'PAGO-MANUAL' // Placeholder for manual payments
            };
            await emailService.sendBookingConfirmation(booking.profiles.email, emailData);
        } else {
            console.warn("No dentist email found for notification");
        }
      } catch (emailErr) {
        console.error("Failed to send confirmation email", emailErr);
      }

      toast({
        title: 'Reserva Confirmada',
        description: 'La reserva ha sido marcada como pagada y el correo de confirmación ha sido enviado.',
        className: "bg-green-100 border-green-300 text-green-800"
      });
      
      if (onActionComplete) onActionComplete();
    } catch (error) {
      console.error("Confirmation Error:", error);
      toast({
        variant: 'destructive',
        title: 'Error al confirmar',
        description: error.message || 'Ocurrió un error inesperado al procesar la confirmación.',
      });
    } finally {
      setIsLoadingConfirm(false);
    }
  };

  const handleCancelBooking = async () => {
    setIsLoadingCancel(true);
    try {
      const { error } = await supabaseClient.rpc('cancel_pending_booking', {
        p_booking_id: booking.id
      });
      if (error) throw error;

      toast({
        title: 'Reserva Cancelada',
        description: 'La reserva ha sido cancelada y el usuario notificado.',
      });
      
      if (onActionComplete) onActionComplete();
    } catch (error) {
      console.error("Cancellation Error:", error);
      toast({
        variant: 'destructive',
        title: 'Error al cancelar',
        description: error.message || 'No se pudo cancelar la reserva.',
      });
    } finally {
      setIsLoadingCancel(false);
    }
  };

  const isLoading = isLoadingConfirm || isLoadingCancel;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0" disabled={isLoading}> 
          <span className="sr-only">Abrir menú</span>
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : <MoreHorizontal className="h-4 w-4" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleConfirmPayment} disabled={isLoading} className="cursor-pointer"> 
          {isLoadingConfirm ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
          )}
          {isLoadingConfirm ? 'Procesando...' : 'Confirmar Pago'} 
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleCancelBooking} disabled={isLoading} className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"> 
          {isLoadingCancel ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <XCircle className="mr-2 h-4 w-4" />
          )}
          {isLoadingCancel ? 'Procesando...' : 'Cancelar Reserva'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default BookingConfirmationActions;