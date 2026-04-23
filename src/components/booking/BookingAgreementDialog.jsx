import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import PaymentForm from '@/components/booking/PaymentForm';
import { AlertCircle, FileText, User, Shield, Clock } from 'lucide-react';
import { format } from 'date-fns';
import PaymentErrorBoundary from './PaymentErrorBoundary';

const BookingAgreementDialog = ({ isOpen, onClose, onConfirm, isBooking, clinic, userProfile, totalPrice, getBookingDetails }) => {
  const safeDate = (isoString) => {
    if (!isoString) return null;
    const date = new Date(isoString);
    return Number.isNaN(date.getTime()) ? null : date;
  };

  const bookingDetails = isOpen ? getBookingDetails() : null;
  const startDate = safeDate(bookingDetails?.startTime);
  const endDate = safeDate(bookingDetails?.endTime);
  const formattedDate = startDate ? format(startDate, 'dd/MM/yyyy') : '-';
  const formattedTimeRange = startDate && endDate
    ? `${format(startDate, 'hh:mm a')} - ${format(endDate, 'hh:mm a')}`
    : '-';
  const cubicleCapacity = clinic?.number_of_cubicles ? `${clinic.number_of_cubicles} cubículos` : '1 cubículo';

  const handleDialogChange = (open) => {
    if (!isBooking && !open) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogChange}>
      <DialogContent className="w-[95vw] sm:max-w-xl md:max-w-2xl lg:max-w-3xl max-h-[90vh] flex flex-col p-4 sm:p-6 overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-xl sm:text-2xl font-bold flex items-center">
            <FileText className="mr-3 h-5 w-5 sm:h-6 sm:w-6 text-primary flex-shrink-0" />
            Confirmación y Acuerdo
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Revisa los detalles antes de pagar.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-grow pr-2 sm:pr-4 -mr-2 sm:-mr-4 h-full">
          <div className="space-y-4 sm:space-y-6 my-2 pb-4">
            {/* User Info */}
            <div className="p-3 sm:p-4 border rounded-lg bg-muted/50">
              <h3 className="font-semibold text-base sm:text-lg flex items-center mb-2 sm:mb-3">
                <User className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                Información del Profesional
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs sm:text-sm">
                <div className="flex justify-between sm:block">
                  <span className="text-muted-foreground sm:text-foreground">Nombre:</span>
                  <span className="font-medium ml-2">{userProfile?.full_name}</span>
                </div>
                <div className="flex justify-between sm:block">
                  <span className="text-muted-foreground sm:text-foreground">Cédula/ID:</span>
                  <span className="font-medium ml-2">{userProfile?.dentist_id_document_number}</span>
                </div>
              </div>
            </div>

            {/* Booking Details */}
            <div className="p-3 sm:p-4 border rounded-lg bg-muted/50">
              <h3 className="font-semibold text-base sm:text-lg flex items-center mb-2 sm:mb-3">
                <Clock className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                Detalles de la Reserva
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs sm:text-sm">
                <div className="flex justify-between sm:block">
                    <span className="text-muted-foreground sm:text-foreground">Clínica:</span>
                    <span className="font-medium ml-2 text-right sm:text-left">{clinic?.name}</span>
                </div>
                <div className="flex justify-between sm:block mt-1 sm:mt-0">
                    <span className="text-muted-foreground sm:text-foreground">Ubicación:</span>
                    <span className="font-medium ml-2 text-right sm:text-left truncate max-w-[150px] sm:max-w-none">{clinic?.address_city}</span>
                </div>
                <div className="flex justify-between sm:block mt-1 sm:mt-0">
                    <span className="text-muted-foreground sm:text-foreground">Fecha:</span>
                    <span className="font-medium ml-2 text-right sm:text-left">{formattedDate}</span>
                </div>
                <div className="flex justify-between sm:block mt-1 sm:mt-0">
                    <span className="text-muted-foreground sm:text-foreground">Horario:</span>
                    <span className="font-medium ml-2 text-right sm:text-left">{formattedTimeRange}</span>
                </div>
                <div className="flex justify-between sm:block mt-1 sm:mt-0">
                    <span className="text-muted-foreground sm:text-foreground">Capacidad:</span>
                    <span className="font-medium ml-2 text-right sm:text-left">{cubicleCapacity}</span>
                </div>
              </div>
            </div>

            {/* Terms */}
            <div className="p-3 sm:p-4 border rounded-lg bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300">
                <h3 className="font-semibold text-base sm:text-lg flex items-center mb-2 sm:mb-3">
                    <AlertCircle className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                    Términos Clave
                </h3>
                <div className="h-32 sm:h-40 overflow-y-auto pr-2 text-xs sm:text-sm space-y-2">
                  <ul className="space-y-2 list-disc list-inside">
                      <li>
                          <span className="font-semibold">Política de Cancelación:</span> Más de 48h para reembolso parcial.
                      </li>
                      <li>
                          <span className="font-semibold">Responsabilidad:</span> Eres responsable por daños al equipo.
                      </li>
                      <li>
                          <span className="font-semibold">Uso del Espacio:</span> Exclusivo para odontología.
                      </li>
                      <li>
                          <span className="font-semibold">Horario:</span> Respetar estrictamente entrada y salida.
                      </li>
                      <li>
                          <span className="font-semibold">Seguro:</span> Se recomienda tener seguro de responsabilidad civil.
                      </li>
                  </ul>
                </div>
            </div>
          </div>
        </ScrollArea>
        
        <DialogFooter className="pt-2 sm:pt-4 border-t mt-auto w-full">
            <PaymentErrorBoundary>
                <PaymentForm 
                    totalPrice={totalPrice} 
                    onConfirm={onConfirm} 
                    isBooking={isBooking}
                    getBookingDetails={getBookingDetails}
                />
            </PaymentErrorBoundary>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BookingAgreementDialog;