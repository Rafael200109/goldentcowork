import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import StatCard from '@/components/admin/StatCard';
import RealTimeActivity from '@/components/admin/RealTimeActivity';
import AdminAvailabilityManager from '@/components/admin/AdminAvailabilityManager';
import AdminSystemSettings from '@/components/admin/AdminSystemSettings';
import AuditLogViewer from '@/components/admin/AuditLogViewer';
import { 
  FiUsers, FiHome, FiDollarSign, FiLifeBuoy, FiUserCheck, FiClock, 
  FiCalendar, FiBarChart2, FiSettings, FiCpu, FiMail, FiFileText, FiInfo
} from 'react-icons/fi';
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

const AdminDashboard = () => {
    const [stats, setStats] = useState({
        totalUsers: 0,
        registeredClinics: 0,
        monthlyRevenue: 0,
        openSupportTickets: 0,
        pendingHostRequests: 0,
        pendingBookings: 0
    });
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const fetchDashboardData = async () => {
            setLoading(true);
            try {
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

                const [
                    usersCount,
                    clinicsCount,
                    revenueData,
                    ticketsCount,
                    hostRequestsCount,
                    pendingBookingsCount
                ] = await Promise.all([
                    supabase.from('profiles').select('id', { count: 'exact', head: true }),
                    supabase.from('clinics').select('id', { count: 'exact', head: true }),
                    supabase.from('transactions').select('platform_fee').eq('status', 'succeeded').gte('created_at', thirtyDaysAgo.toISOString()),
                    supabase.from('support_conversations').select('id', { count: 'exact', head: true }).in('status', ['open', 'pending']),
                    supabase.from('host_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
                    supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('status', 'pending')
                ]);

                if (usersCount.error) throw usersCount.error;
                if (clinicsCount.error) throw clinicsCount.error;
                if (revenueData.error) throw revenueData.error;
                if (ticketsCount.error) throw ticketsCount.error;
                if (hostRequestsCount.error) throw hostRequestsCount.error;
                if (pendingBookingsCount.error) throw pendingBookingsCount.error;

                const totalRevenue = revenueData.data.reduce((sum, transaction) => sum + transaction.platform_fee, 0);

                setStats({
                    totalUsers: usersCount.count,
                    registeredClinics: clinicsCount.count,
                    monthlyRevenue: totalRevenue,
                    openSupportTickets: ticketsCount.count,
                    pendingHostRequests: hostRequestsCount.count,
                    pendingBookings: pendingBookingsCount.count
                });

            } catch (error) {
                toast({
                    variant: "destructive",
                    title: "Error al cargar el panel",
                    description: "No se pudieron obtener los datos del panel de administración.",
                });
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [toast]);

    const quickActions = [
        { title: 'Usuarios', href: '/admin/users', icon: FiUsers, description: 'Directorio completo', color: 'text-blue-500 bg-blue-50' },
        { title: 'Gestión de Correos', href: '/admin/emails', icon: FiMail, description: 'Plantillas y envíos', color: 'text-indigo-500 bg-indigo-50' },
        { title: 'Validar Clínicas', href: '/admin/clinic-validation', icon: FiHome, description: 'Aprobar nuevas sedes', color: 'text-green-500 bg-green-50' },
        { title: 'Pagos Manuales', href: '/admin/booking-confirmation', icon: FiClock, description: 'Confirmar pagos Cardnet', count: stats.pendingBookings, color: 'text-amber-500 bg-amber-50' },
        { title: 'Solicitudes Host', href: '/admin/host-requests', icon: FiUserCheck, description: 'Aspirantes a anfitrión', count: stats.pendingHostRequests, color: 'text-purple-500 bg-purple-50' },
        { title: 'Finanzas', href: '/admin/financials', icon: FiDollarSign, description: 'Pagos y cobros', color: 'text-emerald-500 bg-emerald-50' },
        { title: 'Soporte', href: '/support-dashboard', icon: FiLifeBuoy, description: 'Centro de ayuda', count: stats.openSupportTickets, color: 'text-red-500 bg-red-50' },
        { title: 'Políticas', href: '/admin/policies', icon: FiFileText, description: 'Términos y condiciones', color: 'text-slate-500 bg-slate-100 dark:bg-slate-800' },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col gap-6"
        >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Panel de Control</h1>
                    <p className="text-muted-foreground mt-1">Gestión integral de la plataforma Goldent.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" asChild>
                         <Link to="/admin/statistics"><FiBarChart2 className="w-4 h-4 mr-2" /> Reportes Detallados</Link>
                    </Button>
                </div>
            </div>

            <div className="bg-accent/30 border border-accent/50 rounded-lg p-3 flex items-start gap-3">
               <FiInfo className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
               <p className="text-sm text-muted-foreground">
                 <strong>Nota de ingresos:</strong> La métrica de ingresos refleja la comisión de plataforma (25% por transacción) retenida del monto total de cada reserva confirmada.
               </p>
            </div>

            <Tabs defaultValue="overview" className="w-full space-y-6">
                <TabsList className="w-full justify-start h-auto p-1 bg-transparent border-b rounded-none space-x-6 overflow-x-auto">
                    <TabsTrigger value="overview" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 py-2">Resumen</TabsTrigger>
                    <TabsTrigger value="availability" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 py-2">Gestión de Disponibilidad</TabsTrigger>
                    <TabsTrigger value="system" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 py-2">Configuración Sistema</TabsTrigger>
                    <TabsTrigger value="audit" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 py-2">
                        <FiClock className="w-4 h-4 mr-2" /> Auditoría
                    </TabsTrigger>
                </TabsList>

                {/* OVERVIEW TAB */}
                <TabsContent value="overview" className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-500">
                    {/* Stats Grid */}
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                        <StatCard title="Total Usuarios" value={stats.totalUsers} icon={FiUsers} loading={loading} />
                        <StatCard title="Clínicas Activas" value={stats.registeredClinics} icon={FiHome} loading={loading} />
                        <StatCard title="Ingresos (30d)" value={`RD$${stats.monthlyRevenue.toLocaleString('es-DO', { minimumFractionDigits: 0 })}`} icon={FiDollarSign} loading={loading} />
                        <StatCard title="Tickets Abiertos" value={stats.openSupportTickets} icon={FiLifeBuoy} loading={loading} />
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                        {/* Quick Actions */}
                        <div className="xl:col-span-2 space-y-6">
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                <FiSettings className="w-5 h-5 text-primary" /> Accesos Directos
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                {quickActions.map((action) => (
                                    <Link to={action.href} key={action.title} className="group relative">
                                        <div className="h-full p-5 bg-card rounded-xl border shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.02] flex flex-col justify-between">
                                            <div className="flex items-start justify-between mb-4">
                                                <div className={`p-3 rounded-lg ${action.color}`}>
                                                    <action.icon className="w-6 h-6" />
                                                </div>
                                                {action.count > 0 && (
                                                    <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-sm animate-pulse">
                                                        {action.count}
                                                    </span>
                                                )}
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-card-foreground group-hover:text-primary transition-colors">{action.title}</h3>
                                                <p className="text-xs text-muted-foreground mt-1">{action.description}</p>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* Activity Feed */}
                        <div className="xl:col-span-1 h-full min-h-[400px]">
                            <RealTimeActivity />
                        </div>
                    </div>
                </TabsContent>

                {/* AVAILABILITY TAB */}
                <TabsContent value="availability" className="animate-in fade-in slide-in-from-right-4 duration-500">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 mb-4">
                             <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                <FiCalendar className="w-6 h-6" />
                             </div>
                             <div>
                                <h2 className="text-xl font-semibold">Calendario Global de Clínicas</h2>
                                <p className="text-sm text-muted-foreground">Consulta y bloquea horarios de cualquier clínica registrada.</p>
                             </div>
                        </div>
                        <AdminAvailabilityManager />
                    </div>
                </TabsContent>

                {/* SYSTEM TAB */}
                <TabsContent value="system" className="animate-in fade-in slide-in-from-right-4 duration-500">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 mb-6">
                             <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                <FiCpu className="w-6 h-6" />
                             </div>
                             <div>
                                <h2 className="text-xl font-semibold">Configuración del Sistema</h2>
                                <p className="text-sm text-muted-foreground">Administración centralizada de la plataforma, roles y políticas.</p>
                             </div>
                        </div>
                        <AdminSystemSettings />
                    </div>
                </TabsContent>

                {/* AUDIT TAB */}
                <TabsContent value="audit" className="animate-in fade-in slide-in-from-right-4 duration-500">
                     <div className="space-y-4">
                        <div className="flex items-center gap-3 mb-6">
                             <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                <FiClock className="w-6 h-6" />
                             </div>
                             <div>
                                <h2 className="text-xl font-semibold">Historial de Auditoría</h2>
                                <p className="text-sm text-muted-foreground">Registro inmutable de todas las acciones administrativas realizadas.</p>
                             </div>
                        </div>
                        <AuditLogViewer />
                    </div>
                </TabsContent>
            </Tabs>
        </motion.div>
    );
};

export default AdminDashboard;