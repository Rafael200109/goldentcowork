import React, { useState, useEffect, useCallback } from 'react';
import { supabaseClient } from '@/config/supabaseConfig';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, UserPlus, Home, DollarSign, CalendarPlus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from '@/components/ui/skeleton';

const activityIcons = {
    new_user: <UserPlus className="w-5 h-5 text-blue-500" />,
    new_clinic: <Home className="w-5 h-5 text-green-500" />,
    new_booking: <CalendarPlus className="w-5 h-5 text-purple-500" />,
    new_transaction: <DollarSign className="w-5 h-5 text-yellow-500" />,
};

const RealTimeActivity = () => {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    const fetchInitialActivities = useCallback(async () => {
        setLoading(true);
        try {
            const [users, clinics, bookings, transactions] = await Promise.all([
                supabaseClient.from('profiles').select('full_name, created_at, id').order('created_at', { ascending: false }).limit(5),
                supabaseClient.from('clinics').select('name, created_at, id').order('created_at', { ascending: false }).limit(5),
                supabaseClient.from('bookings').select('id, created_at, dentist_id, profiles(full_name)').order('created_at', { ascending: false }).limit(5),
                supabaseClient.from('transactions').select('id, amount, created_at, status').eq('status', 'succeeded').order('created_at', { ascending: false }).limit(5)
            ]);

            if (users.error) throw users.error;
            if (clinics.error) throw clinics.error;
            if (bookings.error) throw bookings.error;
            if (transactions.error) throw transactions.error;

            const combinedActivities = [
                ...users.data.map(u => ({ type: 'new_user', text: `${u.full_name} se ha registrado.`, time: u.created_at, id: `user-${u.id}` })),
                ...clinics.data.map(c => ({ type: 'new_clinic', text: `Nueva clínica registrada: ${c.name}.`, time: c.created_at, id: `clinic-${c.id}` })),
                ...bookings.data.map(b => ({ type: 'new_booking', text: `${b.profiles?.full_name || 'Un dentista'} ha hecho una reserva.`, time: b.created_at, id: `booking-${b.id}` })),
                ...transactions.data.map(t => ({ type: 'new_transaction', text: `Nuevo pago exitoso de RD$${t.amount}.`, time: t.created_at, id: `txn-${t.id}` }))
            ];

            const sortedActivities = combinedActivities.sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 10);
            setActivities(sortedActivities);

        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error al cargar actividad",
                description: "No se pudo obtener la actividad reciente. " + error.message,
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchInitialActivities();

        const channel = supabaseClient.channel('public-activity')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'profiles' }, (payload) => {
                const u = payload.new;
                setActivities(prev => [{ type: 'new_user', text: `${u.full_name} se ha registrado.`, time: u.created_at, id: `user-${u.id}` }, ...prev].slice(0, 10));
            })
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'clinics' }, (payload) => {
                const c = payload.new;
                setActivities(prev => [{ type: 'new_clinic', text: `Nueva clínica registrada: ${c.name}.`, time: c.created_at, id: `clinic-${c.id}` }, ...prev].slice(0, 10));
            })
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bookings' }, async (payload) => {
                const b = payload.new;
                const { data: profile } = await supabaseClient.from('profiles').select('full_name').eq('id', b.dentist_id).single();
                setActivities(prev => [{ type: 'new_booking', text: `${profile?.full_name || 'Un dentista'} ha hecho una reserva.`, time: b.created_at, id: `booking-${b.id}` }, ...prev].slice(0, 10));
            })
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'transactions' }, (payload) => {
                const t = payload.new;
                if (t.status === 'succeeded') {
                    setActivities(prev => [{ type: 'new_transaction', text: `Nuevo pago exitoso de RD$${t.amount}.`, time: t.created_at, id: `txn-${t.id}` }, ...prev].slice(0, 10));
                }
            })
            .subscribe();

        return () => {
            supabaseClient.removeChannel(channel);
        };
    }, [fetchInitialActivities]);

    return (
        <Card className="h-full flex flex-col glassmorphism">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Actividad en Tiempo Real</CardTitle>
                <Bell className="w-5 h-5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="flex-grow overflow-y-auto">
                {loading ? (
                    <div className="space-y-4">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="flex items-center space-x-4">
                                <Skeleton className="h-10 w-10 rounded-full" />
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-[200px]" />
                                    <Skeleton className="h-4 w-[100px]" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <AnimatePresence>
                        {activities.length > 0 ? (
                            <ul className="space-y-4">
                                {activities.map((activity) => (
                                    <motion.li
                                        key={activity.id}
                                        layout
                                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ duration: 0.3 }}
                                        className="flex items-start space-x-4"
                                    >
                                        <div className="p-2 bg-background rounded-full border">
                                            {activityIcons[activity.type]}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-card-foreground">{activity.text}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {formatDistanceToNow(new Date(activity.time), { addSuffix: true, locale: es })}
                                            </p>
                                        </div>
                                    </motion.li>
                                ))}
                            </ul>
                        ) : (
                            <div className="text-center text-muted-foreground py-10">
                                <p>No hay actividad reciente.</p>
                            </div>
                        )}
                    </AnimatePresence>
                )}
            </CardContent>
        </Card>
    );
};

export default RealTimeActivity;