import React, { useState } from 'react';
import { supabaseClient } from '@/config/supabaseConfig';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Loader2, MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const FeatureRequestActions = ({ request, onProcessed }) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Consider both 'pending' and 'pending_manual_payment' as actionable statuses
  const isPending = request.status === 'pending' || request.status === 'pending_manual_payment';

  const handleAction = async (action) => {
    setIsLoading(true);
    try {
      if (action === 'approve') {
        const { error } = await supabaseClient.rpc('process_feature_payment', {
            p_purchase_id: request.id,
            p_gateway_transaction_id: 'manual_admin_approval_' + Date.now()
        });
        
        if (error) throw error;
        toast({ title: "Solicitud Aprobada", description: "La clínica ha sido destacada correctamente." });
      } else { // 'reject'
        const { error } = await supabaseClient.rpc('reject_feature_purchase', { p_purchase_id: request.id });
        if (error) throw error;
        toast({ title: "Solicitud Rechazada", description: "La solicitud ha sido rechazada." });
      }
      onProcessed(); // Refresh the list
    } catch (error) {
      console.error('Error processing request:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || "Error al procesar la solicitud",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isPending) {
    let badgeText = request.status;
    let badgeClass = 'bg-slate-50 text-slate-600 border-slate-200';

    if (request.status === 'completed') {
        badgeText = 'Aprobada';
        badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    } else if (request.status === 'rejected') {
        badgeText = 'Rechazada';
        badgeClass = 'bg-red-50 text-red-700 border-red-200';
    }

    return (
      <Badge 
          variant="outline" 
          className={`px-3 py-1 font-medium border ${badgeClass}`}
      >
          {badgeText}
      </Badge>
    );
  }

  return (
    <div className="flex items-center justify-end">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 data-[state=open]:bg-muted hover:bg-slate-100" disabled={isLoading}>
            <span className="sr-only">Abrir menú</span>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : <MoreHorizontal className="h-4 w-4 text-slate-600" />}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[160px]">
          <DropdownMenuLabel>Opciones</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => handleAction('approve')} className="cursor-pointer text-emerald-600 focus:text-emerald-700 focus:bg-emerald-50">
            <CheckCircle className="mr-2 h-4 w-4" />
            <span>Aprobar Pago</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleAction('reject')} className="cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-50">
            <XCircle className="mr-2 h-4 w-4" />
            <span>Rechazar</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default FeatureRequestActions;