import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Send, ArrowLeft } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Checkbox } from "@/components/ui/checkbox";
import { useUser } from '@/contexts/UserContext';

const PayoutsFlow = ({ onBack, onBatchCreated }) => {
  const [hostBalances, setHostBalances] = useState([]);
  const [selectedHosts, setSelectedHosts] = useState({});
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const { profile } = useUser();
  const { toast } = useToast();

  useEffect(() => {
    const fetchBalances = async () => {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_host_balances');
      if (error) {
        toast({ variant: 'destructive', title: 'Error', description: error.message });
        setHostBalances([]);
      } else {
        setHostBalances(data || []);
      }
      setLoading(false);
    };
    fetchBalances();
  }, [toast]);

  const handleSelectHost = (hostId, isSelected) => {
    setSelectedHosts(prev => ({ ...prev, [hostId]: isSelected }));
  };

  const handleSelectAll = (isSelected) => {
    const newSelection = {};
    if (isSelected) {
      hostBalances.forEach(h => newSelection[h.host_id] = true);
    }
    setSelectedHosts(newSelection);
  };

  const { totalAmount, totalHosts, totalTransactions } = useMemo(() => {
    const selected = hostBalances.filter(h => selectedHosts[h.host_id]);
    return {
      totalAmount: selected.reduce((acc, h) => acc + Number(h.pending_payout_amount), 0),
      totalHosts: selected.length,
      totalTransactions: selected.reduce((acc, h) => acc + Number(h.pending_transactions), 0)
    };
  }, [hostBalances, selectedHosts]);

  const handleCreateBatch = async () => {
    if (totalHosts === 0) {
      toast({ variant: 'warning', title: 'Seleccione al menos un anfitrión' });
      return;
    }
    setIsProcessing(true);
    try {
      const selectedHostIds = Object.keys(selectedHosts).filter(id => selectedHosts[id]);
      const { data: batchId, error: batchError } = await supabase.rpc('create_payout_batch', {
        p_host_ids: selectedHostIds,
        p_processed_by: profile.id
      });

      if (batchError) throw batchError;
      if (!batchId) throw new Error("No se pudo crear el lote de pago.");

      toast({ variant: 'success', title: 'Lote de pago creado exitosamente!' });
      onBatchCreated(batchId);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error al crear lote', description: error.message });
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-96"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <Card className="glassmorphism">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Nuevo Lote de Pago</CardTitle>
              <CardDescription>Selecciona los anfitriones para incluir en la liquidación.</CardDescription>
            </div>
            <Button variant="ghost" onClick={onBack}><ArrowLeft className="mr-2 h-4 w-4" />Volver</Button>
          </div>
        </CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]"><Checkbox onCheckedChange={handleSelectAll} disabled={hostBalances.length === 0} /></TableHead>
                  <TableHead>Anfitrión</TableHead>
                  <TableHead>RNC</TableHead>
                  <TableHead className="text-center">Transacciones</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {hostBalances.length > 0 ? hostBalances.map(host => (
                  <TableRow key={host.host_id} data-state={selectedHosts[host.host_id] && "selected"}>
                    <TableCell><Checkbox checked={!!selectedHosts[host.host_id]} onCheckedChange={(checked) => handleSelectHost(host.host_id, !!checked)} /></TableCell>
                    <TableCell>
                      <div className="font-medium">{host.host_name}</div>
                      <div className="text-xs text-muted-foreground">{host.host_email}</div>
                    </TableCell>
                    <TableCell>{host.host_rnc || 'N/A'}</TableCell>
                    <TableCell className="text-center">{host.pending_transactions}</TableCell>
                    <TableCell className="text-right font-bold">RD${Number(host.pending_payout_amount).toLocaleString('es-DO', { minimumFractionDigits: 2 })}</TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan="5" className="text-center h-24">No hay anfitriones con saldos pendientes.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="md:col-span-1">
            <Card className="bg-background/50 sticky top-24">
              <CardHeader><CardTitle>Resumen del Lote</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center"><span className="text-muted-foreground">Anfitriones</span><span className="font-bold">{totalHosts}</span></div>
                <div className="flex justify-between items-center"><span className="text-muted-foreground">Transacciones</span><span className="font-bold">{totalTransactions}</span></div>
                <hr className="border-border/20" />
                <div className="flex justify-between items-center text-lg"><span className="text-muted-foreground">Monto Total</span><span className="font-bold text-primary">RD${totalAmount.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span></div>
                <Button className="w-full" size="lg" onClick={handleCreateBatch} disabled={isProcessing || totalHosts === 0}>
                  {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                  Crear Lote de Pago
                </Button>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default PayoutsFlow;