
import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { checkInCheckOutService } from '@/lib/checkInCheckOutService';
import { validateCheckInData, validateCheckOutData } from '@/lib/checkInCheckOutValidation';
import { retryWithBackoff } from '@/lib/supabaseValidator';
import { useSupabaseConnection } from '@/hooks/useSupabaseConnection';

export function useCheckInCheckOut() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { isConnected } = useSupabaseConnection();
  
  const [activeCheckIn, setActiveCheckIn] = useState(null);
  const [history, setHistory] = useState([]);
  const [totalHistoryCount, setTotalHistoryCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchActiveCheckIn = useCallback(async () => {
    if (!user || !isConnected) {
      setLoading(false);
      return;
    }

    try {
      const fetchOperation = async () => {
        const { data, error } = await checkInCheckOutService.getActiveCheckInForHost(user.id);
        if (error) throw new Error(error);
        return data;
      };

      const data = await retryWithBackoff(fetchOperation);
      setActiveCheckIn(data);
    } catch (err) {
      console.error('❌ [useCheckInCheckOut] Fetch active error:', err);
    } finally {
      setLoading(false);
    }
  }, [user, isConnected]);

  const fetchHistory = useCallback(async (limit = 20, offset = 0) => {
    if (!user || !isConnected) return;
    
    setLoadingHistory(true);
    try {
      const fetchOperation = async () => {
        const { data, count, error } = await checkInCheckOutService.getCheckInHistoryForHost(user.id, limit, offset);
        if (error) throw new Error(error);
        return { data, count };
      };

      const { data, count } = await retryWithBackoff(fetchOperation);
      setHistory(data || []);
      setTotalHistoryCount(count || 0);
    } catch (err) {
      console.error('❌ [useCheckInCheckOut] Fetch history error:', err);
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    } finally {
      setLoadingHistory(false);
    }
  }, [user, isConnected, toast]);

  useEffect(() => {
    fetchActiveCheckIn();
  }, [fetchActiveCheckIn]);

  const createCheckIn = async (clinic_id, notes) => {
    if (!user || !isConnected) {
      toast({ variant: 'destructive', title: 'Error', description: 'No hay conexión con Supabase' });
      return false;
    }
    
    const validation = validateCheckInData(clinic_id, notes);
    if (!validation.valid) {
      toast({ variant: 'destructive', title: 'Error de validación', description: validation.error });
      return false;
    }

    setActionLoading(true);
    try {
      const createOperation = async () => {
        const { data, error } = await checkInCheckOutService.createCheckInRecord(user.id, clinic_id, notes);
        if (error) throw new Error(error);
        return data;
      };

      const data = await retryWithBackoff(createOperation);
      setActiveCheckIn(data);
      toast({ title: 'Llegada Registrada', description: 'Has registrado tu llegada exitosamente.' });
      fetchHistory();
      return true;
    } catch (err) {
      console.error('❌ [useCheckInCheckOut] Create check-in error:', err);
      toast({ variant: 'destructive', title: 'Error', description: err.message });
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  const createCheckOut = async (check_in_id, notes) => {
    if (!user || !activeCheckIn || !isConnected) {
      toast({ variant: 'destructive', title: 'Error', description: 'No hay conexión con Supabase' });
      return false;
    }

    const validation = validateCheckOutData(check_in_id, notes);
    if (!validation.valid) {
      toast({ variant: 'destructive', title: 'Error de validación', description: validation.error });
      return false;
    }

    setActionLoading(true);
    try {
      const checkOutOperation = async () => {
        const { error } = await checkInCheckOutService.createCheckOutRecord(check_in_id, notes, activeCheckIn.check_in_time);
        if (error) throw new Error(error);
      };

      await retryWithBackoff(checkOutOperation);
      setActiveCheckIn(null);
      toast({ title: 'Salida Registrada', description: 'Has registrado tu salida exitosamente.' });
      fetchHistory();
      return true;
    } catch (err) {
      console.error('❌ [useCheckInCheckOut] Create check-out error:', err);
      toast({ variant: 'destructive', title: 'Error', description: err.message });
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  return {
    activeCheckIn,
    history,
    totalHistoryCount,
    loading,
    loadingHistory,
    actionLoading,
    createCheckIn,
    createCheckOut,
    fetchHistory,
    fetchActiveCheckIn
  };
}
