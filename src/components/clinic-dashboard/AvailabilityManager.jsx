import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { es } from 'date-fns/locale';
import { useUser } from '@/contexts/UserContext';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, ToggleLeft, ToggleRight, CalendarX, CalendarCheck, RefreshCw, Clock, Calendar as CalendarIcon, Sun } from 'lucide-react';
import { startOfDay, endOfDay, format, isSameDay, startOfHour, endOfHour, differenceInHours, addDays } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

const AvailabilityManager = () => {
  const { profile } = useUser();
  const { toast } = useToast();
  const [clinics, setClinics] = useState([]);
  const [selectedClinicId, setSelectedClinicId] = useState('');
  const [date, setDate] = useState(new Date());
  const [unavailability, setUnavailability] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isToggling, setIsToggling] = useState(false);

  // Generate time slots from 7:00 to 21:00 (9:00 PM)
  const timeSlots = useMemo(() => Array.from({ length: 14 }, (_, i) => {
    const hour = i + 7;
    return `${String(hour).padStart(2, '0')}:00`;
  }), []);

  const fetchClinics = useCallback(async () => {
    if (!profile?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('clinics')
        .select('id, name')
        .eq('host_id', profile.id);
        
      if (error) throw error;

      setClinics(data || []);
      if (data && data.length > 0 && !selectedClinicId) {
        setSelectedClinicId(data[0].id);
      }
    } catch (error) {
      console.error("Error fetching clinics:", error);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron cargar tus clínicas.' });
    }
  }, [profile, toast, selectedClinicId]);

  const fetchAvailabilityData = useCallback(async () => {
    if (!selectedClinicId) return;
    setLoading(true);
    
    try {
      const { data: unavData, error: unavError } = await supabase
        .from('clinic_unavailability')
        .select('*')
        .eq('clinic_id', selectedClinicId);
        
      if (unavError) throw unavError;

      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('start_time, end_time, status')
        .eq('clinic_id', selectedClinicId)
        .in('status', ['confirmed', 'pending']);

      if (bookingsError) throw bookingsError;

      setUnavailability(unavData.map(u => ({ 
        ...u, 
        start_time: new Date(u.start_time), 
        end_time: new Date(u.end_time),
        type: 'host_blocked'
      })));

      setBookings(bookingsData.map(b => ({
        start_time: new Date(b.start_time),
        end_time: new Date(b.end_time),
        status: b.status,
        type: 'booking'
      })));

    } catch (error) {
      console.error("Error fetching availability:", error);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo cargar la disponibilidad.' });
    } finally {
      setLoading(false);
    }
  }, [selectedClinicId, toast]);

  useEffect(() => {
    fetchClinics();
  }, [fetchClinics]);

  useEffect(() => {
    fetchAvailabilityData();
  }, [selectedClinicId, fetchAvailabilityData]);

  const isDayFullyBlockedByHost = useMemo(() => {
    const dayStart = startOfDay(date);
    return unavailability.some(u => 
        isSameDay(u.start_time, dayStart) && 
        differenceInHours(u.end_time, u.start_time) >= 12
    );
  }, [unavailability, date]);

  const getSlotStatus = useCallback((timeStr) => {
    if (!date) return 'available';
    
    const [hours] = timeStr.split(':').map(Number);
    const slotStart = new Date(date);
    slotStart.setHours(hours, 0, 0, 0);
    const slotEnd = new Date(date);
    slotEnd.setHours(hours + 1, 0, 0, 0);

    const hostBlock = unavailability.find(u => 
      (u.start_time <= slotStart && u.end_time > slotStart) || 
      (u.start_time >= slotStart && u.start_time < slotEnd)
    );
    if (hostBlock) return 'blocked_host';

    const booking = bookings.find(b => 
       (b.start_time <= slotStart && b.end_time > slotStart) ||
       (b.start_time >= slotStart && b.start_time < slotEnd)
    );
    
    if (booking) return booking.status === 'confirmed' ? 'booked_confirmed' : 'booked_pending';

    return 'available';
  }, [date, unavailability, bookings]);

  const toggleDayBlock = async () => {
    if (!selectedClinicId || !date) return;
    setIsToggling(true);
    
    try {
      if (isDayFullyBlockedByHost) {
        const dayStart = startOfDay(date);
        const dayBlock = unavailability.find(u => 
          isSameDay(u.start_time, dayStart) && differenceInHours(u.end_time, u.start_time) >= 12
        );
        
        if (dayBlock) {
          const { error } = await supabase.from('clinic_unavailability').delete().eq('id', dayBlock.id);
          if (error) throw error;
          toast({ title: "Día desbloqueado", description: "El día ahora está disponible para reservas." });
        }
      } else {
        const { error } = await supabase.from('clinic_unavailability').insert({
          clinic_id: selectedClinicId,
          start_time: startOfDay(date).toISOString(),
          end_time: endOfDay(date).toISOString(),
          reason: 'blocked_by_host_full_day'
        });
        if (error) throw error;
        toast({ title: "Día bloqueado", description: "Has cerrado la agenda para este día.", variant: 'default' });
      }
      await fetchAvailabilityData();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo actualizar el estado del día.' });
    } finally {
      setIsToggling(false);
    }
  };

  const toggleTimeSlot = async (timeStr) => {
    if (!selectedClinicId || !date) return;
    const status = getSlotStatus(timeStr);
    
    if (status === 'booked_confirmed' || status === 'booked_pending') {
      toast({ 
        variant: "warning", 
        title: "Horario Reservado", 
        description: "No puedes bloquear un horario que ya tiene una reserva activa." 
      });
      return;
    }

    setIsToggling(true);
    const [hours] = timeStr.split(':').map(Number);
    const slotStart = new Date(date);
    slotStart.setHours(hours, 0, 0, 0);
    const slotEnd = new Date(date);
    slotEnd.setHours(hours + 1, 0, 0, 0);

    try {
      if (status === 'blocked_host') {
        const overlappingBlock = unavailability.find(u => 
           u.start_time <= slotStart && u.end_time > slotStart
        );

        if (overlappingBlock) {
            const { error } = await supabase.from('clinic_unavailability').delete().eq('id', overlappingBlock.id);
            if (error) throw error;
        }
      } else {
        const { error } = await supabase.from('clinic_unavailability').insert({
          clinic_id: selectedClinicId,
          start_time: slotStart.toISOString(),
          end_time: slotEnd.toISOString(),
          reason: 'blocked_by_host_slot'
        });
        if (error) throw error;
      }
      await fetchAvailabilityData();
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo cambiar el estado de la hora.' });
    } finally {
      setIsToggling(false);
    }
  };

  const dayStats = useMemo(() => {
    let available = 0;
    let booked = 0;
    let blocked = 0;

    timeSlots.forEach(time => {
      const s = getSlotStatus(time);
      if (s === 'available') available++;
      else if (s === 'blocked_host') blocked++;
      else booked++;
    });

    return { available, booked, blocked };
  }, [timeSlots, getSlotStatus]);


  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <Card className="glassmorphism">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <Sun className="w-8 h-8 text-amber-500" />
            <div>
              <CardTitle>Gestionar Disponibilidad</CardTitle>
              <CardDescription>Controla cuándo está disponible tu clínica para reservas.</CardDescription>
            </div>
          </div>
          <Button variant="outline" size="icon" onClick={fetchAvailabilityData} disabled={loading}>
             <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="w-full md:w-1/3">
             <Select value={selectedClinicId} onValueChange={setSelectedClinicId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una clínica" />
                </SelectTrigger>
                <SelectContent>
                  {clinics.map(clinic => <SelectItem key={clinic.id} value={clinic.id}>{clinic.name}</SelectItem>)}
                </SelectContent>
              </Select>
          </div>

          {selectedClinicId ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              <div className="lg:col-span-4">
                <div className="rounded-md border bg-card/50 p-1">
                  <Calendar 
                    mode="single" 
                    selected={date} 
                    onSelect={(d) => d && setDate(d)} 
                    className="w-full" 
                    locale={es}
                    modifiers={{
                        has_bookings: (d) => bookings.some(b => isSameDay(b.start_time, d)),
                        fully_blocked: (d) => unavailability.some(u => isSameDay(u.start_time, d) && differenceInHours(u.end_time, u.start_time) >= 12)
                    }}
                    modifiersClassNames={{
                        has_bookings: "font-bold text-blue-500",
                        fully_blocked: "text-muted-foreground line-through decoration-red-500"
                    }}
                  />
                </div>
                
                <div className="mt-4 space-y-2 text-sm px-2">
                   <div className="flex items-center gap-2 font-medium">
                     <CalendarIcon className="w-4 h-4 text-primary" /> Referencia Visual
                   </div>
                   <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500"></div> Disponible</div>
                   <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500/20 border border-blue-500"></div> Reservado</div>
                   <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500"></div> Bloqueado por ti</div>
                </div>
              </div>

              <div className="lg:col-span-8 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b">
                  <div>
                    <h3 className="font-bold text-2xl capitalize text-primary flex items-center gap-2">
                      <Clock className="w-6 h-6" />
                      {format(date, 'eeee, d \'de\' MMMM', { locale: es })}
                    </h3>
                    <div className="flex gap-2 mt-1">
                        <Badge variant="outline" className="font-normal">{dayStats.available} hrs disponibles</Badge>
                        <Badge variant="outline" className="font-normal text-blue-600 border-blue-200 bg-blue-50">{dayStats.booked} hrs reservadas</Badge>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={toggleDayBlock} 
                    disabled={isToggling || loading} 
                    variant={isDayFullyBlockedByHost ? 'outline' : 'destructive'}
                    className={cn(isDayFullyBlockedByHost && "border-green-500 text-green-600 hover:bg-green-50")}
                  >
                    {isToggling ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : 
                     isDayFullyBlockedByHost ? <CalendarCheck className="w-4 h-4 mr-2" /> : <CalendarX className="w-4 h-4 mr-2" />}
                    {isDayFullyBlockedByHost ? 'Habilitar Día Completo' : 'Bloquear Día Completo'}
                  </Button>
                </div>

                <div className={cn("grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 transition-opacity", (isToggling || loading) && "opacity-50 pointer-events-none")}>
                  {timeSlots.map(time => {
                    const status = getSlotStatus(time);
                    let variant = 'outline';
                    let label = 'Disponible';
                    let icon = <ToggleLeft className="w-5 h-5 text-muted-foreground" />;
                    let className = "border-dashed hover:border-solid hover:border-green-500 hover:text-green-600";

                    if (status === 'blocked_host') {
                        variant = 'secondary'; 
                        label = 'Bloqueado';
                        icon = <ToggleRight className="w-5 h-5 text-red-500" />;
                        className = "bg-red-50 border-red-100 text-red-700 hover:bg-red-100";
                    } else if (status === 'booked_confirmed') {
                        variant = 'default';
                        label = 'Reservado';
                        icon = <div className="w-2 h-2 rounded-full bg-white animate-pulse" />;
                        className = "bg-blue-600 text-white hover:bg-blue-700 border-blue-600 cursor-not-allowed opacity-90";
                    } else if (status === 'booked_pending') {
                        variant = 'secondary';
                        label = 'Pendiente';
                        icon = <Loader2 className="w-4 h-4 animate-spin" />;
                        className = "bg-yellow-100 text-yellow-800 border-yellow-200 cursor-not-allowed";
                    }

                    return (
                      <Button
                        key={time}
                        variant={variant}
                        className={cn("flex flex-col items-center justify-center h-20 gap-1 transition-all", className)}
                        onClick={() => toggleTimeSlot(time)}
                        disabled={isToggling || status.startsWith('booked')}
                      >
                        <span className="text-lg font-semibold tracking-tight">
                             {format(new Date(`1970-01-01T${time}`), 'p', { locale: es })}
                        </span>
                        <div className="flex items-center gap-1 text-xs uppercase tracking-wider opacity-80">
                            {label} {status === 'blocked_host' && icon}
                        </div>
                      </Button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground border-2 border-dashed rounded-xl bg-muted/30">
              <CalendarX className="w-12 h-12 mb-4 opacity-20" />
              <p className="text-lg font-medium">No has seleccionado ninguna clínica</p>
              <p className="text-sm">Selecciona una clínica del menú superior para gestionar su horario.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AvailabilityManager;