import imageCompression from 'browser-image-compression';

/**
 * Optimiza y comprime una imagen con configuraciones agresivas
 * para mejorar el rendimiento. Convierte a WebP por defecto.
 */
export const compressImage = async (file, options = {}) => {
  const defaultOptions = {
    maxSizeMB: 0.3, // Maximum compression (300KB)
    maxWidthOrHeight: 1200, 
    useWebWorker: true,
    fileType: 'image/webp', // Forzar conversión a WebP
    initialQuality: 0.6, // Calidad 60% agresiva sin mucha pérdida visual
    ...options
  };

  try {
    const compressedFile = await imageCompression(file, defaultOptions);
    return compressedFile;
  } catch (error) {
    console.error('Error in compressImage:', error);
    return file; // Retorna original si falla
  }
};

/**
 * Construye URL optimizada.
 * FIX: Preserva las URLs de Supabase para evitar corromperlas si
 * la transformación de imágenes no está habilitada en el proyecto.
 */
export const getOptimizedUrl = (url, options = {}) => {
  if (!url) return url;
  
  // Preservar la URL original de Supabase sin modificaciones para evitar que se rompa (Error 400 o ignorado)
  if (url.includes('supabase.co')) {
    return url;
  }
  
  const params = new URLSearchParams();
  const targetQuality = options.quality || 60; // 60 por defecto
  
  if (options.width) params.append('width', options.width);
  if (options.height) params.append('height', options.height);
  params.append('quality', targetQuality);
  params.append('resize', options.resize || 'cover');
  params.append('format', 'webp'); // Forzar WebP

  return `${url}?${params.toString()}`;
};

/**
 * Genera SRCSET para múltiples resoluciones.
 * FIX: Desactiva el SRCSET para Supabase para asegurar que se cargue la imagen original.
 */
export const generateSrcSet = (url) => {
  if (!url) return undefined;
  
  // Si es Supabase, no generamos srcset para evitar solicitudes transformadas fallidas
  if (url.includes('supabase.co')) {
    return undefined;
  }

  return `
    ${getOptimizedUrl(url, { width: 300 })} 300w,
    ${getOptimizedUrl(url, { width: 600 })} 600w,
    ${getOptimizedUrl(url, { width: 1200 })} 1200w,
    ${getOptimizedUrl(url, { width: 1920 })} 1920w
  `;
};

/**
 * Generates responsive sizes (thumbnails, mobile, tablet, desktop)
 * @param {File} file - The original image file
 * @returns {Promise<Object>} - Object containing blobs for different sizes
 */
export const generateResponsiveSizes = async (file) => {
  const sizes = {
    thumbnail: { maxWidthOrHeight: 300, maxSizeMB: 0.05 },
    mobile: { maxWidthOrHeight: 600, maxSizeMB: 0.1 },
    tablet: { maxWidthOrHeight: 1200, maxSizeMB: 0.25 },
    desktop: { maxWidthOrHeight: 1920, maxSizeMB: 0.4 },
  };

  const results = {};
  
  try {
    for (const [key, options] of Object.entries(sizes)) {
      results[key] = await compressImage(file, {
        ...options,
        useWebWorker: true,
        fileType: 'image/webp'
      });
    }
    // Include original but forcefully compressed as webp
    results.original = await compressImage(file, {
        maxWidthOrHeight: 1920,
        maxSizeMB: 0.5,
        useWebWorker: true,
        fileType: 'image/webp'
    });
  } catch (error) {
    console.error('Error generating responsive sizes:', error);
  }

  return results;
};