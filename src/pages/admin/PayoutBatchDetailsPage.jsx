import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabaseClient } from '@/config/supabaseConfig';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, ArrowLeft, Download, CheckCircle, AlertTriangle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

const PayoutBatchDetailsPage = () => {
  const { batchId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [batch, setBatch] = useState(null);
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);

  const getPayoutStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return <Badge variant="success">Completado</Badge>;
      case 'pending':
        return <Badge variant="outline">Pendiente</Badge>;
      case 'processing':
        return <Badge variant="warning">Procesando</Badge>;
      case 'failed':
        return <Badge variant="destructive">Fallido</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const fetchBatchDetails = useCallback(async () => {
    setLoading(true);
    try {
      const { data: batchData, error: batchError } = await supabase
        .from('payout_batches')
        .select('*')
        .eq('id', batchId)
        .single();
      if (batchError) throw batchError;
      setBatch(batchData);

      const { data: payoutsData, error: payoutsError } = await supabase
        .from('payouts')
        .select('*, host:profiles(full_name, email)')
        .eq('batch_id', batchId);
      if (payoutsError) throw payoutsError;
      setPayouts(payoutsData);

    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron cargar los detalles del lote.' });
      navigate('/admin/financials');
    } finally {
      setLoading(false);
    }
  }, [batchId, navigate, toast]);

  useEffect(() => {
    fetchBatchDetails();
  }, [fetchBatchDetails]);

  const exportToCSV = () => {
    const headers = ['Nombre Anfitrión', 'Email Anfitrión', 'Monto a Pagar'];
    const rows = payouts.map(p => [
      `"${p.host.full_name}"`,
      `"${p.host.email}"`,
      p.amount
    ]);

    let csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `lote_pago_${batchId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleMarkAsPaid = async () => {
    setIsCompleting(true);
    try {
        // First, get all transaction IDs associated with this batch
        const { data: transactionsToUpdate, error: fetchError } = await supabase
            .from('transactions')
            .select('id, bookings!inner(clinics!inner(host_id))')
            .in('bookings.clinics.host_id', payouts.map(p => p.host_id))
            .eq('payout_status', 'processing');

        if (fetchError) throw fetchError;

        const transactionIds = transactionsToUpdate.map(t => t.id);

        // Update transactions
        if (transactionIds.length > 0) {
            const { error: txError } = await supabase
                .from('transactions')
                .update({ payout_status: 'paid' })
                .in('id', transactionIds);
            if (txError) throw txError;
        }

        // Update payouts
        const { error: payoutError } = await supabase
            .from('payouts')
            .update({ status: 'paid' })
            .eq('batch_id', batchId);
        if (payoutError) throw payoutError;

        // Update batch
        const { error: batchError } = await supabase
            .from('payout_batches')
            .update({ status: 'completed', processed_at: new Date().toISOString() })
            .eq('id', batchId);
        if (batchError) throw batchError;

        toast({ title: 'Éxito', description: 'El lote de pago ha sido marcado como completado.' });
        fetchBatchDetails();

    } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudo completar el lote de pago. ' + error.message });
    } finally {
        setIsCompleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold gradient-text">Detalles del Lote de Pago</h1>
          <p className="text-muted-foreground font-mono text-sm">ID: {batchId}</p>
        </div>
        <Button variant="outline" onClick={() => navigate('/admin/financials')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a Finanzas
        </Button>
      </div>

      <Card className="glassmorphism">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Resumen del Lote</CardTitle>
              <CardDescription>
                Creado el {batch ? format(parseISO(batch.created_at), 'dd MMMM yyyy, HH:mm', { locale: es }) : ''}
              </CardDescription>
            </div>
            {getPayoutStatusBadge(batch?.status)}
          </div>
        </CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-4">
            <div className="flex flex-col p-4 bg-background/50 rounded-lg">
                <span className="text-sm text-muted-foreground">Monto Total</span>
                <span className="text-2xl font-bold">RD${batch?.total_amount.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex flex-col p-4 bg-background/50 rounded-lg">
                <span className="text-sm text-muted-foreground"># Transacciones</span>
                <span className="text-2xl font-bold">{batch?.transaction_count}</span>
            </div>
            <div className="flex flex-col p-4 bg-background/50 rounded-lg">
                <span className="text-sm text-muted-foreground"># Anfitriones</span>
                <span className="text-2xl font-bold">{payouts.length}</span>
            </div>
        </CardContent>
      </Card>

      <Card className="glassmorphism">
        <CardHeader>
            <div className="flex justify-between items-center">
                <div>
                    <CardTitle>Desglose de Pagos</CardTitle>
                    <CardDescription>Lista de todos los anfitriones y montos en este lote.</CardDescription>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={exportToCSV}>
                        <Download className="mr-2 h-4 w-4" />
                        Exportar CSV
                    </Button>
                    {batch?.status !== 'completed' && (
                        <Button onClick={handleMarkAsPaid} disabled={isCompleting}>
                            {isCompleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                            {isCompleting ? 'Completando...' : 'Marcar como Pagado'}
                        </Button>
                    )}
                </div>
            </div>
        </CardHeader>
        <CardContent>
            {batch?.status !== 'completed' && (
                <div className="mb-4 p-4 bg-yellow-100 dark:bg-yellow-900/30 border-l-4 border-yellow-500 rounded-r-lg">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <AlertTriangle className="h-5 w-5 text-yellow-500" aria-hidden="true" />
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-yellow-700 dark:text-yellow-200">
                                Antes de marcar como pagado, asegúrate de haber realizado las transferencias bancarias usando el archivo CSV. Esta acción es irreversible.
                            </p>
                        </div>
                    </div>
                </div>
            )}
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Anfitrión</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead className="text-right">Monto a Pagar</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {payouts.map((payout) => (
                            <TableRow key={payout.id}>
                                <TableCell className="font-medium">{payout.host.full_name}</TableCell>
                                <TableCell>{payout.host.email}</TableCell>
                                <TableCell className="text-right font-bold text-primary">RD${payout.amount.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default PayoutBatchDetailsPage;