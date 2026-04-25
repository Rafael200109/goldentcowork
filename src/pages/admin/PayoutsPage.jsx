import React, { useState, useEffect, useMemo } from 'react';
import { supabaseClient } from '@/config/supabaseConfig';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, ArrowLeft, Send, CheckSquare, Square } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';

const PayoutsPage = () => {
  const [hostBalances, setHostBalances] = useState([]);
  const [selectedHosts, setSelectedHosts] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useUser();

  useEffect(() => {
    const fetchHostBalances = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabaseClient.rpc('get_host_balances');
        if (error) throw error;
        setHostBalances(data);
        setSelectedHosts(new Set(data.map(h => h.host_id))); // Select all by default
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error al cargar saldos',
          description: error.message,
        });
      } finally {
        setLoading(false);
      }
    };
    fetchHostBalances();
  }, [toast]);

  const handleSelectHost = (hostId) => {
    setSelectedHosts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(hostId)) {
        newSet.delete(hostId);
      } else {
        newSet.add(hostId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedHosts.size === hostBalances.length) {
      setSelectedHosts(new Set());
    } else {
      setSelectedHosts(new Set(hostBalances.map(h => h.host_id)));
    }
  };

  const { totalPayoutAmount, totalTransactions } = useMemo(() => {
    return hostBalances
      .filter(h => selectedHosts.has(h.host_id))
      .reduce((acc, h) => {
        acc.totalPayoutAmount += parseFloat(h.pending_payout_amount);
        acc.totalTransactions += h.pending_transactions;
        return acc;
      }, { totalPayoutAmount: 0, totalTransactions: 0 });
  }, [hostBalances, selectedHosts]);

  const handleGeneratePayoutBatch = async () => {
    if (selectedHosts.size === 0) {
      toast({
        variant: 'destructive',
        title: 'No hay anfitriones seleccionados',
        description: 'Por favor, selecciona al menos un anfitrión para generar el lote de pago.',
      });
      return;
    }
    setIsProcessing(true);
    try {
        const { data: batchData, error: batchError } = await supabase
            .from('payout_batches')
            .insert({
                total_amount: totalPayoutAmount,
                transaction_count: totalTransactions,
                processed_by: user.id,
                status: 'processing',
            })
            .select()
            .single();

        if (batchError) throw batchError;

        const selectedHostIds = Array.from(selectedHosts);
        const payoutsToInsert = hostBalances
            .filter(h => selectedHostIds.includes(h.host_id))
            .map(h => ({
                batch_id: batchData.id,
                host_id: h.host_id,
                amount: h.pending_payout_amount,
                transaction_ids: [], // This will be populated server-side or via another query
            }));
        
        const { error: payoutsError } = await supabaseClient.from('payouts').insert(payoutsToInsert);
        if (payoutsError) throw payoutsError;

        // Update transaction statuses
        const { data: transactionsToUpdate, error: fetchError } = await supabase
            .from('transactions')
            .select('id, bookings(clinics(host_id))')
            .in('bookings.clinics.host_id', selectedHostIds)
            .eq('payout_status', 'pending');

        if (fetchError) throw fetchError;

        const transactionIdsToUpdate = transactionsToUpdate.map(t => t.id);
        
        if(transactionIdsToUpdate.length > 0) {
            const { error: updateError } = await supabase
                .from('transactions')
                .update({ payout_status: 'processing' })
                .in('id', transactionIdsToUpdate);
            if (updateError) throw updateError;
        }

        toast({
            title: 'Lote de Pago Generado',
            description: 'El lote de pago se ha creado y está listo para ser procesado.',
        });
        navigate(`/admin/payouts/batch/${batchData.id}`);

    } catch (error) {
        toast({
            variant: 'destructive',
            title: 'Error al generar el lote de pago',
            description: error.message,
        });
    } finally {
        setIsProcessing(false);
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold gradient-text">Procesar Pagos a Anfitriones</h1>
          <p className="text-muted-foreground">Selecciona los anfitriones para incluir en este lote de pago.</p>
        </div>
        <Button variant="outline" onClick={() => navigate('/admin/financials')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a Finanzas
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card className="glassmorphism">
            <CardHeader>
              <CardTitle>Anfitriones con Saldos Pendientes</CardTitle>
              <CardDescription>Selecciona los anfitriones a pagar.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Button variant="ghost" size="icon" onClick={handleSelectAll}>
                          {selectedHosts.size === hostBalances.length && hostBalances.length > 0 ? <CheckSquare className="h-5 w-5" /> : <Square className="h-5 w-5" />}
                        </Button>
                      </TableHead>
                      <TableHead>Anfitrión</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead className="text-center"># Transacciones</TableHead>
                      <TableHead className="text-right">Saldo a Pagar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {hostBalances.length > 0 ? hostBalances.map((host) => (
                      <TableRow key={host.host_id} data-state={selectedHosts.has(host.host_id) ? 'selected' : ''}>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => handleSelectHost(host.host_id)}>
                            {selectedHosts.has(host.host_id) ? <CheckSquare className="h-5 w-5 text-primary" /> : <Square className="h-5 w-5" />}
                          </Button>
                        </TableCell>
                        <TableCell className="font-medium">{host.host_name}</TableCell>
                        <TableCell>{host.host_email}</TableCell>
                        <TableCell className="text-center">{host.pending_transactions}</TableCell>
                        <TableCell className="text-right font-bold text-primary">RD${parseFloat(host.pending_payout_amount).toLocaleString('es-DO', {minimumFractionDigits: 2})}</TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan="5" className="text-center h-24">
                          No hay saldos pendientes de pago.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-1">
          <Card className="glassmorphism sticky top-24">
            <CardHeader>
              <CardTitle>Resumen del Lote de Pago</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Anfitriones seleccionados:</span>
                <span className="font-bold">{selectedHosts.size}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Transacciones a liquidar:</span>
                <span className="font-bold">{totalTransactions}</span>
              </div>
              <div className="flex justify-between items-center text-xl">
                <span className="font-semibold">Monto Total a Pagar:</span>
                <span className="font-bold text-primary">RD${totalPayoutAmount.toLocaleString('es-DO', {minimumFractionDigits: 2})}</span>
              </div>
              <Button 
                className="w-full" 
                size="lg" 
                onClick={handleGeneratePayoutBatch}
                disabled={isProcessing || selectedHosts.size === 0}
              >
                {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                {isProcessing ? 'Procesando...' : 'Generar Lote de Pago'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
};

export default PayoutsPage;