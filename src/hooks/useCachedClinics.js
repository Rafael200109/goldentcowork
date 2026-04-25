import { useState, useCallback } from 'react';
import { supabaseClient } from '@/config/supabaseConfig';
import { useCache } from './useCache';

export function useCachedClinics() {
  const { getCache, setCache } = useCache();
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchClinics = useCallback(async (forceRefresh = false) => {
    const CACHE_KEY = 'published_clinics';
    
    if (!forceRefresh) {
      const cached = getCache(CACHE_KEY);
      if (cached) {
        setClinics(cached);
        return;
      }
    }

    setLoading(true);
    try {
      const { data, error } = await supabaseClient
        .from('clinics')
        .select(`
          id, name, description, address_street, address_city, 
          address_province, address_sector, latitude, longitude, 
          price_per_hour, min_hours_booking, is_featured, featured_until,
          clinic_amenities ( amenities ( name ) ),
          clinic_photos ( photo_url, is_cover ),
          bookings:bookings!bookings_clinic_id_fkey ( start_time, end_time, status )
        `)
        .eq('status', 'published');

      if (error) throw error;
      
      setClinics(data || []);
      setCache(CACHE_KEY, data || [], 5); // 5 minutes TTL
    } catch (err) {
      setError(err);
      console.error('Error fetching clinics:', err);
    } finally {
      setLoading(false);
    }
  }, [getCache, setCache]);

  return { clinics, loading, error, fetchClinics };
}