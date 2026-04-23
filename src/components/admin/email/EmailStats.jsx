import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Mail, CheckCircle, XCircle } from 'lucide-react';

const EmailStats = () => {
    const [stats, setStats] = useState({ sent: 0, failed: 0, total: 0, chartData: [] });

    useEffect(() => {
        const fetchStats = async () => {
            const { data, error } = await supabase
                .from('email_logs')
                .select('status, sent_at')
                .gte('sent_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()); // Last 7 days

            if (data && !error) {
                const sent = data.filter(r => r.status === 'sent').length;
                const failed = data.filter(r => r.status === 'failed').length;
                
                // Process chart data (by day)
                const chartMap = {};
                data.forEach(item => {
                    const date = new Date(item.sent_at).toLocaleDateString('es-DO', { weekday: 'short', day: 'numeric' });
                    if (!chartMap[date]) chartMap[date] = { name: date, sent: 0, failed: 0 };
                    if (item.status === 'sent') chartMap[date].sent++;
                    else chartMap[date].failed++;
                });

                setStats({
                    sent,
                    failed,
                    total: data.length,
                    chartData: Object.values(chartMap).reverse()
                });
            }
        };
        fetchStats();
    }, []);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3 bg-blue-100 text-blue-600 rounded-full"><Mail /></div>
                        <div>
                            <p className="text-sm text-muted-foreground">Total (7 días)</p>
                            <p className="text-2xl font-bold">{stats.total}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3 bg-green-100 text-green-600 rounded-full"><CheckCircle /></div>
                        <div>
                            <p className="text-sm text-muted-foreground">Enviados</p>
                            <p className="text-2xl font-bold">{stats.sent}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3 bg-red-100 text-red-600 rounded-full"><XCircle /></div>
                        <div>
                            <p className="text-sm text-muted-foreground">Fallidos</p>
                            <p className="text-2xl font-bold">{stats.failed}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Rendimiento de Envíos</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="sent" fill="#22c55e" name="Enviados" stackId="a" />
                            <Bar dataKey="failed" fill="#ef4444" name="Fallidos" stackId="a" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
};

export default EmailStats;