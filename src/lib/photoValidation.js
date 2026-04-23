import { sanitizeFileName } from './fileUtils';

export const PHOTO_LIMITS = {
  MAX_SIZE_MB: 5,
  MAX_SIZE_BYTES: 5 * 1024 * 1024,
  MIN_PHOTOS: 5,
  MAX_PHOTOS: 20,
  VALID_TYPES: ['image/jpeg', 'image/png', 'image/webp']
};

export const validatePhotoFile = (file) => {
  if (!file) return { valid: false, error: 'No se proporcionó ningún archivo.' };
  
  if (!PHOTO_LIMITS.VALID_TYPES.includes(file.type)) {
    return { valid: false, error: 'Formato no válido. Usa JPG, PNG o WebP.' };
  }
  
  if (file.size > PHOTO_LIMITS.MAX_SIZE_BYTES) {
    return { valid: false, error: `La imagen supera los ${PHOTO_LIMITS.MAX_SIZE_MB}MB permitidos.` };
  }
  
  return { valid: true };
};

export const validatePhotoCount = (currentCount, filesToAdd = 1) => {
  if (currentCount + filesToAdd > PHOTO_LIMITS.MAX_PHOTOS) {
    return { 
      valid: false, 
      error: `No puedes subir más de ${PHOTO_LIMITS.MAX_PHOTOS} fotos en total.`,
      limit: PHOTO_LIMITS.MAX_PHOTOS
    };
  }
  return { valid: true };
};

export const generatePhotoFileName = (clinicId, originalName) => {
  const sanitized = sanitizeFileName(originalName);
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `${clinicId}/${timestamp}_${randomStr}_${sanitized}`;
};