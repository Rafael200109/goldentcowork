import { compressImage } from './imageOptimizer';

/**
 * Optimizes an image specifically for chat:
 * - Compresses main image to max 500KB
 * - Generates a 200x200 thumbnail
 * @param {File} file 
 * @returns {Promise<{main: File, thumbnail: File}>}
 */
export const optimizeChatImage = async (file) => {
  // 1. Compress Main Image (max 500KB, maintain reasonable dimensions)
  const mainImage = await compressImage(file, {
    maxSizeMB: 0.5,
    maxWidthOrHeight: 1600,
    useWebWorker: true,
    fileType: 'image/webp'
  });

  // 2. Generate Thumbnail (max 50KB, 200px)
  const thumbnail = await compressImage(file, {
    maxSizeMB: 0.05,
    maxWidthOrHeight: 200,
    useWebWorker: true,
    fileType: 'image/webp'
  });

  return { main: mainImage, thumbnail };
};