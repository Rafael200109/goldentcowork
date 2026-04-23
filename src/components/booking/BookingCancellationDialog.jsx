import React, { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Clock, CheckCircle2 } from "lucide-react";
import { differenceInHours, parseISO, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from "@/components/ui/use-toast";

export function BookingCancellationDialog({ booking, triggerButton, onCancellationSuccess }) {
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  if (!booking) return null;

  const startTime = parseISO(booking.start_time);
  const hoursUntilStart = differenceInHours(startTime, new Date());
  const isRefundable = hoursUntilStart >= 24;
  const isPending = booking.status === 'pending';

  const handleCancel = async () => {
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.rpc('dentist_cancel_booking', {
        p_booking_id: booking.id,
        p_reason: reason
      });

      if (error) throw error;

      toast({
        title: "Reserva cancelada",
        description: data.message,
        variant: isRefundable || isPending ? "default" : "warning",
      });

      setIsOpen(false);
      if (onCancellationSuccess) onCancellationSuccess();

    } catch (error) {
      console.error('Error cancelling:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo cancelar la reserva.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        {triggerButton || <Button variant="destructive">Cancelar Reserva</Button>}
      </AlertDialogTrigger>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>¿Deseas cancelar esta reserva?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción no se puede deshacer. Por favor revisa las condiciones abajo.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="my-4 space-y-4">
          {/* Policy Banner */}
          <div className={`p-4 rounded-lg border flex items-start gap-3 ${
            isPending 
              ? 'bg-blue-50 border-blue-200 text-blue-800'
              : isRefundable 
                ? 'bg-green-50 border-green-200 text-green-800' 
                : 'bg-amber-50 border-amber-200 text-amber-800'
          }`}>
            {isPending ? (
               <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
            ) : isRefundable ? (
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            )}
            
            <div className="text-sm">
              <p className="font-semibold mb-1">
                {isPending 
                   ? 'Cancelación Gratuita'
                   : isRefundable 
                     ? 'Reembolso Completo Disponible' 
                     : 'Sin Reembolso (Cancelación Tardía)'}
              </p>
              <p className="opacity-90">
                {isPending 
                  ? 'La reserva aún no ha sido pagada. No se aplicarán cargos.'
                  : isRefundable 
                    ? `Faltan ${hoursUntilStart} horas para la cita (>24h). Recibirás el 100% de tu dinero de vuelta.`
                    : `Faltan solo ${hoursUntilStart} horas para la cita (<24h). Según los términos y condiciones, no aplica reembolso.`}
              </p>
            </div>
          </div>

          {/* Reason Input */}
          <div className="space-y-2">
            <Label htmlFor="reason">Motivo (Opcional)</Label>
            <Input 
              id="reason" 
              placeholder="Ej: Emergencia personal, cambio de planes..." 
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSubmitting}>Volver</AlertDialogCancel>
          <Button 
            variant="destructive" 
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Procesando..." : "Confirmar Cancelación"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}