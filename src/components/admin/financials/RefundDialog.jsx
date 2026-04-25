import React, { useState } from 'react';
import { supabaseClient } from '@/config/supabaseConfig';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, ShieldAlert } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

const RefundDialog = ({ transaction, isOpen, onOpenChange, onRefundSuccess }) => {
  const [reason, setReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleProcessRefund = async () => {
    if (!reason) {
      toast({
        variant: 'destructive',
        title: 'Motivo requerido',
        description: 'Por favor, especifica un motivo para el reembolso.',
      });
      return;
    }
    setIsProcessing(true);
    try {
      // This updates the status for manual review.
      const { error } = await supabase
        .from('transactions')
        .update({ status: 'refund_requested', payout_status: `refund_requested: ${reason}` })
        .eq('id', transaction.id);

      if (error) throw error;

      toast({
        title: 'Solicitud de Reembolso Iniciada',
        description: 'La transacción ha sido marcada para revisión de reembolso manual.',
      });
      onRefundSuccess();
      onOpenChange(false);
      setReason('');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error al procesar reembolso',
        description: error.message,
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  if (!transaction) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Procesar Reembolso</DialogTitle>
          <DialogDescription>
            Estás a punto de iniciar un reembolso para la transacción <span className="font-mono">{transaction.transaction_id}</span>.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
            <div className="flex p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-200">
                <ShieldAlert className="h-5 w-5 mr-3 mt-1 flex-shrink-0" />
                <div>
                    <p className="font-semibold">Acción Manual Requerida</p>
                    <p className="text-xs">Este proceso solo marcará la transacción para revisión. Deberás procesar el reembolso manualmente en la plataforma de pago.</p>
                </div>
            </div>
            <div>
                <Label htmlFor="refund-reason">Motivo del Reembolso</Label>
                <Textarea 
                    id="refund-reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Ej: Cancelación del anfitrión, error en la reserva, etc."
                />
            </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleProcessRefund} disabled={isProcessing || !reason}>
            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Iniciar Reembolso
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RefundDialog;