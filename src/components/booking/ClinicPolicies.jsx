import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { AlertCircle, AlertTriangle, CreditCard, Users, Clock, Info, RefreshCw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

const getPolicyIcon = (type) => {
  switch (type) {
    case 'rule': return <AlertCircle className="w-5 h-5" />;
    case 'cancellation': return <AlertTriangle className="w-5 h-5" />;
    case 'payment': return <CreditCard className="w-5 h-5" />;
    case 'behavior': return <Users className="w-5 h-5" />;
    case 'schedule': return <Clock className="w-5 h-5" />;
    case 'policy':
    case 'restriction':
    case 'other':
    default: return <Info className="w-5 h-5" />;
  }
};

const getPolicyTitle = (type) => {
  switch (type) {
    case 'rule': return 'Regla del Espacio';
    case 'cancellation': return 'Política de Cancelación';
    case 'payment': return 'Política de Pagos';
    case 'behavior': return 'Normas de Comportamiento';
    case 'schedule': return 'Horarios y Puntualidad';
    case 'restriction': return 'Restricciones';
    case 'policy':
    case 'other':
    default: return 'Política General';
  }
};

const ClinicPolicies = ({ clinic_id }) => {
  const [policies, setPolicies] = [useState([]), useState(true), useState(null)][0];
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPolicies = useCallback(async () => {
    if (!clinic_id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Small timeout to allow RLS propagation if needed, or simply fetch
      const { data, error: fetchError } = await supabase
        .from('clinic_policies')
        .select('*')
        .eq('clinic_id', clinic_id)
        .order('created_at', { ascending: true });

      if (fetchError) throw fetchError;
      setPolicies(data || []);
    } catch (err) {
      console.error('Error fetching clinic policies:', err);
      setError('Hubo un problema al cargar las políticas de la clínica.');
    } finally {
      setLoading(false);
    }
  }, [clinic_id]);

  useEffect(() => {
    fetchPolicies();
  }, [fetchPolicies]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-start gap-3 p-4 rounded-lg border bg-card">
            <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
            <div className="space-y-2 w-full">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-5/6" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center bg-muted/50 rounded-lg border border-dashed">
        <AlertTriangle className="w-10 h-10 text-destructive mb-3" />
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={fetchPolicies} variant="outline" size="sm" className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4" /> Intentar nuevamente
        </Button>
      </div>
    );
  }

  if (policies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center bg-muted/30 rounded-lg border border-dashed">
        <Info className="w-10 h-10 text-muted-foreground/50 mb-3" />
        <p className="text-muted-foreground font-medium">Esta clínica aún no ha agregado políticas</p>
        <p className="text-sm text-muted-foreground mt-1">Por favor, comunícate con el anfitrión si tienes dudas.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {policies.map((policy) => (
        <div key={policy.id} className="policy-list-item group">
          <div className="policy-icon-wrapper group-hover:bg-primary/10 group-hover:text-primary transition-colors duration-300">
            {getPolicyIcon(policy.policy_type)}
          </div>
          <div className="space-y-1">
            <h4 className="font-semibold text-sm text-foreground/90">
              {getPolicyTitle(policy.policy_type)}
            </h4>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {policy.policy_text}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ClinicPolicies;