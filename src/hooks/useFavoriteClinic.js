
import { useState, useEffect, useCallback } from 'react';
import { supabaseClient } from '@/config/supabaseConfig';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { retryWithBackoff } from '@/lib/supabaseValidator';
import { useSupabaseConnection } from '@/hooks/useSupabaseConnection';

// Simple event bus for syncing across components
const favoriteEventTarget = new EventTarget();

export const useFavoriteClinic = (clinicId = null) => {
  const { user } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [favoriteCount, setFavoriteCount] = useState(0);
  const { isConnected } = useSupabaseConnection();

  const fetchStatus = useCallback(async () => {
    if (!user || !isConnected) {
      setIsFavorite(false);
      setFavoriteCount(0);
      return;
    }

    setLoading(true);
    try {
      const fetchOperation = async () => {
        const results = {};

        // Check if clinic is favorite
        if (clinicId) {
          const { data, error } = await supabaseClient
            .from('favorite_clinics')
            .select('id')
            .eq('user_id', user.id)
            .eq('clinic_id', clinicId)
            .maybeSingle();

          if (error) throw error;
          results.isFavorite = !!data;
        }

        // Get count
        const { count, error: countError } = await supabaseClient
          .from('favorite_clinics')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id);

        if (countError) throw countError;
        results.count = count || 0;

        return results;
      };

      const results = await retryWithBackoff(fetchOperation);
      
      if (clinicId) {
        setIsFavorite(results.isFavorite);
      }
      setFavoriteCount(results.count);

    } catch (err) {
      console.error('❌ [useFavoriteClinic] Fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user, clinicId, isConnected]);

  useEffect(() => {
    fetchStatus();

    const handleUpdate = () => fetchStatus();
    favoriteEventTarget.addEventListener('favorite_updated', handleUpdate);

    return () => {
      favoriteEventTarget.removeEventListener('favorite_updated', handleUpdate);
    };
  }, [fetchStatus]);

  const toggleFavorite = async () => {
    if (!user || !clinicId || !isConnected) return false;

    setLoading(true);
    const previousState = isFavorite;
    setIsFavorite(!isFavorite);
    setFavoriteCount(prev => isFavorite ? prev - 1 : prev + 1);

    try {
      const toggleOperation = async () => {
        if (previousState) {
          const { error } = await supabaseClient
            .from('favorite_clinics')
            .delete()
            .eq('user_id', user.id)
            .eq('clinic_id', clinicId);
          
          if (error) throw error;
        } else {
          // Use upsert to handle duplicates gracefully
          const { error } = await supabaseClient
            .from('favorite_clinics')
            .upsert([{ user_id: user.id, clinic_id: clinicId }], { onConflict: 'user_id,clinic_id' });
          
          if (error) {
            // If upsert fails, check if it's already favorited
            if (error.code === '23505') {
              setIsFavorite(true);
              return;
            }
            throw error;
          }
        }
      };

      await retryWithBackoff(toggleOperation);
      favoriteEventTarget.dispatchEvent(new Event('favorite_updated'));
      return true;

    } catch (err) {
      console.error('❌ [useFavoriteClinic] Toggle error:', err);
      setError(err.message);
      setIsFavorite(previousState);
      setFavoriteCount(prev => previousState ? prev + 1 : prev - 1);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    isFavorite,
    toggleFavorite,
    loading,
    error,
    favoriteCount
  };
};
