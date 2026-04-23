
import { useState, useEffect, useCallback } from 'react';
import { supabaseClient } from '@/config/supabaseConfig';
import { retryWithBackoff } from '@/lib/supabaseValidator';
import { useSupabaseConnection } from '@/hooks/useSupabaseConnection';

export function useClinicMapData() {
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isConnected } = useSupabaseConnection();

  const fetchClinics = useCallback(async () => {
    if (!isConnected) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const fetchOperation = async () => {
        const { data, error: fetchError } = await supabaseClient
          .from('clinics')
          .select('id, name, address_street, address_city, address_sector, latitude, longitude, price_per_hour, number_of_cubicles')
          .eq('status', 'published');

        if (fetchError) throw fetchError;
        
        const validClinics = (data || []).filter(c => 
          c.latitude != null && c.longitude != null && !isNaN(c.latitude) && !isNaN(c.longitude)
        );
        
        return validClinics;
      };

      const data = await retryWithBackoff(fetchOperation);
      setClinics(data);
    } catch (err) {
      console.error("❌ [useClinicMapData] Fetch error:", err);
      setError(err.message || 'Error al cargar los datos del mapa');
    } finally {
      setLoading(false);
    }
  }, [isConnected]);

  useEffect(() => {
    fetchClinics();

    if (!isConnected) return;

    const channel = supabaseClient
      .channel('public:clinics')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clinics' }, () => {
        fetchClinics();
      })
      .subscribe();

    return () => {
      supabaseClient.removeChannel(channel);
    };
  }, [fetchClinics, isConnected]);

  return { clinics, loading, error, refetch: fetchClinics };
}
