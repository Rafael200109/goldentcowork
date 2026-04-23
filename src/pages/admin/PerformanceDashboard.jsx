import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Activity, Clock, Zap, Server } from 'lucide-react';
import { motion } from 'framer-motion';

const mockLoadData = [
  { time: '10:00', load: 1.2 }, { time: '11:00', load: 1.5 },
  { time: '12:00', load: 0.9 }, { time: '13:00', load: 2.1 },
  { time: '14:00', load: 1.8 }, { time: '15:00', load: 1.1 },
];

const mockVitals = [
  { metric: 'LCP (s)', value: 1.8, target: 2.5, status: 'good' },
  { metric: 'FID (ms)', value: 45, target: 100, status: 'good' },
  { metric: 'CLS', value: 0.04, target: 0.1, status: 'good' },
  { metric: 'TTFB (ms)', value: 250, target: 600, status: 'good' }
];

export default function PerformanceDashboard() {
  const [metrics, setMetrics] = useState(mockVitals);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Rendimiento del Sistema</h1>
          <p className="text-muted-foreground mt-1">Monitoreo de Core Web Vitals y tiempos de carga</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{m.metric}</p>
                    <h3 className="text-2xl font-bold mt-2">{m.value}</h3>
                  </div>
                  <div className={`p-2 rounded-full ${m.value <= m.target ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                    <Activity className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-4">Target: &lt; {m.target}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg"><Clock className="w-5 h-5 mr-2" /> Tiempos de Carga (Últimas 6 horas)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mockLoadData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.5} />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="load" stroke="#67953D" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg"><Server className="w-5 h-5 mr-2" /> Tasa de Aciertos de Caché</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex flex-col items-center justify-center">
              <div className="relative w-48 h-48 rounded-full border-8 border-muted flex items-center justify-center">
                <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                  <circle cx="96" cy="96" r="88" fill="none" stroke="currentColor" strokeWidth="16" className="text-muted opacity-20" />
                  <circle cx="96" cy="96" r="88" fill="none" stroke="#2B391F" strokeWidth="16" strokeDasharray="552" strokeDashoffset="110" className="transition-all duration-1000" />
                </svg>
                <div className="text-center">
                  <span className="text-4xl font-bold text-primary">82%</span>
                  <p className="text-xs text-muted-foreground">Hit Rate</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-8 text-center max-w-[250px]">
                El uso de useCache en consultas de clínicas reduce llamadas a Supabase en un 82%.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}