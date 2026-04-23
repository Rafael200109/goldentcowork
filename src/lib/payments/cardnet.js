import { supabase } from '@/lib/customSupabaseClient';

export const processCardnetPayment = async (bookingDetails) => {
  const {
    clinicId,
    userId,
    startTime,
    endTime,
    totalPrice,
    clinicName,
  } = bookingDetails;

  let safeStartTime = startTime;
  let safeEndTime = endTime;

  if (typeof startTime === 'string') safeStartTime = new Date(startTime);
  if (typeof endTime === 'string') safeEndTime = new Date(endTime);

  if (!(safeStartTime instanceof Date) || !(safeEndTime instanceof Date) || isNaN(safeStartTime) || isNaN(safeEndTime)) {
    console.error('Invalid date objects received for Cardnet payment:', { startTime, endTime });
    throw new Error('Las fechas de la reserva no son válidas. No se pudo procesar el pago.');
  }

  try {
    const { data: bookingId, error } = await supabase.rpc('create_pending_booking_and_transaction', {
      p_clinic_id: clinicId,
      p_user_id: userId,
      p_start_time: safeStartTime.toISOString(),
      p_end_time: safeEndTime.toISOString(),
      p_total_price: totalPrice,
      p_clinic_name: clinicName,
    });

    if (error) {
      console.error('Error in create_pending_booking_and_transaction RPC:', error);
      throw new Error(`No se pudo procesar la reserva: ${error.message}`);
    }

    return { bookingId, status: 'pending' };

  } catch (error) {
    console.error('Client-side error calling RPC:', error);
    throw new Error(error.message || 'Ocurrió un error inesperado al crear la reserva.');
  }
};