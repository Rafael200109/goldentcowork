/**
 * Generates a professionally formatted WhatsApp message for reservations.
 * 
 * @param {string} clinicName - The name of the clinic.
 * @param {string} reservationId - The unique reservation identifier.
 * @param {Date} reservationDate - The date of the reservation.
 * @param {number} duration - The duration in hours.
 * @param {number} totalPrice - The total price in DOP.
 * @returns {string} Formatted message.
 */
export const generateWhatsAppMessage = (clinicName, reservationId, reservationDate, duration, totalPrice) => {
  if (!clinicName || typeof clinicName !== 'string') {
    throw new Error("El nombre de la clínica es requerido y debe ser texto.");
  }
  if (!reservationId) {
    throw new Error("El ID de la reserva es requerido.");
  }
  if (!(reservationDate instanceof Date) || isNaN(reservationDate.getTime())) {
    throw new Error("La fecha de reserva debe ser un objeto Date válido.");
  }
  if (typeof duration !== 'number' || duration <= 0) {
    throw new Error("La duración debe ser un número positivo mayor a 0.");
  }
  if (typeof totalPrice !== 'number' || totalPrice <= 0) {
    throw new Error("El precio total debe ser un número positivo mayor a 0.");
  }

  const dateStr = reservationDate.toLocaleDateString('es-DO', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `👋 Hola! Me gustaría confirmar el pago de mi reserva en Goldent Co Work.

🏥 Clínica: *${clinicName}*
📋 ID de Reserva: *${reservationId}*
📅 Fecha: *${dateStr}*
⏱️ Duración: *${duration} horas*
💰 Total a Pagar: *RD$${totalPrice.toLocaleString('es-DO')}*

✅ Por favor, indíquenme los pasos a seguir para completar el pago vía Cardnet. Gracias! ✨`;
};

/**
 * Encodes the given message and redirects the user to WhatsApp instantly.
 * 
 * @param {string} message - The unencoded message text.
 */
export const redirectToWhatsApp = (message) => {
  if (!message || typeof message !== 'string') {
    throw new Error("El mensaje no puede estar vacío.");
  }

  const encodedMessage = encodeURIComponent(message);
  const phoneNumber = "18495815525";
  
  // Using api.whatsapp.com ensures proper routing on both mobile apps and WhatsApp Web
  const whatsappUrl = `https://api.whatsapp.com/send?phone=${phoneNumber}&text=${encodedMessage}`;
  
  // Use window.open without any delays as requested
  const newWindow = window.open(whatsappUrl, '_blank');
  
  // Fallback to location.href if the browser's popup blocker prevented window.open from working
  if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
    window.location.href = whatsappUrl;
  }
};