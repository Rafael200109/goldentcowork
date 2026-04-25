import { supabaseClient } from '@/config/supabaseConfig';

/**
 * Servicio para enviar correos transaccionales a través de Supabase Edge Functions
 */
export const emailService = {
  
  /**
   * Envía un correo de bienvenida
   * @param {string} email - Email del destinatario
   * @param {string} name - Nombre del usuario
   */
  sendWelcome: async (email, name) => {
    return await sendEmailRequest('welcome', email, { name });
  },

  /**
   * Notifica al dentista que su reserva está confirmada
   * @param {string} email - Email del dentista
   * @param {object} bookingData - Datos de la reserva (clinicName, date, etc.)
   */
  sendBookingConfirmation: async (email, bookingData) => {
    return await sendEmailRequest('booking_confirmed', email, bookingData);
  },

  /**
   * Notifica al anfitrión de una nueva reserva
   * @param {string} email - Email del anfitrión
   * @param {object} data - Datos de la reserva y ganancia
   */
  sendHostNotification: async (email, data) => {
    return await sendEmailRequest('booking_notification_host', email, data);
  },

  /**
   * Envía comprobante de pago
   * @param {string} email - Email del usuario
   * @param {object} paymentData - (amount, concept, transactionId)
   */
  sendPaymentReceipt: async (email, paymentData) => {
    return await sendEmailRequest('payment_success', email, paymentData);
  },

  /**
   * Alerta de fallo en pago
   * @param {string} email 
   * @param {string} userName 
   * @param {string} message 
   */
  sendPaymentAlert: async (email, userName, message) => {
    return await sendEmailRequest('payment_alert', email, { userName, message });
  },

  /**
   * Alerta genérica del sistema
   */
  sendSystemAlert: async (email, subject, message, details = null) => {
    return await sendEmailRequest('general_alert', email, { subject, message, details });
  }
};

// Función helper privada
async function sendEmailRequest(templateName, toEmail, data) {
  try {
    const { data: responseData, error } = await supabaseClient.functions.invoke('send-email', {
      body: {
        template_name: templateName,
        to_email: toEmail,
        data: data
      }
    });

    if (error) {
      console.error(`Error sending email (${templateName}):`, error);
      return { success: false, error };
    }

    return { success: true, data: responseData };
  } catch (err) {
    console.error(`Exception sending email (${templateName}):`, err);
    return { success: false, error: err };
  }
}