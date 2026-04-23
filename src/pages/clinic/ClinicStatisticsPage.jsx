import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Loader2, 
  ArrowLeft, 
  DollarSign, 
  Users, 
  CalendarCheck, 
  Activity, 
  TrendingUp, 
  TrendingDown,
  Clock,
  UserCheck
} from 'lucide-react';
import { motion } from 'framer-motion';
import { 
  format, 
  parseISO, 
  startOfMonth, 
  endOfMonth, 
  eachMonthOfInterval, 
  subMonths, 
  getHours, 
  differenceInHours,
  isSameMonth
} from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Legend,
  LineChart,
  Line
} from 'recharts';

// --- Colores del Tema ---
const COLORS = {
  primary: '#10b981', // Emerald 500
  secondary: '#3b82f6', // Blue 500
  accent: '#f59e0b', // Amber 500
  danger: '#ef4444', // Red 500
  dark: '#1f2937', // Gray 800
  muted: '#9ca3af', // Gray 400
  pie: ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8']
};

// --- Componentes Auxiliares ---

const KpiCard = ({ title, value, subValue, icon: Icon, trend }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">
        {title}
      </CardTitle>
      <div className={`p-2 rounded-full ${trend === 'up' ? 'bg-green-100 text-green-600' : trend === 'down' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
        <Icon className="h-4 w-4" />
      </div>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      <p className="text-xs text-muted-foreground mt-1 flex items-center">
        {trend === 'up' && <TrendingUp className="w-3 h-3 mr-1 text-green-500" />}
        {trend === 'down' && <TrendingDown className="w-3 h-3 mr-1 text-red-500" />}
        {subValue}
      </p>
    </CardContent>
  </Card>
);

const EmptyState = ({ message }) => (
  <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-8">
    <Activity className="w-12 h-12 mb-4 opacity-20" />
    <p>{message}</p>
  </div>
);

// --- Componente Principal ---

const ClinicStatisticsPage = () => {
  const { clinicId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('6m'); // 6m, 1y, all
  const [clinicName, setClinicName] = useState('');
  
  // Estado de Datos Crudos
  const [bookings, setBookings] = useState([]);
  
  // Fetch Inicial
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // 1. Info Clínica
        const { data: clinic } = await supabase
          .from('clinics')
          .select('name')
          .eq('id', clinicId)
          .single();
        setClinicName(clinic?.name || 'Clínica');

        // 2. Reservas (Base de todo el análisis)
        const { data: bookingsData, error } = await supabase
          .from('bookings')
          .select(`
            *,
            profiles:dentist_id (full_name, avatar_url),
            transactions (amount, host_payout, status)
          `)
          .eq('clinic_id', clinicId)
          .order('start_time', { ascending: true });

        if (error) throw error;
        setBookings(bookingsData || []);

      } catch (error) {
        console.error("Error fetching stats:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron cargar los datos.' });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [clinicId, toast]);

  // --- Procesamiento de Datos (Memoized) ---

  const processedData = useMemo(() => {
    if (!bookings.length) return null;

    const now = new Date();
    const monthsToAnalyze = timeRange === '6m' ? 6 : timeRange === '1y' ? 12 : 24;
    const startDate = subMonths(startOfMonth(now), monthsToAnalyze - 1);

    // Filtrar por rango de tiempo seleccionado
    const filteredBookings = bookings.filter(b => new Date(b.start_time) >= startDate);
    const previousPeriodBookings = bookings.filter(b => {
        const d = new Date(b.start_time);
        return d < startDate && d >= subMonths(startDate, monthsToAnalyze);
    });

    // 1. Métricas Generales (KPIs)
    const totalRevenue = filteredBookings.reduce((acc, b) => {
        const payout = b.transactions?.[0]?.status === 'succeeded' ? Number(b.transactions[0].host_payout) : 0;
        return acc + payout;
    }, 0);

    const totalBookingsCount = filteredBookings.length;
    const completedBookings = filteredBookings.filter(b => b.status === 'completed' || b.status === 'confirmed').length;
    const cancelledBookings = filteredBookings.filter(b => b.status === 'cancelled' || b.status === 'cancelled_by_host').length;
    const cancellationRate = totalBookingsCount > 0 ? ((cancelledBookings / totalBookingsCount) * 100).toFixed(1) : 0;

    // Calcular tendencias (vs periodo anterior)
    const prevTotalRevenue = previousPeriodBookings.reduce((acc, b) => acc + (Number(b.transactions?.[0]?.host_payout) || 0), 0);
    const revenueGrowth = prevTotalRevenue > 0 ? ((totalRevenue - prevTotalRevenue) / prevTotalRevenue) * 100 : 0;

    // 2. Gráfico Mensual (Ingresos vs Reservas)
    const monthsInterval = eachMonthOfInterval({ start: startDate, end: now });
    const monthlyData = monthsInterval.map(month => {
        const monthBookings = filteredBookings.filter(b => isSameMonth(parseISO(b.start_time), month));
        const monthRevenue = monthBookings.reduce((acc, b) => acc + (Number(b.transactions?.[0]?.host_payout) || 0), 0);
        
        return {
            name: format(month, 'MMM', { locale: es }),
            fullDate: format(month, 'MMMM yyyy', { locale: es }),
            ingresos: monthRevenue,
            reservas: monthBookings.length,
            cancelaciones: monthBookings.filter(b => b.status.includes('cancelled')).length
        };
    });

    // 3. Análisis Horario (Mapa de Calor simplificado)
    const hourlyDistribution = Array(24).fill(0).map((_, i) => ({ hour: i, count: 0 }));
    filteredBookings.forEach(b => {
        const hour = getHours(parseISO(b.start_time));
        hourlyDistribution[hour].count += 1;
    });
    const peakHoursData = hourlyDistribution
        .filter(h => h.count > 0)
        .map(h => ({
            name: `${h.hour}:00`,
            reservas: h.count
        }));

    // 4. Distribución de Estado
    const statusData = [
        { name: 'Completadas', value: completedBookings },
        { name: 'Canceladas', value: cancelledBookings },
        { name: 'Pendientes', value: filteredBookings.filter(b => b.status === 'pending').length }
    ].filter(d => d.value > 0);

    // 5. Análisis de Odontólogos (Nuevos vs Recurrentes & Top)
    const dentistCounts = {};
    filteredBookings.forEach(b => {
        if (!dentistCounts[b.dentist_id]) {
            dentistCounts[b.dentist_id] = {
                name: b.profiles?.full_name || 'Usuario Desconocido',
                count: 0,
                revenue: 0
            };
        }
        dentistCounts[b.dentist_id].count += 1;
        dentistCounts[b.dentist_id].revenue += (Number(b.transactions?.[0]?.host_payout) || 0);
    });

    const dentistList = Object.values(dentistCounts).sort((a, b) => b.revenue - a.revenue);
    const recurringDentists = dentistList.filter(d => d.count > 1).length;
    const newDentists = dentistList.filter(d => d.count === 1).length;
    const retentionData = [
        { name: 'Recurrentes', value: recurringDentists },
        { name: 'Nuevos', value: newDentists }
    ].filter(d => d.value > 0);

    // 6. Servicios / Duración (Proxy de Servicios)
    const durationCounts = {};
    filteredBookings.forEach(b => {
        const hours = differenceInHours(parseISO(b.end_time), parseISO(b.start_time));
        const key = `${hours}h`;
        durationCounts[key] = (durationCounts[key] || 0) + 1;
    });
    const servicesData = Object.entries(durationCounts)
        .map(([key, value]) => ({ name: key, value }))
        .sort((a, b) => b.value - a.value);

    // 7. Tasa de Ocupación Estimada (Asumiendo 10h diarias disponibles x 30 días)
    // Nota: Esto es una aproximación. Para exactitud se necesitaría la disponibilidad real histórica.
    const totalHoursBooked = filteredBookings.reduce((acc, b) => {
        return acc + differenceInHours(parseISO(b.end_time), parseISO(b.start_time));
    }, 0);
    // 26 días laborables * 10 horas * número de meses aprox
    const theoreticalCapacity = (26 * 10) * monthsToAnalyze; 
    const occupancyRate = Math.min(100, ((totalHoursBooked / theoreticalCapacity) * 100)).toFixed(1);

    return {
        kpi: {
            revenue: totalRevenue,
            bookings: totalBookingsCount,
            cancellationRate,
            occupancyRate,
            revenueGrowth
        },
        monthlyData,
        peakHoursData,
        statusData,
        retentionData,
        servicesData,
        dentistList: dentistList.slice(0, 5) // Top 5
    };
  }, [bookings, timeRange]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!processedData) return <EmptyState message="No hay suficientes datos para mostrar estadísticas." />;

  const { kpi, monthlyData, peakHoursData, statusData, retentionData, servicesData, dentistList } = processedData;

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="space-y-8 pb-12"
    >
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate('/clinic-dashboard')} className="-ml-2">
                <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-3xl font-bold text-primary">Analítica de Negocio</h1>
          </div>
          <p className="text-muted-foreground ml-10">
            Rendimiento detallado para <span className="font-semibold text-foreground">{clinicName}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Periodo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="6m">Últimos 6 meses</SelectItem>
              <SelectItem value="1y">Último año</SelectItem>
              <SelectItem value="all">Histórico completo</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
             Descargar Reporte
          </Button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard 
          title="Ingresos Totales" 
          value={`RD$${kpi.revenue.toLocaleString()}`} 
          subValue={`${kpi.revenueGrowth > 0 ? '+' : ''}${kpi.revenueGrowth.toFixed(1)}% vs periodo anterior`}
          trend={kpi.revenueGrowth >= 0 ? 'up' : 'down'}
          icon={DollarSign}
        />
        <KpiCard 
          title="Reservas Totales" 
          value={kpi.bookings} 
          subValue="Reservas confirmadas"
          trend="neutral"
          icon={CalendarCheck}
        />
        <KpiCard 
          title="Tasa de Ocupación" 
          value={`${kpi.occupancyRate}%`} 
          subValue="Capacidad estimada utilizada"
          trend={parseFloat(kpi.occupancyRate) > 50 ? 'up' : 'neutral'}
          icon={Activity}
        />
        <KpiCard 
          title="Tasa Cancelación" 
          value={`${kpi.cancellationRate}%`} 
          subValue="Reservas canceladas"
          trend={parseFloat(kpi.cancellationRate) < 10 ? 'up' : 'down'}
          icon={TrendingDown}
        />
      </div>

      {/* Charts Tabs */}
      <Tabs defaultValue="financials" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="financials">Finanzas</TabsTrigger>
          <TabsTrigger value="operations">Operaciones</TabsTrigger>
          <TabsTrigger value="team">Pacientes y Equipo</TabsTrigger>
        </TabsList>

        {/* TAB: FINANZAS */}
        <TabsContent value="financials" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Evolución de Ingresos y Reservas</CardTitle>
              <CardDescription>Comparativa mensual de facturación neta y volumen de citas.</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.8}/>
                      <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorReservas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.secondary} stopOpacity={0.8}/>
                      <stop offset="95%" stopColor={COLORS.secondary} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" />
                  <YAxis yAxisId="left" orientation="left" stroke={COLORS.primary} />
                  <YAxis yAxisId="right" orientation="right" stroke={COLORS.secondary} />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                    formatter={(value, name) => [
                        name === 'ingresos' ? `RD$${value.toLocaleString()}` : value, 
                        name === 'ingresos' ? 'Ingresos' : 'Reservas'
                    ]}
                  />
                  <Legend />
                  <Area yAxisId="left" type="monotone" dataKey="ingresos" stroke={COLORS.primary} fillOpacity={1} fill="url(#colorIngresos)" name="Ingresos" />
                  <Area yAxisId="right" type="monotone" dataKey="reservas" stroke={COLORS.secondary} fillOpacity={1} fill="url(#colorReservas)" name="Reservas" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <Card>
                <CardHeader>
                    <CardTitle>Servicios más Solicitados</CardTitle>
                    <CardDescription>Basado en la duración de las reservas.</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={servicesData} layout="vertical" margin={{ left: 20 }}>
                            <XAxis type="number" hide />
                            <YAxis dataKey="name" type="category" width={60} />
                            <Tooltip cursor={{fill: 'transparent'}} />
                            <Bar dataKey="value" fill={COLORS.secondary} radius={[0, 4, 4, 0]} barSize={30} name="Reservas">
                                {servicesData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS.pie[index % COLORS.pie.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
             </Card>

             <Card>
                <CardHeader>
                    <CardTitle>Estado de Reservas</CardTitle>
                    <CardDescription>Distribución de citas completadas vs canceladas.</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={statusData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {statusData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.name === 'Canceladas' ? COLORS.danger : entry.name === 'Pendientes' ? COLORS.accent : COLORS.primary} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend verticalAlign="bottom" height={36}/>
                        </PieChart>
                    </ResponsiveContainer>
                </CardContent>
             </Card>
          </div>
        </TabsContent>

        {/* TAB: OPERACIONES */}
        <TabsContent value="operations" className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Horarios de Mayor Demanda</CardTitle>
                    <CardDescription>Frecuencia de reservas por hora del día.</CardDescription>
                </CardHeader>
                <CardContent className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={peakHoursData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="reservas" fill={COLORS.secondary} radius={[4, 4, 0, 0]} name="Reservas" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader>
                    <CardTitle>Análisis de Cancelaciones</CardTitle>
                    <CardDescription>Tendencia mensual de cancelaciones.</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={monthlyData}>
                             <CartesianGrid strokeDasharray="3 3" vertical={false} />
                             <XAxis dataKey="name" />
                             <YAxis />
                             <Tooltip />
                             <Line type="monotone" dataKey="cancelaciones" stroke={COLORS.danger} strokeWidth={2} name="Cancelaciones" dot={{r: 4}} />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </TabsContent>

        {/* TAB: EQUIPO/CLIENTES */}
        <TabsContent value="team" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Retención de Odontólogos</CardTitle>
                        <CardDescription>Nuevos usuarios vs Recurrentes.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                         <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={retentionData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {retentionData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.name === 'Nuevos' ? COLORS.accent : COLORS.primary} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Top Odontólogos</CardTitle>
                        <CardDescription>Profesionales con mayor volumen de facturación.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {dentistList.map((dentist, idx) => (
                                <div key={idx} className="flex items-center justify-between p-2 bg-muted/20 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                            {idx + 1}
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm">{dentist.name}</p>
                                            <p className="text-xs text-muted-foreground">{dentist.count} reservas</p>
                                        </div>
                                    </div>
                                    <span className="font-bold text-sm">
                                        RD${dentist.revenue.toLocaleString()}
                                    </span>
                                </div>
                            ))}
                            {dentistList.length === 0 && <p className="text-muted-foreground text-sm">No hay datos disponibles.</p>}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};

export default ClinicStatisticsPage;