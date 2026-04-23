export const validateCheckInData = (clinic_id, notes) => {
  if (!clinic_id) {
    return { valid: false, error: 'Debe seleccionar una clínica para registrar la llegada.' };
  }
  
  if (notes && notes.length > 500) {
    return { valid: false, error: 'Las notas de llegada no pueden exceder los 500 caracteres.' };
  }
  
  return { valid: true };
};

export const validateCheckOutData = (check_in_id, notes) => {
  if (!check_in_id) {
    return { valid: false, error: 'Identificador de registro no encontrado.' };
  }
  
  if (notes && notes.length > 500) {
    return { valid: false, error: 'Las notas de salida no pueden exceder los 500 caracteres.' };
  }
  
  return { valid: true };
};

export const validateClinicOwnership = (host_id, clinic_id) => {
  if (!host_id || !clinic_id) {
    return { valid: false, error: 'Datos insuficientes para validar la clínica.' };
  }
  
  return { valid: true };
};