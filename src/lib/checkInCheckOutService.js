import { supabase } from '@/lib/customSupabaseClient';

export const checkInCheckOutService = {
  async getActiveCheckInForHost(host_id) {
    try {
      const { data, error } = await supabase
        .from('clinic_checkins')
        .select(`
          *,
          clinic:clinics(id, name, address_street, address_city)
        `)
        .eq('host_id', host_id)
        .eq('status', 'checked_in')
        .maybeSingle();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching active check-in:', error);
      return { data: null, error: 'Error al obtener el registro de presencia actual.' };
    }
  },

  async createCheckInRecord(host_id, clinic_id, notes) {
    try {
      // Validate no active check-in exists (handled by DB unique index, but good to check)
      const { data: existing } = await this.getActiveCheckInForHost(host_id);
      if (existing) {
        return { data: null, error: 'Ya tienes un registro de llegada activo.' };
      }

      const { data, error } = await supabase
        .from('clinic_checkins')
        .insert([{
          host_id,
          clinic_id,
          check_in_notes: notes || null,
          status: 'checked_in',
          check_in_time: new Date().toISOString()
        }])
        .select(`*, clinic:clinics(id, name)`)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error creating check-in:', error);
      return { data: null, error: 'No se pudo registrar la llegada. Intenta de nuevo.' };
    }
  },

  async createCheckOutRecord(check_in_id, notes, check_in_time) {
    try {
      const checkOutTime = new Date();
      const checkInDate = new Date(check_in_time);
      const durationMinutes = Math.max(0, Math.floor((checkOutTime - checkInDate) / 60000));

      const { data, error } = await supabase
        .from('clinic_checkins')
        .update({
          check_out_time: checkOutTime.toISOString(),
          check_out_notes: notes || null,
          status: 'checked_out',
          duration_minutes: durationMinutes
        })
        .eq('id', check_in_id)
        .eq('status', 'checked_in')
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error creating check-out:', error);
      return { data: null, error: 'No se pudo registrar la salida. Intenta de nuevo.' };
    }
  },

  async getCheckInHistoryForHost(host_id, limit = 20, offset = 0) {
    try {
      const { data, error, count } = await supabase
        .from('clinic_checkins')
        .select(`
          *,
          clinic:clinics(id, name)
        `, { count: 'exact' })
        .eq('host_id', host_id)
        .order('check_in_time', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return { data, count, error: null };
    } catch (error) {
      console.error('Error fetching check-in history:', error);
      return { data: [], count: 0, error: 'Error al obtener el historial de presencia.' };
    }
  }
};