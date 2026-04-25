import React, { useState, useEffect, useCallback } from 'react';
import { supabaseClient } from '@/config/supabaseConfig';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Download, ArrowLeft, Users, FileSpreadsheet, DollarSign, CheckCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useUser } from '@/contexts/UserContext';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { getStatusBadge } from './financialUtils';

const PayoutBatchDetails = ({ batchId, onBack }) => {
  const [batch, setBatch] = useState(null);
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const { profile } = useUser();
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    if (!batchId) return;
    setLoading(true);
    try {
      const [batchRes, payoutsRes] = await Promise.all([
        supabaseClient.from('payout_batches').select('*, processed_by_user:profiles(full_name)').eq('id', batchId).single(),
        supabaseClient.from('payouts').select('*, host:profiles(full_name, email)').eq('batch_id', batchId)
      ]);
      if (batchRes.error) throw batchRes.error;
      if (payoutsRes.error) throw payoutsRes.error;
      setBatch(batchRes.data);
      setPayouts(payoutsRes.data);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setLoading(false);
    }
  }, [batchId, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleMarkAsPaid = async () => {
    setIsProcessing(true);
    try {
      const { error } = await supabaseClient.rpc('mark_payout_batch_as_paid', { p_batch_id: batchId, p_user_id: profile.id });
      if (error) throw error;
      toast({ variant: 'success', title: 'Lote marcado como pagado' });
      fetchData();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setIsProcessing(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['Anfitrion', 'Email', 'Monto'];
    const rows = payouts.map(p => [p.host.full_name, p.host.email, p.amount]);
    let csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `lote_pago_${batchId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <div className="flex items-center justify-center h-96"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>;
  if (!batch) return <div className="text-center">No se encontró el lote de pago.</div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <Card className="glassmorphism">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Detalles del Lote de Pago</CardTitle>
              <CardDescription>ID: <span className="font-mono">{batch.id}</span></CardDescription>
            </div>
            <Button variant="ghost" onClick={onBack}><ArrowLeft className="mr-2 h-4 w-4" />Volver</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="flex items-center gap-4"><Users className="w-8 h-8 text-primary" /><div><p className="text-muted-foreground">Anfitriones</p><p className="text-xl font-bold">{payouts.length}</p></div></div>
            <div className="flex items-center gap-4"><FileSpreadsheet className="w-8 h-8 text-primary" /><div><p className="text-muted-foreground">Transacciones</p><p className="text-xl font-bold">{batch.transaction_count}</p></div></div>
            <div className="flex items-center gap-4"><DollarSign className="w-8 h-8 text-primary" /><div><p className="text-muted-foreground">Monto Total</p><p className="text-xl font-bold">RD${Number(batch.total_amount).toLocaleString('es-DO', { minimumFractionDigits: 2 })}</p></div></div>
          </div>
          <div className="flex items-center justify-between mb-4 p-4 rounded-lg bg-background/50">
            <div>
              <p className="font-semibold">Estado del Lote: {getStatusBadge(batch.status)}</p>
              <p className="text-xs text-muted-foreground">
                Creado por {batch.processed_by_user?.full_name || 'Sistema'} el {format(parseISO(batch.created_at), 'dd MMM yyyy, HH:mm', { locale: es })}
              </p>
              {batch.processed_at && (
                <p className="text-xs text-muted-foreground">
                  Procesado el {format(parseISO(batch.processed_at), 'dd MMM yyyy, HH:mm', { locale: es })}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={exportToCSV}><Download className="mr-2 h-4 w-4" />Exportar CSV</Button>
              {batch.status === 'processing' && (
                <Button onClick={handleMarkAsPaid} disabled={isProcessing}>
                  {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                  Marcar como Pagado
                </Button>
              )}
            </div>
          </div>
          <Table>
            <TableHeader><TableRow><TableHead>Anfitrión</TableHead><TableHead>Email</TableHead><TableHead>Estado</TableHead><TableHead className="text-right">Monto</TableHead></TableRow></TableHeader>
            <TableBody>
              {payouts.map(p => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.host.full_name}</TableCell>
                  <TableCell>{p.host.email}</TableCell>
                  <TableCell>{getStatusBadge(p.status)}</TableCell>
                  <TableCell className="text-right font-bold">RD${Number(p.amount).toLocaleString('es-DO', { minimumFractionDigits: 2 })}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default PayoutBatchDetails;