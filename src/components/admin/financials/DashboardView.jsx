import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Send, FileText, Search, Download, CheckCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import StatCard from './StatCard';
import { getStatusBadge } from './financialUtils';
import RefundDialog from './RefundDialog';
import { useNavigate } from 'react-router-dom';

const DashboardView = ({ onNavigateToNewPayout, onNavigateToBatchDetails }) => {
  const [transactions, setTransactions] = useState([]);
  const [hostBalances, setHostBalances] = useState([]);
  const [payoutBatches, setPayoutBatches] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ status: 'all', payment_gateway: 'all', clinic_id: 'all' });
  const [transactionToRefund, setTransactionToRefund] = useState(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [transactionsRes, hostBalancesRes, payoutBatchesRes, clinicsRes] = await Promise.all([
        supabase.from('transactions').select(`
          *, 
          booking:bookings!inner(
            dentist:profiles!bookings_dentist_id_fkey(full_name), 
            clinic:clinics!bookings_clinic_id_fkey(id, name, host:profiles!clinics_host_id_fkey(full_name))
          )
        `).order('created_at', { ascending: false }),
        supabase.rpc('get_host_balances'),
        supabase.from('payout_batches').select('*').order('created_at', { ascending: false }),
        supabase.from('clinics').select('id, name, host:profiles(full_name)').order('name', { ascending: true })
      ]);

      if (transactionsRes.error) throw transactionsRes.error;
      if (hostBalancesRes.error) throw hostBalancesRes.error;
      if (payoutBatchesRes.error) throw payoutBatchesRes.error;
      if (clinicsRes.error) throw clinicsRes.error;

      setTransactions(transactionsRes.data ? transactionsRes.data.filter(t => t.booking) : []);
      setHostBalances(hostBalancesRes.data || []);
      setPayoutBatches(payoutBatchesRes.data || []);
      setClinics(clinicsRes.data || []);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error al cargar datos', description: error.message });
      setTransactions([]);
      setHostBalances([]);
      setPayoutBatches([]);
      setClinics([]);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
    const channel = supabase
      .channel('financial-dashboard-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payout_batches' }, fetchData)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

  const filteredTransactions = useMemo(() => transactions.filter(t => {
      const searchMatch = Object.values(t).some(val => String(val).toLowerCase().includes(searchTerm.toLowerCase())) ||
        t.booking?.dentist?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.booking?.clinic?.host?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.booking?.clinic?.name?.toLowerCase().includes(searchTerm.toLowerCase());

      const statusMatch = filters.status === 'all' || t.status === filters.status;
      const gatewayMatch = filters.payment_gateway === 'all' || t.payment_gateway === filters.payment_gateway;
      const clinicMatch = filters.clinic_id === 'all' || t.booking?.clinic?.id === filters.clinic_id;

      return searchMatch && statusMatch && gatewayMatch && clinicMatch;
  }), [transactions, searchTerm, filters]);

  const { totalVolume, platformRevenue, totalPendingPayouts } = useMemo(() => {
    const successfulTransactions = transactions.filter(t => t.status === 'succeeded');
    return {
      totalVolume: successfulTransactions.reduce((acc, t) => acc + Number(t.amount || 0), 0),
      platformRevenue: successfulTransactions.reduce((acc, t) => acc + Number(t.platform_fee || 0), 0),
      totalPendingPayouts: hostBalances.reduce((acc, h) => acc + Number(h.pending_payout_amount || 0), 0)
    };
  }, [transactions, hostBalances]);
  
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const exportToCSV = () => {
    const headers = ['ID Transacción', 'Fecha', 'Clínica', 'Anfitrión', 'Dentista', 'Monto', 'Comisión', 'Pago Anfitrión', 'Estado', 'Gateway', 'Estado Pago'];
    const rows = filteredTransactions.map(t => [
      t.transaction_id,
      format(parseISO(t.created_at), 'yyyy-MM-dd HH:mm', { locale: es }),
      t.booking?.clinic?.name,
      t.booking?.clinic?.host?.full_name,
      t.booking?.dentist?.full_name,
      t.amount,
      t.platform_fee,
      t.host_payout,
      t.status,
      t.payment_gateway,
      t.payout_status
    ]);
    let csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.map(cell => `"${String(cell || '').replace(/"/g, '""')}"`).join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "reporte_financiero.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  if (loading) {
    return <div className="flex items-center justify-center h-96"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>;
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="grid gap-6 md:grid-cols-3">
        <StatCard title="Volumen Total" value={`RD${totalVolume.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`} description="Total transaccionado exitosamente" type="volume" />
        <StatCard title="Ingresos Plataforma" value={`RD${platformRevenue.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`} description="Comisiones generadas de transacciones exitosas" type="revenue" />
        <StatCard title="Total Pagos Pendientes" value={`RD${totalPendingPayouts.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`} description="Total a pagar a anfitriones" type="pending" />
      </div>

      <Tabs defaultValue="transactions" className="w-full mt-8">
        <TabsList className="grid w-full grid-cols-4 bg-muted/50">
          <TabsTrigger value="transactions">Transacciones</TabsTrigger>
          <TabsTrigger value="pending_payouts">Liquidaciones</TabsTrigger>
          <TabsTrigger value="payout_history">Historial de Lotes</TabsTrigger>
          <TabsTrigger value="confirm_payments" onClick={() => navigate('/admin/booking-confirmation')}>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" /> Confirmar Pagos
            </div>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="transactions">
          <Card className="glassmorphism">
            <CardHeader>
              <div className="flex justify-between items-start">
                  <div>
                      <CardTitle>Historial de Transacciones</CardTitle>
                      <CardDescription>Busca y filtra todas las transacciones de la plataforma.</CardDescription>
                  </div>
                  <Button onClick={exportToCSV} variant="outline" size="sm"><Download className="mr-2 h-4 w-4" /> Exportar CSV</Button>
              </div>
              <div className="flex flex-col md:flex-row gap-4 mt-4">
                  <div className="relative flex-grow"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Buscar por ID, nombre..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 w-full" /></div>
                  <Select value={filters.clinic_id} onValueChange={(v) => handleFilterChange('clinic_id', v)}><SelectTrigger className="w-full md:w-[250px]"><SelectValue placeholder="Filtrar por clínica..." /></SelectTrigger><SelectContent><SelectItem value="all">Todas las clínicas</SelectItem>{clinics.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select>
                  <Select value={filters.status} onValueChange={(v) => handleFilterChange('status', v)}><SelectTrigger className="w-full md:w-[180px]"><SelectValue placeholder="Estado..." /></SelectTrigger><SelectContent><SelectItem value="all">Todos los estados</SelectItem><SelectItem value="succeeded">Exitoso</SelectItem><SelectItem value="pending">Pendiente</SelectItem><SelectItem value="failed">Fallido</SelectItem><SelectItem value="refund_requested">Reembolso Solicitado</SelectItem><SelectItem value="refunded">Reembolsado</SelectItem></SelectContent></Select>
                  <Select value={filters.payment_gateway} onValueChange={(v) => handleFilterChange('payment_gateway', v)}><SelectTrigger className="w-full md:w-[180px]"><SelectValue placeholder="Método..." /></SelectTrigger><SelectContent><SelectItem value="all">Todos los métodos</SelectItem><SelectItem value="Cardnet">Cardnet</SelectItem><SelectItem value="PayPal">PayPal</SelectItem></SelectContent></Select>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Fecha</TableHead><TableHead>Clínica/Anfitrión</TableHead><TableHead>Estado</TableHead><TableHead>Gateway</TableHead><TableHead className="text-right">Monto</TableHead><TableHead className="text-center">Acciones</TableHead></TableRow></TableHeader>
                <TableBody>
                  {filteredTransactions.length > 0 ? filteredTransactions.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell><div className="font-medium">{format(parseISO(t.created_at), 'dd MMM yyyy', { locale: es })}</div><div className="text-xs text-muted-foreground">{t.transaction_id.substring(0,12)}...</div></TableCell>
                      <TableCell><div>{t.booking?.clinic?.name || 'N/A'}</div><div className="text-xs text-muted-foreground">{t.booking?.clinic?.host?.full_name || 'N/A'}</div></TableCell>
                      <TableCell>{getStatusBadge(t.status)}</TableCell>
                      <TableCell>{t.payment_gateway}</TableCell>
                      <TableCell className="text-right font-medium">RD${parseFloat(t.amount).toLocaleString('es-DO', { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell className="text-center">
                        <Button variant="ghost" size="sm" onClick={() => setTransactionToRefund(t)}>Reembolso</Button>
                      </TableCell>
                    </TableRow>
                  )) : <TableRow><TableCell colSpan="6" className="text-center h-24">No se encontraron transacciones con los filtros actuales.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="pending_payouts">
          <Card className="glassmorphism">
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle>Saldos Pendientes</CardTitle>
                <CardDescription>Anfitriones con balance listos para liquidación.</CardDescription>
              </div>
              <Button onClick={onNavigateToNewPayout} disabled={hostBalances.length === 0}>
                <Send className="mr-2 h-4 w-4" /> Iniciar Proceso de Pago
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Anfitrión</TableHead>
                    <TableHead>RNC</TableHead>
                    <TableHead className="text-center">Transacciones</TableHead>
                    <TableHead className="text-right">Saldo a Pagar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {hostBalances.length > 0 ? hostBalances.map((host) => (
                    <TableRow key={host.host_id}>
                      <TableCell>
                        <div className="font-medium">{host.host_name}</div>
                        <div className="text-xs text-muted-foreground">{host.host_email}</div>
                      </TableCell>
                      <TableCell>{host.host_rnc || 'N/A'}</TableCell>
                      <TableCell className="text-center">{host.pending_transactions}</TableCell>
                      <TableCell className="text-right font-bold text-primary">RD${parseFloat(host.pending_payout_amount).toLocaleString('es-DO', { minimumFractionDigits: 2 })}</TableCell>
                    </TableRow>
                  )) : <TableRow><TableCell colSpan="4" className="text-center h-24">No hay saldos pendientes.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payout_history">
          <Card className="glassmorphism">
            <CardHeader><CardTitle>Historial de Lotes de Pago</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Fecha</TableHead><TableHead>Estado</TableHead><TableHead># Trans.</TableHead><TableHead className="text-right">Monto</TableHead><TableHead className="text-center">Acciones</TableHead></TableRow></TableHeader>
                <TableBody>
                  {payoutBatches.length > 0 ? payoutBatches.map((batch) => (
                    <TableRow key={batch.id}>
                      <TableCell>{format(parseISO(batch.created_at), 'dd MMM yyyy', { locale: es })}</TableCell>
                      <TableCell>{getStatusBadge(batch.status)}</TableCell>
                      <TableCell className="text-center">{batch.transaction_count}</TableCell>
                      <TableCell className="text-right font-medium">RD${parseFloat(batch.total_amount).toLocaleString('es-DO', { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell className="text-center">
                        <Button variant="outline" size="sm" onClick={() => onNavigateToBatchDetails(batch.id)}><FileText className="mr-2 h-4 w-4" />Ver Detalles</Button>
                      </TableCell>
                    </TableRow>
                  )) : <TableRow><TableCell colSpan="5" className="text-center h-24">No se han procesado lotes de pago.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      <RefundDialog 
        transaction={transactionToRefund}
        isOpen={!!transactionToRefund}
        onOpenChange={() => setTransactionToRefund(null)}
        onRefundSuccess={fetchData}
      />
    </motion.div>
  );
};

export default DashboardView;