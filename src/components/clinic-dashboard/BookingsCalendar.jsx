import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { 
  Tabs, 
  TabsList, 
  TabsTrigger, 
  TabsContent 
} from '@/components/ui/tabs';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/use-toast';
import { useUser } from '@/contexts/UserContext';
import { supabase } from '@/lib/customSupabaseClient';
import { cn } from '@/lib/utils';
import { 
  format, 
  isSameDay, 
  isAfter, 
  isBefore, 
  startOfDay, 
  addDays, 
  subDays, 
  differenceInMinutes,
  parseISO 
} from 'date-fns';
import { es } from 'date-fns/locale';
import { formatInTimeZone } from 'date-fns-tz';
import { 
  Calendar as CalendarIcon, 
  List as ListIcon, 
  Clock, 
  MapPin, 
  DollarSign, 
  User, 
  ChevronLeft, 
  ChevronRight, 
  Filter,
  RefreshCw,
  CalendarDays
} from 'lucide-react';
import BookingDetailsSheet from '@/components/clinic-dashboard/BookingDetailsSheet';

// --- Helper Components ---

const StatusBadge = ({ status }) => {
  const styles = {
    confirmed: "bg-green-100 text-green-700 hover:bg-green-100 border-green-200",
    pending: "bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200",
    cancelled: "bg-red-100 text-red-700 hover:bg-red-100 border-red-200",
    completed: "bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200",
  };

  const labels = {
    confirmed: "Confirmada",
    pending: "Pendiente",
    cancelled: "Cancelada",
    completed: "Completada",
  };

  return (
    <Badge variant="outline" className={cn("capitalize font-medium", styles[status] || "bg-gray-100")}>
      {labels[status] || status}
    </Badge>
  );
};

