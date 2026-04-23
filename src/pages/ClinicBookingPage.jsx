import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { useUser } from '@/contexts/UserContext';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  FiArrowLeft, FiLoader, FiClock, FiCalendar, FiDollarSign,
  FiCheckCircle, FiMapPin, FiAlertCircle, FiMessageSquare, FiEdit2, FiGrid
} from 'react-icons/fi';
import { es } from 'date-fns/locale';
import { format, startOfDay, getYear, differenceInHours, parse, isToday, getHours } from 'date-fns';
import { zonedTimeToUtc } from 'date-fns-tz';
import BookingAgreementDialog from '@/components/booking/BookingAgreementDialog';
import TimeRangeSelector from '@/components/ui/TimeRangeSelector';
import ClinicMap from '@/components/ui/ClinicMap';
import { processCardnetPayment } from '@/lib/payments/cardnet';
import { processPayPalPayment } from '@/lib/payments/paypal';
import ReviewStars from '@/components/reviews/ReviewStars';
import ReviewCard from '@/components/reviews/ReviewCard';
import ReviewStats from '@/components/reviews/ReviewStats';
import ReviewModal from '@/components/reviews/ReviewModal';
import { emailService } from '@/lib/emailService';
import ClinicServicesDisplay from '@/components/booking/ClinicServicesDisplay';
import FavoriteButton from '@/components/ui/FavoriteButton';
import ClinicDescriptionDisplay from '@/components/booking/ClinicDescriptionDisplay';
import { generateWhatsAppMessage, redirectToWhatsApp } from '@/lib/whatsappService';
import PhotoCarouselContainer from '@/components/booking/carousel/PhotoCarouselContainer';
import ClinicPoliciesSection from '@/components/booking/ClinicPoliciesSection';

const ClinicBookingPage = () => {
  const { clinicId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const { profile } = useUser();

  const [clinic, setClinic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isBooking, setIsBooking] = useState(false);
  const [selectedDate, setSelectedDate] = useState(undefined);
  
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [duration, setDuration] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);
  const [bookingError, setBookingError] = useState('');
  
  const [availableSlots, setAvailableSlots] = useState([]);
  const [isFetchingSlots, setIsFetchingSlots] = useState(false);
  const [isAgreementDialogOpen, setIsAgreementDialogOpen] = useState(false);

  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState({ average_rating: 0, review_count: 0 });
  const [userHasReviewed, setUserHasReviewed] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [hasConfirmedBooking, setHasConfirmedBooking] = useState(false);
  const [canReview, setCanReview] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const fetchClinicDetails = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('clinics')
      .select(`*,
        host:profiles!host_id (full_name, dentist_id_document_number, host_rnc, avatar_url, created_at),
        clinic_photos ( id, photo_url, is_cover, display_order )`)
      .eq('id', clinicId)
      .single();

    if (error) {
      toast({ variant: "destructive", title: "Error", description: "No se pudo cargar la clínica." });
      navigate('/search-clinics');
    } else {
      const sortedPhotos = (data.clinic_photos || []).sort((a, b) => a.display_order - b.display_order);
      setClinic({ 
        ...data, 
        clinic_photos: sortedPhotos,
        address: `${data.address_street}, ${data.address_sector}, ${data.address_city}, ${data.address_province}` 
      });
    }
    setLoading(false);
  }, [clinicId, navigate, toast]);

  const fetchReviewsAndCheckUser = useCallback(async () => {
    if (!clinicId) return;
    
    const { data: stats, error: statsError } = await supabase
      .rpc('get_clinic_average_rating', { p_clinic_id: clinicId })
      .single();

    if (!statsError) setReviewStats(stats);

    const { data: reviewsData, error: reviewsError } = await supabase
      .from('clinic_reviews')
      .select('*, profiles (full_name, avatar_url)')
      .eq('clinic_id', clinicId)
      .order('created_at', { ascending: false });
    
    if (!reviewsError) setReviews(reviewsData || []);

    if (user) {
      const { data: userReview } = await supabase
        .from('clinic_reviews')
        .select('id')
        .eq('clinic_id', clinicId)
        .eq('user_id', user.id)
        .maybeSingle();
      
      setUserHasReviewed(!!userReview);

      const { data: pastBooking } = await supabase
        .from('bookings')
        .select('id')
        .eq('clinic_id', clinicId)
        .eq('dentist_id', user.id)
        .eq('status', 'confirmed')
        .lt('end_time', new Date().toISOString())
        .limit(1)
        .maybeSingle();
        
      setCanReview(!!pastBooking && !userReview);

      const { data: anyBooking } = await supabase
        .from('bookings')
        .select('id')
        .eq('clinic_id', clinicId)
        .eq('dentist_id', user.id)
        .eq('status', 'confirmed')
        .limit(1)
        .maybeSingle();
      
      setHasConfirmedBooking(!!anyBooking);
      
      if (location.state?.openReviewModal && !!pastBooking && !userReview) {
          setIsReviewModalOpen(true);
      }
    }

  }, [clinicId, user, location.state]);

  useEffect(() => { 
    fetchClinicDetails();
    fetchReviewsAndCheckUser();
  }, [fetchClinicDetails, fetchReviewsAndCheckUser]);

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setStartTime(null);
    setEndTime(null);
    setBookingError('');
  };

  useEffect(() => {
    const fetchSlots = async () => {
      if (!selectedDate || !clinicId || !clinic) return setAvailableSlots([]);
      setIsFetchingSlots(true);
      setStartTime(null);
      setEndTime(null);

      try {
        const dateString = format(selectedDate, 'yyyy-MM-dd');
        
        const { data, error } = await supabase.rpc('get_available_time_slots', { 
          p_clinic_id: clinicId, 
          p_booking_date: dateString,
          p_duration_hours: clinic.min_hours_booking || 1
        });
        if (error) throw error;

        let slots = data;
        if (isToday(selectedDate)) {
          const currentHour = getHours(new Date());
          slots = data.filter(slot => {
            const slotHour = parseInt(slot.time_slot.split(':')[0], 10);
            return slotHour > currentHour;
          });
        }
        setAvailableSlots(slots);

      } catch (error) {
        toast({ variant: "destructive", title: "Error de disponibilidad", description: `No se pudieron cargar los horarios: ${error.message}` });
        setAvailableSlots([]);
      } finally {
        setIsFetchingSlots(false);
      }
    };
    fetchSlots();
  }, [selectedDate, clinicId, clinic, toast]);

  useEffect(() => {
    if (startTime && endTime && selectedDate) {
      const dateString = format(selectedDate, 'yyyy-MM-dd');
      const startDateTime = parse(`${dateString} ${startTime}`, 'yyyy-MM-dd HH:mm:ss', new Date());
      const endDateTime = parse(`${dateString} ${endTime}`, 'yyyy-MM-dd HH:mm:ss', new Date());
      
      if (endDateTime <= startDateTime) {
        setBookingError("La hora de fin debe ser posterior a la hora de inicio.");
        setDuration(0);
        setTotalPrice(0);
        return;
      }

      const newDuration = differenceInHours(endDateTime, startDateTime);
      setDuration(newDuration);
      setTotalPrice(clinic ? clinic.price_per_hour * newDuration : 0);

      if (newDuration < (clinic?.min_hours_booking || 4)) {
        setBookingError(`La duración mínima de la reserva es de ${clinic.min_hours_booking} horas.`);
      } else {
        setBookingError('');
      }
    } else {
      setDuration(0);
      setTotalPrice(0);
    }
  }, [startTime, endTime, selectedDate, clinic]);

  const handleOpenAgreement = () => {
    if (!user) {
      toast({ variant: "destructive", title: "Acción requerida", description: "Debes iniciar sesión para reservar." });
      return navigate('/login');
    }
    if (!profile || !profile.full_name || !profile.dentist_id_document_number) {
      toast({ variant: "destructive", title: "Perfil Incompleto", description: "Por favor, completa tu perfil antes de realizar una reserva.", action: <Button onClick={() => navigate('/profile')}>Ir al Perfil</Button> });
      return;
    }
    if (!selectedDate || !startTime || !endTime || bookingError) {
      return toast({ variant: "destructive", title: "Faltan datos", description: "Por favor, completa todos los campos de la reserva correctamente." });
    }
    setIsAgreementDialogOpen(true);
  };

  const handleConfirmBooking = async (paymentMethod, paymentData) => {
    setIsBooking(true);
    try {
        if (paymentMethod === 'Cardnet') {
            const bookingDetails = getBookingDetails();
            const result = await processCardnetPayment(bookingDetails);
            const finalBookingId = result?.bookingId || result?.id || result || 'ID_PENDIENTE';
            
            toast({ 
              title: "¡Reserva iniciada!", 
              description: "Redirigiendo a WhatsApp para completar tu pago. Tu reserva expirará en 75 minutos.", 
              duration: 3000 
            });
            
            try {
                const message = generateWhatsAppMessage(clinic.name, finalBookingId, selectedDate, duration, totalPrice);
                redirectToWhatsApp(message);
            } catch (whatsappErr) {
                console.error("WhatsApp Redirection Error:", whatsappErr);
                navigate('/my-bookings');
            }
            
            setIsAgreementDialogOpen(false);
            return; 

        } else if (paymentMethod === 'PayPal') {
            const { bookingDetails, payPalDetails } = paymentData;
            const result = await processPayPalPayment(bookingDetails, payPalDetails);
            
            try {
              const emailData = {
                dentistName: profile.full_name,
                clinicName: clinic.name,
                date: format(selectedDate, 'dd/MM/yyyy'),
                timeRange: `${format(parse(startTime, 'HH:mm:ss', new Date()), 'hh:mm a')} - ${format(parse(endTime, 'HH:mm:ss', new Date()), 'hh:mm a')}`,
                totalPrice: totalPrice.toLocaleString('es-DO', { minimumFractionDigits: 2 }),
                invoiceLink: `${window.location.origin}/invoice/${result.bookingId}`,
                transactionId: payPalDetails.orderId
              };
              await emailService.sendBookingConfirmation(user.email, emailData);
            } catch (emailErr) {
              console.error("Failed to send confirmation email", emailErr);
            }

            toast({
              title: "¡Reserva Confirmada!",
              description: "Tu pago con PayPal ha sido exitoso. Hemos enviado la factura a tu correo.",
            });
            navigate('/my-bookings');
        } else {
            throw new Error("Método de pago no soportado.");
        }
        
    } catch (error) {
        console.error('Booking Error:', error);
        toast({ 
            variant: "destructive", 
            title: "Error en la Reserva", 
            description: `No se pudo completar la reserva: ${error.message}. Por favor intenta nuevamente.` 
        });
        setIsBooking(false);
    } finally {
        setIsAgreementDialogOpen(false);
    }
  };
  
  const getBookingDetails = () => {
     const dateString = format(selectedDate, 'yyyy-MM-dd');
     const timeZone = 'America/Santo_Domingo';
     const startDateTimeUTC = zonedTimeToUtc(`${dateString}T${startTime}`, timeZone);
     const endDateTimeUTC = zonedTimeToUtc(`${dateString}T${endTime}`, timeZone);

     return {
        clinicId,
        userId: user.id,
        startTime: startDateTimeUTC.toISOString(),
        endTime: endDateTimeUTC.toISOString(),
        totalPrice,
        clinicName: clinic.name,
    };
  }

  const handleReviewSubmitted = () => {
    fetchReviewsAndCheckUser();
    setReviewStats(prev => ({ ...prev })); 
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <FiLoader className="w-12 h-12 animate-spin text-primary mb-4" />
      <h2 className="text-xl font-semibold text-muted-foreground">Cargando detalles...</h2>
    </div>
  );

  if (!clinic) return (
    <div className="text-center py-20">
      <h2 className="text-2xl font-bold text-destructive">Clínica no encontrada</h2>
      <Button onClick={() => navigate('/search-clinics')} className="mt-4">Volver</Button>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="max-w-6xl mx-auto px-4">
      <div className="mb-4 pt-0 flex justify-between items-center">
        <Button variant="ghost" onClick={() => navigate(-1)} className="flex items-center text-muted-foreground hover:text-foreground transition p-0">
          <FiArrowLeft className="w-4 h-4 mr-2" /> Volver
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10">
        <div className="lg:col-span-2 space-y-6">
          
          <div className="space-y-3">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
               <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight gradient-text">{clinic.name}</h1>
               <div className="flex items-center gap-2 pt-1">
                 <ReviewStars value={reviewStats.average_rating} size="sm" />
                 <span className="text-muted-foreground font-medium text-sm">
                   ({reviews.length} {reviews.length === 1 ? 'reseña' : 'reseñas'})
                 </span>
               </div>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <FiMapPin className="w-4 h-4" />
              <span>{clinic.address_sector}, {clinic.address_city}</span>
            </div>
          </div>

          <div className="relative">
             <PhotoCarouselContainer photos={clinic.clinic_photos} />
             <div className="absolute top-4 right-4 z-10">
                <FavoriteButton clinicId={clinic.id} size="lg" className="bg-white/80 hover:bg-white shadow-lg" />
             </div>
          </div>

          <div className="flex items-center gap-3 py-1">
             {clinic.host && (
                <div className="flex items-center gap-3 px-3 py-2 rounded-lg border bg-white/50 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-300 w-fit">
                  <div className="relative">
                    <Avatar className="h-10 w-10 border border-white shadow-sm">
                      <AvatarImage src={clinic.host.avatar_url} alt={clinic.host.full_name} className="object-cover" />
                      <AvatarFallback>{clinic.host.full_name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 bg-[#6BA83D] rounded-full p-0.5 text-white shadow-sm ring-1 ring-white">
                      <FiGrid className="w-2.5 h-2.5" />
                    </div>
                  </div>
                  <div className="space-y-0.5">
                    <h3 className="font-semibold text-sm text-foreground">
                      Anfitrión: {clinic.host.full_name.split(' ')[0]}
                    </h3>
                    <p className="text-muted-foreground text-xs">
                      Superanfitrión · {Math.max(1, new Date().getFullYear() - new Date(clinic.host.created_at).getFullYear())} años anfitrionando
                    </p>
                  </div>
                </div>
              )}
          </div>

          <div className="py-4 border-t">
             <ClinicDescriptionDisplay content={clinic.description} />
          </div>
          
          <div className="py-2 border-t">
            <ClinicServicesDisplay clinicId={clinic.id} />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="py-4 border-t"
          >
            <ClinicPoliciesSection clinicId={clinic.id} />
          </motion.div>

          <motion.div
             initial={{ opacity: 0, y: 15 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.4, delay: 0.15 }}
             className="pt-6 border-t"
          >
             <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold flex items-center text-primary">
                  <FiMessageSquare className="w-6 h-6 mr-3" />
                  Experiencia de Colegas
                </h3>
                {user && profile?.role === 'dentist' && !userHasReviewed && canReview && (
                  <Button onClick={() => setIsReviewModalOpen(true)} variant="secondary" size="sm">
                    <FiEdit2 className="w-4 h-4 mr-2" />
                    Escribir Reseña
                  </Button>
                )}
             </div>
             
             <ReviewStats clinicId={clinic.id} />
             
             {reviews.length > 0 ? (
                <div className="space-y-4 mt-2">
                  {reviews.map(review => <ReviewCard key={review.id} review={review} />)}
                </div>
              ) : (
                <div className="text-center py-6 bg-muted/20 rounded-xl border border-dashed">
                  <p className="text-muted-foreground text-sm italic">Esta clínica aún no tiene reseñas. ¡Sé el primero en dejar una!</p>
                </div>
              )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="py-6 border-t"
          >
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold flex items-center text-primary">
                    <FiMapPin className="w-6 h-6 mr-3" />
                    Ubicación
                </h3>
                {hasConfirmedBooking && (
                     <span className="text-xs font-bold bg-green-100 text-green-800 px-2 py-1 rounded-full flex items-center">
                        <FiCheckCircle className="w-3 h-3 mr-1" /> Ubicación Exacta Desbloqueada
                     </span>
                )}
            </div>
            <div className="h-[400px] w-full rounded-xl overflow-hidden shadow-sm border">
              <ClinicMap 
                clinics={[clinic]} 
                isBehindModal={isAgreementDialogOpen || isReviewModalOpen} 
                variant={hasConfirmedBooking ? 'exact' : 'approximate'} 
              />
            </div>
            {!hasConfirmedBooking && (
                <p className="text-[10px] text-muted-foreground mt-2 text-center italic">
                    * La ubicación exacta se mostrará una vez confirmada la reserva por motivos de seguridad.
                </p>
            )}
          </motion.div>

        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-24">
            <Card className="shadow-2xl rounded-2xl border-border max-w-full lg:max-w-none mx-auto overflow-hidden">
              <CardHeader className="p-5 border-b bg-muted/10">
                <CardTitle className="text-lg">Reservar Espacio</CardTitle>
                <CardDescription className="text-base">
                  <span className="font-bold text-[hsl(var(--booking-price-green-light))] text-xl">RD${clinic.price_per_hour.toLocaleString()}</span> / hora
                  <span className="text-muted-foreground text-sm"> (mín. {clinic.min_hours_booking}h)</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 space-y-5">
                <div className="space-y-2">
                  <Label className="font-semibold text-sm flex items-center">
                    <FiCalendar className="w-4 h-4 mr-2 text-[hsl(var(--booking-price-green-light))]" />
                    Fecha
                  </Label>
                  <div className="calendar-wrapper border rounded-xl shadow-sm bg-card">
                    <Calendar 
                      mode="single" 
                      selected={selectedDate} 
                      onSelect={handleDateSelect} 
                      className="w-full"
                      disabled={(date) => date < startOfDay(new Date())} 
                      locale={es} 
                      captionLayout="dropdown-nav" 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="font-semibold text-sm flex items-center">
                    <FiClock className="w-4 h-4 mr-2 text-[hsl(var(--booking-price-green-light))]" />
                    Horario
                  </Label>
                  <TimeRangeSelector
                    availableSlots={availableSlots}
                    startTime={startTime}
                    setStartTime={setStartTime}
                    endTime={endTime}
                    setEndTime={setEndTime}
                    disabled={!selectedDate}
                    isFetching={isFetchingSlots}
                    minBookingHours={clinic.min_hours_booking}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="font-semibold text-sm flex items-center">
                    <FiGrid className="w-4 h-4 mr-2 text-[hsl(var(--booking-price-green-light))]" />
                    Capacidad de Cubículos
                  </Label>
                  <div className="px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700">
                    Esta clínica puede aceptar hasta <span className="font-semibold">{clinic?.number_of_cubicles || 1}</span> reservas para el mismo horario.
                  </div>
                </div>

                {bookingError && (
                  <div className="flex items-center p-2.5 text-xs text-red-800 rounded-lg bg-red-50" role="alert">
                    <FiAlertCircle className="flex-shrink-0 inline w-3.5 h-3.5 mr-2" />
                    <span>{bookingError}</span>
                  </div>
                )}

                <div className="border-t pt-4 space-y-2.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Duración</span>
                    <span className="font-semibold">{duration} {duration === 1 ? 'hora' : 'horas'}</span>
                  </div>
                  {startTime && endTime && (
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground">Horario</span>
                      <span className="font-semibold">
                        {format(parse(startTime, 'HH:mm:ss', new Date()), 'hh:mm a')} - {format(parse(endTime, 'HH:mm:ss', new Date()), 'hh:mm a')}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-1">
                    <span className="font-semibold text-sm">Total</span>
                    <span className="font-bold text-[hsl(var(--booking-price-green-light))] text-lg">RD${totalPrice.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>

                <Button 
                  size="lg" 
                  className="w-full text-base bg-[hsl(var(--booking-price-green-light))] hover:bg-[hsl(var(--booking-price-green-light))/90] text-primary-foreground transition-all shadow-md h-12 rounded-xl" 
                  onClick={handleOpenAgreement} 
                  disabled={!selectedDate || !startTime || !endTime || !!bookingError || isBooking}
                >
                  {isBooking ? <FiLoader className="w-5 h-5 mr-2 animate-spin" /> : <FiDollarSign className="w-5 h-5 mr-2" />}
                  Continuar al pago
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {profile && clinic && (
         <BookingAgreementDialog
            isOpen={isAgreementDialogOpen}
            onClose={() => setIsAgreementDialogOpen(false)}
            onConfirm={handleConfirmBooking}
            isBooking={isBooking}
            clinic={clinic}
            userProfile={profile}
            totalPrice={totalPrice}
            getBookingDetails={getBookingDetails}
        />
      )}
      {clinic && user && (
        <ReviewModal
          isOpen={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
          clinicId={clinic.id}
          userId={user.id}
          onReviewSubmitted={handleReviewSubmitted}
        />
      )}
    </motion.div>
  );
};

export { ClinicBookingPage };