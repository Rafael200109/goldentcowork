import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import { supabaseClient } from '@/config/supabaseConfig';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Search, Calendar, MapPin, ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import LazyImage from '@/components/ui/LazyImage';

const QuickAccessCard = ({ title, description, icon: Icon, onClick, colorClass, accentColor }) => (
    <div onClick={onClick} className="cursor-pointer relative overflow-hidden group h-full">
      <Card className="h-full border-none shadow-sm hover:shadow-md transition-shadow duration-200">
        <div className={`absolute top-0 right-0 w-24 h-24 opacity-10 rounded-bl-[80px] pointer-events-none ${accentColor}`} />
        <CardContent className="p-6 flex flex-col items-start h-full relative z-10">
          <div className={`p-3 rounded-xl mb-4 ${colorClass} bg-opacity-10`}><Icon className="w-6 h-6" /></div>
          <h3 className="font-bold text-lg mb-2">{title}</h3>
          <p className="text-sm text-muted-foreground mb-4">{description}</p>
          <div className="text-xs font-semibold flex items-center mt-auto opacity-0 group-hover:opacity-100 transition-opacity text-primary">
            Acceder <ChevronRight className="w-3 h-3 ml-1" />
          </div>
        </CardContent>
      </Card>
    </div>
);

const NextSessionCard = ({ booking, loading, onNavigate }) => {
  if (loading) return <Skeleton className="h-64 w-full rounded-xl" />;
  return (
    <Card className="h-auto border-none shadow-sm overflow-hidden flex flex-col">
      <div className="p-6 border-b"><h3 className="font-semibold flex items-center gap-2"><Calendar className="w-5 h-5 text-primary" /> Próxima Sesión</h3></div>
      <CardContent className="p-6">
        {booking ? (
          <div className="space-y-4">
             <div>
                <h4 className="font-bold text-lg text-primary">{booking.clinics?.name}</h4>
                <p className="text-sm text-muted-foreground flex items-center"><MapPin className="w-3 h-3 mr-1" /> {booking.clinics?.address_sector}</p>
             </div>
             <div className="bg-muted p-4 rounded-lg">
                <div className="text-sm"><span className="font-medium">{format(new Date(booking.start_time), "EEEE, d 'de' MMMM", { locale: es })}</span></div>
                <div className="text-sm"><span className="font-medium">{format(new Date(booking.start_time), "h:mm a")}</span></div>
             </div>
             <Button className="w-full" variant="outline" onClick={() => onNavigate('/my-bookings')}>Ver detalles</Button>
          </div>
        ) : (
          <div className="text-center py-6">
            <h4 className="font-medium mb-1">Sin próximas reservas</h4>
            <Button onClick={() => onNavigate('/search-clinics')} className="mt-4"><Search className="w-4 h-4 mr-2" /> Buscar Clínica</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export const LoggedInHome = () => {
  const { profile, loadingProfile } = useUser();
  const navigate = useNavigate();
  const [nextBooking, setNextBooking] = useState(null);
  const [loadingBooking, setLoadingBooking] = useState(true);

  useEffect(() => {
    const fetchNextBooking = async () => {
      if (!profile || profile.role !== 'dentist') return setLoadingBooking(false);
      try {
        const { data } = await supabaseClient.from('bookings').select('*, clinics!inner(name, address_sector)').eq('dentist_id', profile.id).eq('status', 'confirmed').gte('start_time', new Date().toISOString()).order('start_time').limit(1).maybeSingle();
        setNextBooking(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingBooking(false);
      }
    };
    fetchNextBooking();
  }, [profile]);

  if (loadingProfile && !profile) return <div className="p-4"><Skeleton className="h-12 w-64 mb-8" /></div>;

  return (
    <div className="space-y-8 pb-12 min-h-screen">
      <div className="flex justify-between items-end mb-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Hola, {profile?.full_name?.split(' ')[0] || 'Usuario'}</h1>
          <p className="text-muted-foreground mt-2">¿Listo para transformar sonrisas hoy?</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
            <h2 className="text-xl font-semibold mb-4">Acceso Rápido</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <QuickAccessCard title="Buscar Clínicas" description="Encuentra el consultorio ideal." icon={Search} onClick={() => navigate('/search-clinics')} colorClass="text-green-600" accentColor="bg-green-500" />
                <QuickAccessCard title="Mis Reservas" description="Gestiona tus citas." icon={Calendar} onClick={() => navigate('/my-bookings')} colorClass="text-orange-600" accentColor="bg-orange-500" />
            </div>
        </div>
        <div className="space-y-8">
            <NextSessionCard booking={nextBooking} loading={loadingBooking} onNavigate={navigate} />
            <div onClick={() => navigate('/search-clinics')} className="cursor-pointer">
                 <h2 className="text-xl font-semibold mb-4">Recomendados</h2>
                 <div className="relative overflow-hidden rounded-xl h-48">
                    <LazyImage 
                      src="https://images.unsplash.com/photo-1629909613638-0e4a1fad8f81?q=80&w=800" 
                      priority="medium"
                      className="absolute inset-0"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10" />
                    <div className="absolute bottom-0 left-0 p-4 z-20 text-white">
                        <h4 className="font-bold text-lg">Clínicas Premium</h4>
                        <span className="text-xs font-bold bg-white/20 backdrop-blur-md px-2 py-1 rounded">Desde RD$1,500</span>
                    </div>
                 </div>
            </div>
        </div>
      </div>
    </div>
  );
};