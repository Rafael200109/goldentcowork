import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, RefreshCw, Smartphone, Monitor } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { PayPalButtons, usePayPalScriptReducer } from "@paypal/react-paypal-js";
import { Separator } from '@/components/ui/separator';
import { usePayPal } from '@/contexts/PayPalContext';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import PaymentErrorBoundary from './PaymentErrorBoundary';

const PaymentForm = ({ totalPrice, onConfirm, isBooking, getBookingDetails }) => {
  const { toast } = useToast();
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const { error: contextError } = usePayPal();
  
  // Script reducer state
  const [{ isPending, isResolved, isRejected }, dispatch] = usePayPalScriptReducer();
  
  // Local state for timeout handling
  const [scriptTimeout, setScriptTimeout] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const timeoutRef = useRef(null);

  // Debug logging on mount
  useEffect(() => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const logData = {
      component: 'PaymentForm',
      event: 'mount',
      userAgent: navigator.userAgent,
      viewport: { width: window.innerWidth, height: window.innerHeight },
      isMobile,
      contextError,
      scriptStatus: { isPending, isResolved, isRejected }
    };

    if (import.meta.env.DEV) {
      console.log('💳 PaymentForm Debug:', logData);
    }
  }, []);

  // Monitor script loading with timeout
  useEffect(() => {
    if (isPending) {
      // Clear existing timeout if any
      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      // Set new timeout (10 seconds)
      timeoutRef.current = setTimeout(() => {
        if (isPending) {
          console.warn('⚠️ PayPal script load timed out (>10s)');
          setScriptTimeout(true);
        }
      }, 10000);
    } else {
      // Clear timeout if status changes
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (isResolved) setScriptTimeout(false);
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isPending, isResolved, retryCount]);

  const handleRetryPayPal = () => {
    setScriptTimeout(false);
    setRetryCount(prev => prev + 1);
    // Force reload of script options via dispatch if needed, 
    // but usually re-rendering or component key change handles it.
    // Here we rely on the ErrorBoundary or parent re-mount, 
    // or simply clearing the timeout allows the spinner to show if it was just slow.
    
    // In React-PayPal-JS, reloading the script might require a reset of the provider,
    // but often just updating options triggers it. For now, we mainly reset our timeout state.
    console.log('🔄 User requested PayPal retry');
    
    // Attempt to reload the script manually if using the reducer
    dispatch({ type: "setLoadingStatus", value: "pending" });
  };

  const handleCardnetPayment = async (e) => {
    e.preventDefault();
    setPaymentProcessing(true);
    
    console.log('💳 Initiating Cardnet payment flow', {
        amount: totalPrice,
        viewport: { width: window.innerWidth, height: window.innerHeight }
    });

    try {
      await onConfirm('Cardnet');
    } catch (error) {
      console.error('❌ Cardnet payment failed:', error);
      toast({
        variant: "destructive",
        title: "Error con Cardnet",
        description: "No se pudo procesar la solicitud de pago.",
      });
    } finally {
        setPaymentProcessing(false);
    }
  };

  const createOrder = (data, actions) => {
    try {
        const conversionRate = 58.5; 
        const priceInUsd = (totalPrice / conversionRate).toFixed(2);
        const bookingDetails = getBookingDetails();

        console.log('creating PayPal order', { priceInUsd, bookingDetails });

        return actions.order.create({
        purchase_units: [
            {
            description: `Reserva en ${bookingDetails.clinicName}`,
            amount: {
                currency_code: "USD",
                value: priceInUsd,
            },
            soft_descriptor: "GoldentCoWork"
            },
        ],
        application_context: {
            brand_name: 'Goldent Co Work',
            shipping_preference: 'NO_SHIPPING',
        }
        });
    } catch (err) {
        console.error("❌ Error creating PayPal order:", err);
        throw err;
    }
  };

  const onApprove = (data, actions) => {
    console.log('✅ PayPal approved, capturing...');
    return actions.order.capture().then(async (details) => {
      console.log('✅ PayPal captured:', details);
      const bookingDetails = getBookingDetails();
      const payPalDetails = {
        orderId: details.id,
        payerId: details.payer.payer_id,
        payerEmail: details.payer.email_address,
        payerName: `${details.payer.name.given_name} ${details.payer.name.surname}`,
        amount: details.purchase_units[0].payments.captures[0].amount.value,
        currency: details.purchase_units[0].payments.captures[0].amount.currency_code,
      };
      await onConfirm('PayPal', { bookingDetails, payPalDetails });
    }).catch(err => {
        console.error("❌ PayPal capture error:", err);
        toast({
            variant: "destructive",
            title: "Error en el pago con PayPal",
            description: "No se pudo capturar el pago. Por favor, inténtalo de nuevo.",
        });
    });
  };

  const onError = (err) => {
    console.error("❌ PayPal Checkout onError:", err);
    toast({
      variant: "destructive",
      title: "Error de PayPal",
      description: "Ocurrió un error con el proceso de pago de PayPal.",
    });
  };

  // UI Helpers
  const renderPayPalContent = () => {
    if (contextError) {
        return (
            <Alert variant="destructive" className="text-left">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>No disponible</AlertTitle>
                <AlertDescription>
                PayPal no está disponible en este momento ({contextError}).
                </AlertDescription>
            </Alert>
        );
    }

    if (scriptTimeout) {
        return (
            <div className="flex flex-col items-center justify-center p-6 border rounded-md bg-muted/30">
                <AlertCircle className="h-8 w-8 text-yellow-500 mb-2" />
                <p className="text-sm text-center mb-4 text-muted-foreground">
                    PayPal está tardando demasiado en cargar.
                </p>
                <Button variant="outline" size="sm" onClick={handleRetryPayPal}>
                    <RefreshCw className="mr-2 h-3 w-3" /> Reintentar
                </Button>
            </div>
        );
    }

    if (isPending) {
        return (
            <div className="flex flex-col items-center justify-center p-6 space-y-3 min-h-[150px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-xs text-muted-foreground animate-pulse">
                    Conectando con PayPal...
                </p>
            </div>
        );
    }

    if (isRejected) {
         return (
            <Alert variant="destructive" className="text-left">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error de conexión</AlertTitle>
                <AlertDescription>
                   No se pudo cargar el script de PayPal. Verifica tu conexión.
                   <Button variant="link" className="p-0 h-auto ml-2 text-white underline" onClick={handleRetryPayPal}>Reintentar</Button>
                </AlertDescription>
            </Alert>
        );
    }

    return (
        <div className="min-h-[150px] w-full flex items-center justify-center relative z-0">
             <PayPalButtons
                key={`paypal-btn-${retryCount}`}
                style={{ layout: "vertical", label: "pay", height: 48, shape: 'rect' }}
                createOrder={createOrder}
                onApprove={onApprove}
                onError={onError}
                disabled={isBooking}
                className="w-full max-w-full relative z-0"
            />
        </div>
    );
  };

  return (
    <div className="w-full max-w-full overflow-hidden">
      {/* Cardnet Section */}
      <div className="py-4 text-center">
        <div className="p-4 border rounded-lg bg-muted/50">
            <h3 className="font-semibold flex items-center justify-center gap-2">
                Pago con Link (Cardnet)
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground mt-2">
            Recibirás un link de pago por WhatsApp. Tienes 30 minutos para completar el pago.
            </p>
        </div>
        <Button 
            onClick={handleCardnetPayment} 
            className="w-full mt-4 text-base sm:text-lg h-12" 
            disabled={isBooking || paymentProcessing}
        >
            {isBooking || paymentProcessing ? (
            <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Procesando...
            </>
            ) : (
            `Confirmar RD$${totalPrice.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`
            )}
        </Button>
      </div>

      <div className="relative my-6">
        <Separator />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="bg-background px-2 text-xs text-muted-foreground uppercase tracking-wider">O paga con</span>
        </div>
      </div>

      {/* PayPal Section with Error Boundary */}
      <div className="text-center w-full min-h-[100px] relative">
        <PaymentErrorBoundary onRetry={handleRetryPayPal}>
            {renderPayPalContent()}
        </PaymentErrorBoundary>
      </div>

      {/* Mobile Device Helper Text */}
      <div className="mt-4 text-[10px] text-center text-muted-foreground flex justify-center items-center gap-1 opacity-60">
        {/iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ? (
            <><Smartphone className="h-3 w-3" /> Vista Móvil Detectada</>
        ) : (
            <><Monitor className="h-3 w-3" /> Vista Escritorio</>
        )}
      </div>
    </div>
  );
};

export default PaymentForm;