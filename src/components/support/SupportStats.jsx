import React, { useEffect, useState } from 'react';
import { supabaseClient } from '@/config/supabaseConfig';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, CheckCircle, AlertOctagon, Clock } from 'lucide-react';

export const SupportStats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const { data, error } = await supabaseClient.rpc('get_support_stats');
        if (error) throw error;
        setStats(data);
      } catch (e) {
        console.error("Stats error", e);
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  if (loading) return <Skeleton className="h-24 w-full" />;

  const statItems = [
    { label: 'Tickets Abiertos', value: stats?.open_tickets || 0, icon: TrendingUp, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Prioridad Alta', value: stats?.high_priority_open || 0, icon: AlertOctagon, color: 'text-red-500', bg: 'bg-red-50' },
    { label: 'Cerrados (Total)', value: stats?.closed_tickets || 0, icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50' },
    { label: 'Tiempo Promedio', value: `${stats?.avg_response_time || 0}m`, icon: Clock, color: 'text-orange-500', bg: 'bg-orange-50' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
      {statItems.map((item, idx) => (
        <Card key={idx} className="shadow-sm border-border/60">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{item.label}</p>
              <h4 className="text-2xl font-bold mt-1">{item.value}</h4>
            </div>
            <div className={`p-2 rounded-full ${item.bg}`}>
              <item.icon className={`w-5 h-5 ${item.color}`} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};