import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, XCircle, RefreshCw, AlertTriangle } from 'lucide-react';

export const getStatusBadge = (status) => {
  const variants = {
    succeeded: { variant: 'success', icon: <CheckCircle className="h-3 w-3" />, label: 'Exitoso' },
    pending: { variant: 'outline', icon: <Clock className="h-3 w-3" />, label: 'Pendiente' },
    failed: { variant: 'destructive', icon: <XCircle className="h-3 w-3" />, label: 'Fallido' },
    paid: { variant: 'success', icon: <CheckCircle className="h-3 w-3" />, label: 'Pagado' },
    processing: { variant: 'warning', icon: <Clock className="h-3 w-3" />, label: 'Procesando' },
    completed: { variant: 'success', icon: <CheckCircle className="h-3 w-3" />, label: 'Completado' },
    refund_requested: { variant: 'warning', icon: <RefreshCw className="h-3 w-3" />, label: 'Reembolso Solicitado' },
    refunded: { variant: 'destructive', icon: <RefreshCw className="h-3 w-3" />, label: 'Reembolsado' },
  };
  
  const statusKey = status?.includes('refund_requested') ? 'refund_requested' : status;
  const s = variants[statusKey] || { variant: 'default', label: status, icon: <AlertTriangle className="h-3 w-3" /> };

  return <Badge variant={s.variant} className="gap-1.5 capitalize">{s.icon}{s.label}</Badge>;
};