import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { format, startOfDay, endOfDay, isSameDay, differenceInHours } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  Search, Calendar as CalendarIcon, Loader2, MapPin, 
  User, CheckCircle2, AlertCircle, Clock, Ban
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const AdminAvailabilityManager = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedClinic, setSelectedClinic] = useState(null);
  const [loadingSearch, setLoadingSearch] = useState(false);
  
  const [date, setDate] = useState(new Date());
  const [availability, setAvailability] = useState({ bookings: [], unavailability: [] });
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [toggling, setToggling] = useState(false);

  const { toast } = useToast();

  // Search Clinics
  useEffect(() => {
    const searchClinics = async () => {
      if (!searchTerm.trim()) {
        setSearchResults([]);
        return;
      }
      setLoadingSearch(true);
      try {
        const { data, error } = await supabase
          .from('clinics')
          .select('id, name, address_city, host_id, profiles(full_name, email, avatar_url)')
          .ilike('name', `%${searchTerm}%`)
          .limit(10);

        if (error) throw error;
        setSearchResults(data || []);
      } catch (error) {
        console.error("Error searching clinics:", error);
      } finally {
        setLoadingSearch(false);
      }
    };

    const debounce = setTimeout(searchClinics, 500);
    return () => clearTimeout(debounce);
  }, [searchTerm]);

  // Fetch Availability for Selected Clinic
  const fetchAvailability = useCallback(async () => {
    if (!selectedClinic) return;
    setLoadingAvailability(true);
    try {
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('id, start_time, end_time, status, dentist_id, profiles(full_name)')
        .eq('clinic_id', selectedClinic.id)
        .in('status', ['confirmed', 'pending']);

      if (bookingsError) throw bookingsError;

      const { data: unavailable, error: unavError } = await supabase
        .from('clinic_unavailability')
        .select('*')
        .eq('clinic_id', selectedClinic.id);

      if (unavError) throw unavError;

      setAvailability({
        bookings: bookings.map(b => ({ ...b, start_time: new Date(b.start_time), end_time: new Date(b.end_time) })),
        unavailability: unavailable.map(u => ({ ...u, start_time: new Date(u.start_time), end_time: new Date(u.end_time) }))
      });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo cargar la disponibilidad.' });
    } finally {
      setLoadingAvailability(false);
    }
  }, [selectedClinic, toast]);

  useEffect(() => {
    fetchAvailability();
  }, [selectedClinic, fetchAvailability]);

  // Logic for slots
  const timeSlots = useMemo(() => Array.from({ length: 14 }, (_, i) => {
    const hour = i + 7;
    return `${String(hour).padStart(2, '0')}:00`;
  }), []);

  const getSlotStatus = (timeStr) => {
    if (!date) return { status: 'unknown' };
    const [hours] = timeStr.split(':').map(Number);
    const slotStart = new Date(date);
    slotStart.setHours(hours, 0, 0, 0);
    const slotEnd = new Date(date);
    slotEnd.setHours(hours + 1, 0, 0, 0);

    const block = availability.unavailability.find(u => 
      (u.start_time <= slotStart && u.end_time > slotStart) ||
      (u.start_time >= slotStart && u.start_time < slotEnd)
    );
    
    if (block) return { status: 'blocked', reason: block.reason, id: block.id };

    const booking = availability.bookings.find(b => 
      (b.start_time <= slotStart && b.end_time > slotStart) ||
      (b.start_time >= slotStart && b.start_time < slotEnd)
    );

    if (booking) return { status: 'booked', booking };

    return { status: 'available' };
  };

  const handleToggleSlot = async (timeStr) => {
    if (!selectedClinic || !date) return;
    const { status, id } = getSlotStatus(timeStr);

    if (status === 'booked') {
      toast({ variant: 'warning', title: 'Ocupado', description: 'No puedes bloquear un horario reservado.' });
      return;
    }

    setToggling(true);
    const [hours] = timeStr.split(':').map(Number);
    const slotStart = new Date(date);
    slotStart.setHours(hours, 0, 0, 0);
    const slotEnd = new Date(date);
    slotEnd.setHours(hours + 1, 0, 0, 0);

    try {
      if (status === 'blocked') {
        const { error } = await supabase.from('clinic_unavailability').delete().eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('clinic_unavailability').insert({
          clinic_id: selectedClinic.id,
          start_time: slotStart.toISOString(),
          end_time: slotEnd.toISOString(),
          reason: 'admin_lock'
        });
        if (error) throw error;
      }
      await fetchAvailability();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo actualizar el slot.' });
    } finally {
      setToggling(false);
    }
  };

  const isDayFullyBlocked = useMemo(() => {
     const dayStart = startOfDay(date);
     return availability.unavailability.some(u => 
        isSameDay(u.start_time, dayStart) && differenceInHours(u.end_time, u.start_time) >= 12
     );
  }, [availability.unavailability, date]);

  const toggleDay = async () => {
    if (!selectedClinic || !date) return;
    setToggling(true);
    try {
        if (isDayFullyBlocked) {
            // Unlock
            const dayStart = startOfDay(date);
            const blocks = availability.unavailability.filter(u => isSameDay(u.start_time, dayStart) && differenceInHours(u.end_time, u.start_time) >= 12);
            for (const b of blocks) {
                await supabase.from('clinic_unavailability').delete().eq('id', b.id);
            }
        } else {
            // Lock
            await supabase.from('clinic_unavailability').insert({
                clinic_id: selectedClinic.id,
                start_time: startOfDay(date).toISOString(),
                end_time: endOfDay(date).toISOString(),
                reason: 'admin_full_day_lock'
            });
        }
        await fetchAvailability();
    } catch (e) {
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudo actualizar el día.' });
    } finally {
        setToggling(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-220px)] min-h-[600px]">
      {/* Sidebar: Search & Select */}
      <div className="lg:col-span-4 flex flex-col gap-4 h-full">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar clínica..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <ScrollArea className="flex-1 border rounded-md bg-background/50">
          {loadingSearch ? (
            <div className="p-4 flex justify-center"><Loader2 className="animate-spin text-muted-foreground" /></div>
          ) : searchResults.length > 0 ? (
            <div className="flex flex-col p-2 gap-1">
              {searchResults.map((clinic) => (
                <button
                  key={clinic.id}
                  onClick={() => setSelectedClinic(clinic)}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-lg text-left transition-all border border-transparent",
                    selectedClinic?.id === clinic.id 
                      ? "bg-primary/10 border-primary/20 shadow-sm" 
                      : "hover:bg-muted"
                  )}
                >
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0 text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="font-medium text-sm truncate">{clinic.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{clinic.profiles?.full_name}</p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground text-sm">
              {searchTerm ? "No se encontraron clínicas." : "Escribe para buscar una clínica."}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Main Area: Calendar & Slots */}
      <div className="lg:col-span-8 flex flex-col gap-6 h-full overflow-hidden">
        {selectedClinic ? (
          <div className="flex flex-col h-full bg-card border rounded-xl overflow-hidden shadow-sm">
             <div className="p-4 border-b bg-muted/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <Avatar className="h-10 w-10 border">
                      <AvatarImage src={selectedClinic.profiles?.avatar_url} />
                      <AvatarFallback>C</AvatarFallback>
                   </Avatar>
                   <div>
                      <h3 className="font-semibold">{selectedClinic.name}</h3>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                         <MapPin className="w-3 h-3" /> {selectedClinic.address_city || 'Sin dirección'}
                      </p>
                   </div>
                </div>
                <div className="flex items-center gap-2">
                   <Badge variant="outline" className="bg-background">ID: {selectedClinic.id.substring(0,6)}...</Badge>
                </div>
             </div>

             <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                {/* Calendar */}
                <div className="p-4 border-r w-full md:w-auto flex flex-col items-center">
                   <Calendar
                      mode="single"
                      selected={date}
                      onSelect={(d) => d && setDate(d)}
                      className="rounded-md border bg-background"
                      locale={es}
                      modifiers={{
                        booked: (d) => availability.bookings.some(b => isSameDay(b.start_time, d)),
                        blocked: (d) => availability.unavailability.some(u => isSameDay(u.start_time, d))
                      }}
                      modifiersClassNames={{
                        booked: "font-bold text-blue-600 after:content-['•'] after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2",
                        blocked: "text-red-400 line-through decoration-red-400"
                      }}
                   />
                   <div className="mt-4 w-full">
                      <Button 
                         variant={isDayFullyBlocked ? "outline" : "secondary"} 
                         className="w-full text-xs"
                         onClick={toggleDay}
                         disabled={toggling || loadingAvailability}
                      >
                         {isDayFullyBlocked ? "Desbloquear Día" : "Bloquear Día Completo"}
                      </Button>
                   </div>
                </div>

                {/* Slots */}
                <ScrollArea className="flex-1 p-6">
                   <div className="mb-4 flex items-center justify-between">
                      <h4 className="font-semibold flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4 text-primary" />
                        {format(date, "EEEE, d 'de' MMMM", { locale: es })}
                      </h4>
                      {loadingAvailability && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                   </div>

                   <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                      {timeSlots.map(time => {
                         const { status, booking } = getSlotStatus(time);
                         let variant = "outline";
                         let className = "border-dashed opacity-80 hover:opacity-100 hover:border-solid hover:border-primary";
                         let icon = null;
                         let label = "Libre";

                         if (status === 'blocked') {
                            variant = "secondary";
                            className = "bg-red-50 text-red-700 border-red-200 hover:bg-red-100";
                            icon = <Ban className="w-3 h-3" />;
                            label = "Bloqueado";
                         } else if (status === 'booked') {
                            variant = "default";
                            className = "bg-blue-600 hover:bg-blue-700 text-white border-transparent cursor-default";
                            icon = <User className="w-3 h-3" />;
                            label = booking?.profiles?.full_name?.split(' ')[0] || "Ocupado";
                         }

                         return (
                           <Button
                              key={time}
                              variant={variant}
                              className={cn("h-16 flex flex-col gap-0.5 items-start justify-center px-3", className)}
                              onClick={() => handleToggleSlot(time)}
                              disabled={toggling || status === 'booked'}
                           >
                              <span className="text-sm font-bold">{time}</span>
                              <span className="text-[10px] flex items-center gap-1 uppercase tracking-wider font-medium opacity-90">
                                 {icon} {label}
                              </span>
                           </Button>
                         )
                      })}
                   </div>
                </ScrollArea>
             </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground bg-muted/10 border border-dashed rounded-xl">
            <Search className="w-12 h-12 mb-4 opacity-20" />
            <p className="font-medium">Selecciona una clínica para gestionar su agenda</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAvailabilityManager;