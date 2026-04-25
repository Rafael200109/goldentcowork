import React, { useState } from 'react';
import { supabaseClient } from '@/config/supabaseConfig';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

const DocumentValidationActions = ({ document, userId, onActionComplete }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  const updateDocumentStatus = async (status, reason = null) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('dentist_documents')
        .update({ status, rejection_reason: reason, reviewed_at: new Date().toISOString() })
        .eq('id', document.id);

      if (error) throw error;

      const { data: allDocs, error: fetchError } = await supabase
        .from('dentist_documents')
        .select('status')
        .eq('user_id', userId);

      if (fetchError) throw fetchError;

      const allVerified = allDocs.every(doc => doc.status === 'approved');
      let newProfileStatus;

      if (allVerified) {
        newProfileStatus = 'verified';
      } else {
        const hasRejected = allDocs.some(doc => doc.status === 'rejected');
        newProfileStatus = hasRejected ? 'rejected' : 'pending_review';
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ documentation_status: newProfileStatus })
        .eq('id', userId);

      if (profileError) throw profileError;


      toast({
        title: 'Estado actualizado',
        description: `El documento ha sido marcado como ${status}.`,
      });
      onActionComplete();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error al actualizar',
        description: error.message,
      });
    } finally {
      setLoading(false);
      setIsRejecting(false);
      setRejectionReason('');
    }
  };

  const handleApprove = () => {
    updateDocumentStatus('approved');
  };

  const handleReject = () => {
    if (!rejectionReason) {
      toast({
        variant: 'destructive',
        title: 'Motivo requerido',
        description: 'Por favor, especifica un motivo para el rechazo.',
      });
      return;
    }
    updateDocumentStatus('rejected', rejectionReason);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <Badge variant="success">Aprobado</Badge>;
      case 'pending_review':
        return <Badge variant="warning">Pendiente</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rechazado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium">Estado:</span>
        {getStatusBadge(document.status)}
      </div>

      {document.status === 'pending_review' && (
        <div className="flex space-x-2">
          <Button onClick={handleApprove} disabled={loading} size="sm" className="flex-1 bg-green-600 hover:bg-green-700">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
            Aprobar
          </Button>
          <Button onClick={() => setIsRejecting(true)} disabled={loading} variant="destructive" size="sm" className="flex-1">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
            Rechazar
          </Button>
        </div>
      )}

      {document.status === 'rejected' && document.rejection_reason && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm font-semibold text-red-800">Motivo del Rechazo:</p>
          <p className="text-sm text-red-700">{document.rejection_reason}</p>
        </div>
      )}

      <Dialog open={isRejecting} onOpenChange={setIsRejecting}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rechazar Documento</DialogTitle>
            <DialogDescription>
              Por favor, proporciona un motivo claro para el rechazo. Esta información será visible para el usuario.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Ej: La imagen no es legible, el documento ha expirado..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejecting(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleReject} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirmar Rechazo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DocumentValidationActions;