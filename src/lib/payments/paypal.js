import { supabase } from '@/lib/customSupabaseClient';

export const processPayPalPayment = async (bookingDetails, payPalOrderDetails) => {
  const {
    clinicId,
    userId,
    startTime,
    endTime,
    totalPrice,
    clinicName,
  } = bookingDetails;

  const {
    orderId,
    payerId,
    payerEmail,
    payerName,
    amount,
    currency,
  } = payPalOrderDetails;

  try {
    const { data: bookingId, error } = await supabase.rpc('create_paypal_booking', {
      p_clinic_id: clinicId,
      p_user_id: userId,
      p_start_time: startTime,
      p_end_time: endTime,
      p_total_price: totalPrice,
      p_clinic_name: clinicName,
      p_gateway_transaction_id: orderId,
      p_payment_details: {
        payerId,
        payerEmail,
        payerName,
        amount,
        currency,
      }
    });

    if (error) {
      console.error('Error in create_paypal_booking RPC:', error);
      throw new Error(`No se pudo procesar la reserva después del pago: ${error.message}`);
    }

    return { bookingId, status: 'confirmed' };

  } catch (error) {
    console.error('Client-side error calling RPC for PayPal:', error);
    throw new Error(error.message || 'Ocurrió un error inesperado al crear la reserva con PayPal.');
  }
};