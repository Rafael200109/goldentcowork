import React, { useState, useEffect } from 'react';
import { supabaseClient } from '@/config/supabaseConfig';
import { motion } from 'framer-motion';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, ArrowLeft, DollarSign, Users, Home, CalendarCheck, Crown } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { format, parseISO, getMonth, getYear } from 'date-fns';
import { es } from 'date-fns/locale';

const StatCard = ({ title, value, icon, description }) => (
  <Card className="glassmorphism">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      <p className="text-xs text-muted-foreground">{description}</p>
    </CardContent>
  </Card>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-2 bg-background/80 backdrop-blur-sm border rounded-lg shadow-lg">
        <p className="label font-bold">{`${label}`}</p>
        {payload.map((pld, index) => (
          <p key={index} style={{ color: pld.color }}>
            {`${pld.name}: ${pld.value.toLocaleString('es-DO', { style: 'currency', currency: 'DOP' })}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const StatisticsDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { count: userCount } = await supabaseClient.from('profiles').select('*', { count: 'exact', head: true });
        const { count: clinicCount } = await supabaseClient.from('clinics').select('*', { count: 'exact', head: true });
        const { count: bookingCount } = await supabaseClient.from('bookings').select('*', { count: 'exact', head: true });
        
        const { data: transactionsData, error: transactionsError } = await supabase
          .from('transactions')
          .select('id, amount, created_at, status, bookings(profiles(full_name), clinics(name))')
          .eq('status', 'succeeded');
        if (transactionsError) throw transactionsError;

        const validTransactions = transactionsData.filter(t => t.bookings && t.bookings.profiles && t.bookings.clinics);

        const totalRevenue = validTransactions.reduce((acc, transaction) => acc + transaction.amount, 0);

        const { data: usersByRole, error: rolesError } = await supabaseClient.from('profiles').select('role');
        if (rolesError) throw rolesError;
        const roleCounts = usersByRole.reduce((acc, user) => {
          acc[user.role] = (acc[user.role] || 0) + 1;
          return acc;
        }, {});
        const userRoleData = [
          { name: 'Odontólogos', value: roleCounts.dentist || 0 },
          { name: 'Anfitriones', value: roleCounts.clinic_host || 0 },
        ];

        const { data: clinicsByStatus, error: statusError } = await supabaseClient.from('clinics').select('status');
        if (statusError) throw statusError;
        const statusCounts = clinicsByStatus.reduce((acc, clinic) => {
          acc[clinic.status] = (acc[clinic.status] || 0) + 1;
          return acc;
        }, {});
        const clinicStatusData = [
          { name: 'Publicadas', value: statusCounts.published || 0 },
          { name: 'Pendientes', value: statusCounts.pending || 0 },
          { name: 'Rechazadas', value: statusCounts.rejected || 0 },
        ];

        const recentBookings = validTransactions
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, 5)
          .map(t => ({
              id: t.id,
              dentist_name: t.bookings.profiles.full_name,
              clinic_name: t.bookings.clinics.name,
              created_at: t.created_at,
              amount: t.amount,
          }));

        const monthlyRevenue = validTransactions.reduce((acc, transaction) => {
          const date = parseISO(transaction.created_at);
          const monthKey = format(date, 'yyyy-MM');
          if (!acc[monthKey]) {
            acc[monthKey] = {
              name: format(date, 'MMM yyyy', { locale: es }),
              Ingresos: 0,
              date: date,
            };
          }
          acc[monthKey].Ingresos += transaction.amount;
          return acc;
        }, {});

        const monthlyRevenueData = Object.values(monthlyRevenue)
          .sort((a, b) => a.date - b.date);

        const clinicRevenue = validTransactions.reduce((acc, transaction) => {
            if (transaction.bookings && transaction.bookings.clinics) {
              const clinicName = transaction.bookings.clinics.name;
              acc[clinicName] = (acc[clinicName] || 0) + transaction.amount;
            }
            return acc;
        }, {});

        const topClinicsData = Object.entries(clinicRevenue)
            .map(([name, revenue]) => ({ name, revenue }))
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5);

        setStats({
          userCount,
          clinicCount,
          bookingCount,
          totalRevenue,
          userRoleData,
          clinicStatusData,
          recentBookings,
          monthlyRevenueData,
          topClinicsData,
        });
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error al cargar estadísticas',
          description: error.message,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [toast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  const COLORS = ['#0ea5e9', '#f97316', '#ef4444', '#8b5cf6'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold gradient-text">Estadísticas de la Plataforma</h1>
          <p className="text-muted-foreground">Una vista general del rendimiento de Goldent Co Work.</p>
        </div>
        <Button variant="outline" onClick={() => navigate('/admin-dashboard')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver al Panel
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Ingresos Totales" value={`RD$${stats.totalRevenue.toLocaleString('es-DO', {minimumFractionDigits: 2})}`} icon={<DollarSign className="h-4 w-4 text-muted-foreground" />} description="Ingresos brutos de transacciones exitosas" />
        <StatCard title="Usuarios Totales" value={stats.userCount} icon={<Users className="h-4 w-4 text-muted-foreground" />} description="Odontólogos y anfitriones registrados" />
        <StatCard title="Clínicas Registradas" value={stats.clinicCount} icon={<Home className="h-4 w-4 text-muted-foreground" />} description="Total de clínicas en la plataforma" />
        <StatCard title="Reservas Totales" value={stats.bookingCount} icon={<CalendarCheck className="h-4 w-4 text-muted-foreground" />} description="Total de reservas realizadas" />
      </div>

      <Card className="glassmorphism">
        <CardHeader>
          <CardTitle>Rendimiento de Ingresos Mensuales</CardTitle>
          <CardDescription>Evolución de los ingresos brutos a lo largo del tiempo.</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats.monthlyRevenueData}>
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `RD$${value/1000}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line type="monotone" dataKey="Ingresos" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="glassmorphism">
          <CardHeader>
            <CardTitle>Usuarios por Rol</CardTitle>
            <CardDescription>Distribución de los tipos de usuario.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.userRoleData}>
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip wrapperClassName="!bg-background/80 !backdrop-blur-sm !border-border" cursor={{fill: 'hsl(var(--accent))'}} />
                <Bar dataKey="value" name="Usuarios" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="glassmorphism">
          <CardHeader>
            <CardTitle>Estado de las Clínicas</CardTitle>
            <CardDescription>Desglose de clínicas por su estado de validación.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={stats.clinicStatusData} cx="50%" cy="50%" labelLine={false} outerRadius={100} fill="#8884d8" dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {stats.clinicStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip wrapperClassName="!bg-background/80 !backdrop-blur-sm !border-border" />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="glassmorphism">
          <CardHeader>
            <CardTitle>Reservas Recientes</CardTitle>
            <CardDescription>Las últimas 5 transacciones exitosas.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Odontólogo</TableHead>
                  <TableHead>Clínica</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.recentBookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell>{booking.dentist_name}</TableCell>
                    <TableCell>{booking.clinic_name}</TableCell>
                    <TableCell>{format(parseISO(booking.created_at), 'dd MMM yyyy', { locale: es })}</TableCell>
                    <TableCell className="text-right font-medium">RD${booking.amount.toLocaleString('es-DO', {minimumFractionDigits: 2})}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card className="glassmorphism">
          <CardHeader>
            <CardTitle>Top 5 Clínicas por Ingresos</CardTitle>
            <CardDescription>Las clínicas que más ingresos han generado.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {stats.topClinicsData.map((clinic, index) => (
                <li key={clinic.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3 relative">
                    <span className={`font-bold text-lg ${index < 3 ? 'text-primary' : 'text-muted-foreground'}`}>
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-semibold">{clinic.name}</p>
                       {index === 0 && <Crown className="h-4 w-4 text-yellow-400 absolute -top-1 -left-1" />}
                    </div>
                  </div>
                  <p className="font-bold text-primary">RD${clinic.revenue.toLocaleString('es-DO', {minimumFractionDigits: 2})}</p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
};

export default StatisticsDashboard;