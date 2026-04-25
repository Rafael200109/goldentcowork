import { supabaseClient } from '@/config/supabaseConfig';

// Helper function to validate RPC function exists
const validateRpcFunction = async (functionName) => {
  try {
    // Try to call the function with invalid parameters to check if it exists
    // This is a lightweight way to validate without executing the function
    const { error } = await supabaseClient.rpc(functionName, {});
    // If we get a function not found error, the RPC doesn't exist
    if (error && error.message.includes('function') && error.message.includes('does not exist')) {
      throw new Error(`RPC function '${functionName}' does not exist in database`);
    }
    return true;
  } catch (error) {
    if (error.message.includes('does not exist')) {
      throw error;
    }
    // Other errors (like parameter validation) are expected and mean the function exists
    return true;
  }
};

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
    // Validate RPC function exists before calling
    await validateRpcFunction('create_paypal_booking');

    const { data: bookingId, error } = await supabaseClient.rpc('create_paypal_booking', {
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