
import { useState, useCallback } from 'react';
import { supabaseClient } from '@/config/supabaseConfig';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { retryWithBackoff } from '@/lib/supabaseValidator';
import { useSupabaseConnection } from '@/hooks/useSupabaseConnection';

export function useHostBankAccount() {
  const { user } = useAuth();
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { isConnected } = useSupabaseConnection();

  const fetchAccount = useCallback(async () => {
    if (!user || !isConnected) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const fetchOperation = async () => {
        const { data, error: fetchError } = await supabaseClient
          .from('host_payout_accounts')
          .select('*')
          .eq('host_id', user.id)
          .maybeSingle();

        if (fetchError) throw fetchError;
        return data || null;
      };

      const data = await retryWithBackoff(fetchOperation);
      setAccount(data);
    } catch (err) {
      console.error('❌ [useHostBankAccount] Fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user, isConnected]);

  const saveAccount = useCallback(async (accountData) => {
    if (!user || !isConnected) {
      throw new Error('Usuario no autenticado o sin conexión');
    }

    setLoading(true);
    setError(null);
    
    try {
      const saveOperation = async () => {
        const { data: existing } = await supabaseClient
          .from('host_payout_accounts')
          .select('id')
          .eq('host_id', user.id)
          .maybeSingle();

        const payload = {
          host_id: user.id,
          bank_name: accountData.bank_name,
          account_holder_name: accountData.account_holder_name,
          account_number: accountData.account_number,
          account_type: accountData.account_type,
          document_type: accountData.document_type || null,
          document_number: accountData.document_number || null,
          updated_at: new Date().toISOString()
        };

        if (existing) {
          const { error: updateError } = await supabaseClient
            .from('host_payout_accounts')
            .update(payload)
            .eq('id', existing.id);
          if (updateError) throw updateError;
        } else {
          const { error: insertError } = await supabaseClient
            .from('host_payout_accounts')
            .insert([payload]);
          if (insertError) throw insertError;
        }
      };

      await retryWithBackoff(saveOperation);
      await fetchAccount();
      return true;
    } catch (err) {
      console.error('❌ [useHostBankAccount] Save error:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user, isConnected, fetchAccount]);

  const deleteAccount = useCallback(async () => {
    if (!user || !isConnected) return;
    
    setLoading(true);
    try {
      const deleteOperation = async () => {
        const { error: deleteError } = await supabaseClient
          .from('host_payout_accounts')
          .delete()
          .eq('host_id', user.id);
          
        if (deleteError) throw deleteError;
      };

      await retryWithBackoff(deleteOperation);
      setAccount(null);
      return true;
    } catch (err) {
      console.error('❌ [useHostBankAccount] Delete error:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user, isConnected]);

  return {
    account,
    loading,
    error,
    fetchAccount,
    saveAccount,
    deleteAccount
  };
}