const StatCard = ({ title, value, icon: Icon, description, colorClass }) => (
  <motion.div 
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-card border rounded-xl p-4 shadow-sm flex items-center justify-between"
  >
    <div>
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <h3 className="text-2xl font-bold mt-1">{value}</h3>
      {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
    </div>
    <div className={cn("p-3 rounded-full bg-opacity-10", colorClass)}>
      <Icon className={cn("w-5 h-5", colorClass.replace("bg-", "text-"))} />
    </div>
  </motion.div>
);

const EmptyState = ({ message, icon: Icon }) => (
  <div className="flex flex-col items-center justify-center py-12 text-center px-4 h-full">
    <div className="bg-muted/50 p-4 rounded-full mb-3">
      <Icon className="w-8 h-8 text-muted-foreground/50" />
    </div>
    <p className="text-muted-foreground font-medium">{message}</p>
  </div>
);

// --- Main Views ---

const TimelineView = ({ bookings, currentDate, onBookingClick }) => {
  const dayStartHour = 7;
  const dayEndHour = 21; // 9 PM
  const totalHours = dayEndHour - dayStartHour;
  const hours = Array.from({ length: totalHours }, (_, i) => i + dayStartHour);
  
  const timeZone = 'America/Santo_Domingo';

  // Filter bookings for the current day
  const dayBookings = useMemo(() => {
    return bookings.filter(b => isSameDay(parseISO(b.start_time), currentDate));
  }, [bookings, currentDate]);

  return (
    <div className="h-[600px] flex flex-col border rounded-lg overflow-hidden bg-background/50">
      <div className="flex-1 overflow-y-auto relative custom-scrollbar">
        <div className="grid grid-cols-[60px_1fr] min-h-[800px]">
          {/* Time Labels */}
          <div className="border-r bg-muted/10 py-4 text-xs font-medium text-muted-foreground text-right pr-3 select-none">
            {hours.map(hour => (
              <div key={hour} className="h-[60px] relative">
                <span className="absolute -top-2 right-0">
                  {format(new Date().setHours(hour, 0), 'h a')}
                </span>
              </div>
            ))}
          </div>

          {/* Grid & Events */}
          <div className="relative bg-card py-4">
            {/* Horizontal Lines */}
            {hours.map(hour => (
              <div key={hour} className="h-[60px] border-t border-dashed border-border/40 w-full" />
            ))}

            {/* Current Time Indicator (if today) */}
            {isSameDay(currentDate, new Date()) && (
               <div 
                 className="absolute left-0 right-0 border-t-2 border-red-400 z-20 pointer-events-none flex items-center"
                 style={{ 
                   top: `${((new Date().getHours() - dayStartHour) * 60 + new Date().getMinutes()) / (totalHours * 60) * 100}%` 
                 }}
               >
                 <div className="w-2 h-2 rounded-full bg-red-400 -ml-1" />
               </div>
            )}

            {/* Booking Blocks */}
            <AnimatePresence>
              {dayBookings.map(booking => {
                const start = parseISO(booking.start_time);
                const end = parseISO(booking.end_time);
                
                // Normalize start/end to the grid range
                const startMinutes = (start.getHours() * 60 + start.getMinutes()) - (dayStartHour * 60);
                const durationMinutes = differenceInMinutes(end, start);
                
                const top = Math.max(0, (startMinutes / (totalHours * 60)) * 100);
                const height = (durationMinutes / (totalHours * 60)) * 100;

                return (
                  <motion.div
                    key={booking.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    whileHover={{ scale: 1.01, zIndex: 10 }}
                    onClick={() => onBookingClick(booking)}
                    className={cn(
                      "absolute left-1 right-1 rounded-md border-l-4 p-2 cursor-pointer shadow-sm overflow-hidden transition-all",
                      booking.status === 'confirmed' ? "bg-green-50 border-green-500 hover:bg-green-100" :
                      booking.status === 'pending' ? "bg-amber-50 border-amber-500 hover:bg-amber-100" :
                      "bg-gray-50 border-gray-400"
                    )}
                    style={{ top: `${top}%`, height: `${height}%` }}
                  >
                    <div className="flex justify-between items-start">
                      <div className="min-w-0">
                        <p className="font-bold text-xs sm:text-sm truncate text-foreground">
                          {booking.dentist_name || "Odontólogo"}
                        </p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground truncate flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {booking.clinic_name}
                        </p>
                      </div>
                      <div className="text-[10px] font-medium opacity-80 whitespace-nowrap">
                         {formatInTimeZone(start, timeZone, 'h:mm a')} - {formatInTimeZone(end, timeZone, 'h:mm a')}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            
            {dayBookings.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <p className="text-muted-foreground/30 text-lg font-medium">Sin reservas para este día</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const ListView = ({ bookings, onBookingClick }) => {
  const sortedBookings = useMemo(() => {
    return [...bookings].sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
  }, [bookings]);

  if (sortedBookings.length === 0) {
    return <EmptyState message="No hay reservas que coincidan con los filtros." icon={CalendarDays} />;
  }

  // Group bookings
  const grouped = sortedBookings.reduce((groups, booking) => {
    const date = format(parseISO(booking.start_time), 'yyyy-MM-dd');
    if (!groups[date]) groups[date] = [];
    groups[date].push(booking);
    return groups;
  }, {});

  return (
    <ScrollArea className="h-[600px] pr-4">
      <div className="space-y-6">
        {Object.entries(grouped).map(([dateKey, dateBookings]) => {
            const dateObj = parseISO(dateKey);
            let dateLabel = format(dateObj, "EEEE, d 'de' MMMM", { locale: es });
            if (isSameDay(dateObj, new Date())) dateLabel = "Hoy";
            if (isSameDay(dateObj, addDays(new Date(), 1))) dateLabel = "Mañana";

            return (
                <div key={dateKey}>
                    <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3 sticky top-0 bg-background py-2 z-10">
                        {dateLabel}
                    </h3>
                    <div className="space-y-3">
                        {dateBookings.map((booking) => (
                             <motion.div
                                key={booking.id}
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                whileHover={{ y: -2 }}
                                onClick={() => onBookingClick(booking)}
                                className="group flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-xl border bg-card hover:shadow-md transition-all cursor-pointer"
                              >
                                {/* Time Column */}
                                <div className="flex flex-col items-center justify-center min-w-[80px] text-center">
                                    <span className="text-lg font-bold text-primary">
                                        {formatInTimeZone(parseISO(booking.start_time), 'America/Santo_Domingo', 'HH:mm')}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        {formatInTimeZone(parseISO(booking.end_time), 'America/Santo_Domingo', 'HH:mm')}
                                    </span>
                                </div>

                                {/* Info Column */}
                                <div className="flex-1 min-w-0 grid gap-1">
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-semibold text-foreground truncate">
                                            {booking.dentist_name}
                                        </h4>
                                        <StatusBadge status={booking.status} />
                                    </div>
                                    <div className="flex items-center text-sm text-muted-foreground gap-3">
                                        <span className="flex items-center gap-1 truncate">
                                            <MapPin className="w-3 h-3" /> {booking.clinic_name}
                                        </span>
                                        <span className="hidden sm:flex items-center gap-1">
                                            <DollarSign className="w-3 h-3" /> RD${Number(booking.total_price).toLocaleString()}
                                        </span>
                                    </div>
                                </div>

                                {/* Action Arrow */}
                                <div className="hidden sm:block text-muted-foreground/50 group-hover:text-primary transition-colors">
                                    <ChevronRight className="w-5 h-5" />
                                </div>
                              </motion.div>
                        ))}
                    </div>
                </div>
            )
        })}
      </div>
    </ScrollArea>
  );
};


// --- Main Component ---

const BookingsCalendar = () => {
  const { profile } = useUser();
  const { toast } = useToast();
  
  // State
  const [view, setView] = useState('timeline'); // 'timeline' | 'list'
  const [date, setDate] = useState(new Date());
  const [bookings, setBookings] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [selectedClinicId, setSelectedClinicId] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);

  // Data Fetching
  const fetchData = useCallback(async () => {
    if (!profile?.id) return;
    setLoading(true);

    try {
      // 1. Fetch Clinics
      const { data: clinicsData, error: clinicsError } = await supabase
        .from('clinics')
        .select('id, name')
        .eq('host_id', profile.id);
      
      if (clinicsError) throw clinicsError;
      setClinics(clinicsData || []);

      // 2. Fetch Bookings
      // NOTE: Using 'clinic:clinics!bookings_clinic_id_fkey!inner' alias to resolve multiple FK ambiguity.
      let query = supabase
        .from('bookings')
        .select(`
          id,
          start_time,
          end_time,
          total_price,
          status,
          clinic_id,
          clinic:clinics!bookings_clinic_id_fkey!inner ( name, host_id ),
          profiles!dentist_id ( full_name, email, phone )
        `)
        .eq('clinic.host_id', profile.id) // Ensure we only fetch bookings for this host
        .order('start_time', { ascending: false });

      const { data: bookingsData, error: bookingsError } = await query;
      
      if (bookingsError) throw bookingsError;

      // Map data to a friendlier structure
      const mappedBookings = bookingsData.map(b => ({
        id: b.id,
        booking_id: b.id, // For compatibility with BookingDetailsSheet
        start_time: b.start_time,
        end_time: b.end_time,
        total_price: b.total_price,
        status: b.status,
        clinic_id: b.clinic_id,
        clinic_name: b.clinic?.name,
        dentist_name: b.profiles?.full_name || 'Usuario',
        dentist_email: b.profiles?.email,
        dentist_phone: b.profiles?.phone
      }));

      setBookings(mappedBookings);

    } catch (error) {
      console.error("Error fetching calendar data:", error);
      toast({ variant: "destructive", title: "Error", description: "No se pudo cargar la información. " + error.message });
    } finally {
      setLoading(false);
    }
  }, [profile, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);


  // Filtering Logic
  const filteredBookings = useMemo(() => {
    let filtered = bookings;
    if (selectedClinicId !== 'all') {
      filtered = filtered.filter(b => b.clinic_id === selectedClinicId);
    }
    return filtered;
  }, [bookings, selectedClinicId]);

  // Statistics Logic
  const stats = useMemo(() => {
    const today = new Date();
    const todayBookings = filteredBookings.filter(b => isSameDay(parseISO(b.start_time), today));
    const pending = filteredBookings.filter(b => b.status === 'pending' && isAfter(parseISO(b.start_time), today));
    
    // Estimate revenue for current month
    const currentMonthBookings = filteredBookings.filter(b => 
       b.status === 'confirmed' && 
       new Date(b.start_time).getMonth() === today.getMonth() &&
       new Date(b.start_time).getFullYear() === today.getFullYear()
    );
    const revenue = currentMonthBookings.reduce((acc, curr) => acc + Number(curr.total_price), 0);

    return {
      todayCount: todayBookings.length,
      pendingCount: pending.length,
      monthRevenue: revenue
    };
  }, [filteredBookings]);


  // Handlers
  const handlePreviousDay = () => setDate(subDays(date, 1));
  const handleNextDay = () => setDate(addDays(date, 1));
  const handleToday = () => setDate(new Date());

  const handleBookingUpdate = () => {
    setSelectedBooking(null);
    fetchData();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Top Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard 
          title="Reservas Hoy" 
          value={stats.todayCount} 
          icon={CalendarDays} 
          colorClass="bg-blue-100 text-blue-600"
        />
        <StatCard 
          title="Pendientes" 
          value={stats.pendingCount} 
          icon={Clock} 
          description="Requieren tu atención"
          colorClass="bg-amber-100 text-amber-600"
        />
        <StatCard 
          title="Ingresos este Mes" 
          value={`RD$${stats.monthRevenue.toLocaleString()}`} 
          icon={DollarSign} 
          description="Total confirmado"
          colorClass="bg-green-100 text-green-600"
        />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between bg-card p-4 rounded-xl border shadow-sm">
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <Tabs value={view} onValueChange={setView} className="w-full sm:w-auto">
            <TabsList className="grid w-full grid-cols-2 sm:w-[200px]">
              <TabsTrigger value="timeline" className="gap-2"><CalendarIcon className="w-4 h-4"/> Agenda</TabsTrigger>
              <TabsTrigger value="list" className="gap-2"><ListIcon className="w-4 h-4"/> Lista</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="h-8 w-[1px] bg-border hidden sm:block" />
          
          <div className="w-full sm:w-[220px]">
             <Select value={selectedClinicId} onValueChange={setSelectedClinicId}>
              <SelectTrigger>
                <SelectValue placeholder="Todas las clínicas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas mis clínicas</SelectItem>
                {clinics.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-2 ml-auto">
           <Button variant="outline" size="icon" onClick={fetchData} disabled={loading} title="Recargar">
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
           </Button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        
        {/* Sidebar Calendar Picker (Visible in both views, helpful context) */}
        <div className="xl:col-span-4 space-y-6">
           <Card className="overflow-hidden">
             <CardHeader className="pb-2">
               <CardTitle className="text-lg">Seleccionar Fecha</CardTitle>
             </CardHeader>
             <CardContent className="p-0 flex justify-center">
               <Calendar
                 mode="single"
                 selected={date}
                 onSelect={(d) => d && setDate(d)}
                 className="p-4 w-full"
                 locale={es}
                 modifiers={{
                    booked: (d) => filteredBookings.some(b => isSameDay(parseISO(b.start_time), d)),
                    hasPending: (d) => filteredBookings.some(b => isSameDay(parseISO(b.start_time), d) && b.status === 'pending')
                 }}
                 modifiersClassNames={{
                    booked: "font-bold text-primary relative after:content-['•'] after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:text-primary after:text-lg after:leading-[0.5]",
                    hasPending: "text-amber-600 after:text-amber-500"
                 }}
               />
             </CardContent>
           </Card>
           
           {/* Contextual Info for Date */}
           <Card>
             <CardHeader>
               <CardTitle className="text-base">Resumen del Día</CardTitle>
               <CardDescription>{format(date, "EEEE, d 'de' MMMM", { locale: es })}</CardDescription>
             </CardHeader>
             <CardContent className="space-y-4">
                {filteredBookings.filter(b => isSameDay(parseISO(b.start_time), date)).length > 0 ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Total Reservas</span>
                      <span className="font-bold">{filteredBookings.filter(b => isSameDay(parseISO(b.start_time), date)).length}</span>
                    </div>
                     <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Confirmadas</span>
                      <span className="font-bold text-green-600">{filteredBookings.filter(b => isSameDay(parseISO(b.start_time), date) && b.status === 'confirmed').length}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">No hay actividad para esta fecha.</p>
                )}
             </CardContent>
           </Card>
        </div>

        {/* Content View */}
        <div className="xl:col-span-8 space-y-4">
          
          {/* Date Navigation Header for Timeline View */}
          {view === 'timeline' && (
            <div className="flex items-center justify-between bg-card p-3 rounded-lg border shadow-sm">
              <Button variant="ghost" size="icon" onClick={handlePreviousDay}><ChevronLeft className="h-5 w-5"/></Button>
              <div className="text-center">
                <h2 className="text-lg font-bold capitalize text-primary">
                  {format(date, "EEEE, d 'de' MMMM", { locale: es })}
                </h2>
                {isSameDay(date, new Date()) && <Badge variant="secondary" className="text-xs mt-0.5">Hoy</Badge>}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleToday} disabled={isSameDay(date, new Date())}>Hoy</Button>
                <Button variant="ghost" size="icon" onClick={handleNextDay}><ChevronRight className="h-5 w-5"/></Button>
              </div>
            </div>
          )}

          <Card className="min-h-[600px] border-none shadow-none bg-transparent">
             {loading ? (
               <div className="h-[400px] flex items-center justify-center">
                 <RefreshCw className="w-10 h-10 animate-spin text-primary/50" />
               </div>
             ) : (
               view === 'timeline' ? (
                 <TimelineView 
                    bookings={filteredBookings} 
                    currentDate={date} 
                    onBookingClick={setSelectedBooking}
                 />
               ) : (
                 <ListView 
                    bookings={filteredBookings} 
                    onBookingClick={setSelectedBooking}
                 />
               )
             )}
          </Card>
        </div>
      </div>

      {/* Details Modal */}
      <BookingDetailsSheet 
        booking={selectedBooking}
        isOpen={!!selectedBooking}
        onClose={() => setSelectedBooking(null)}
        onBookingCancelled={handleBookingUpdate}
      />

    </div>
  );
};

export default BookingsCalendar;