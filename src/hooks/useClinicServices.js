
import { useState, useEffect, useCallback } from 'react';
import { supabaseClient } from '@/config/supabaseConfig';
import { retryWithBackoff } from '@/lib/supabaseValidator';
import { useSupabaseConnection } from '@/hooks/useSupabaseConnection';

export const useClinicServices = (clinicId = null) => {
  const [services, setServices] = useState({ dentalServices: [], amenities: [] });
  const [clinicServices, setClinicServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isConnected } = useSupabaseConnection();

  const fetchServices = useCallback(async () => {
    if (!isConnected) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const fetchOperation = async () => {
        // Fetch master services
        const { data: masterServices, error: masterError } = await supabaseClient
          .from('services')
          .select('*')
          .order('name');

        if (masterError) {
          if (masterError.code === '42501') {
            throw new Error('Error de permisos al cargar el catálogo de servicios.');
          }
          throw masterError;
        }

        const dentalServices = masterServices.filter(s => s.category === 'dental_services');
        const amenities = masterServices.filter(s => s.category === 'amenities');

        const result = { dentalServices, amenities, clinicServices: [] };

        // Fetch clinic-specific services if needed
        if (clinicId) {
          const { data: cServices, error: cError } = await supabaseClient
            .from('clinic_services')
            .select('*')
            .eq('clinic_id', clinicId);
          
          if (cError) {
            if (cError.code === '42501') {
              throw new Error('No tienes permisos (RLS) para ver o modificar los servicios de esta clínica.');
            }
            throw cError;
          }
          result.clinicServices = cServices || [];
        }

        return result;
      };

      const data = await retryWithBackoff(fetchOperation);
      setServices({ dentalServices: data.dentalServices, amenities: data.amenities });
      setClinicServices(data.clinicServices);

    } catch (err) {
      console.error('❌ [useClinicServices] Fetch error:', err);
      setError(err.message || 'Ocurrió un error al procesar la solicitud.');
    } finally {
      setLoading(false);
    }
  }, [clinicId, isConnected]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  return { ...services, clinicServices, loading, error, refetch: fetchServices };
};
