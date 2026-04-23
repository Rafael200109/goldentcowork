import { supabase } from '@/lib/customSupabaseClient';
import imageCompression from 'browser-image-compression';
import { generatePhotoFileName, validatePhotoFile } from './photoValidation';

export const compressImage = async (file) => {
  const options = {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    fileType: 'image/webp',
    initialQuality: 0.8
  };
  
  try {
    return await imageCompression(file, options);
  } catch (error) {
    console.error('Error compressing image:', error);
    throw new Error('No se pudo comprimir la imagen.');
  }
};

export const uploadOptimizedImage = async (file, bucket, path, onProgress) => {
  try {
    if (onProgress) onProgress(10);
    
    const validation = validatePhotoFile(file);
    if (!validation.valid) throw new Error(validation.error);

    if (onProgress) onProgress(30);
    const compressedFile = await compressImage(file);
    
    if (onProgress) onProgress(60);

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, compressedFile, {
        cacheControl: '31536000',
        upsert: true,
        contentType: 'image/webp'
      });

    if (uploadError) throw uploadError;
    if (onProgress) onProgress(90);

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    if (onProgress) onProgress(100);

    return {
      url: publicUrl,
      originalName: file.name,
      size: compressedFile.size
    };

  } catch (error) {
    console.error('Upload failed:', error);
    throw error;
  }
};

export const deleteImageFromStorage = async (bucket, photoUrl) => {
  try {
    const urlObj = new URL(photoUrl);
    const pathParts = urlObj.pathname.split('/');
    const bucketIndex = pathParts.indexOf(bucket);
    
    if (bucketIndex !== -1) {
      const filePath = pathParts.slice(bucketIndex + 1).join('/');
      const { error } = await supabase.storage.from(bucket).remove([filePath]);
      if (error) throw error;
      return { success: true };
    }
    return { success: false, error: 'URL malformada' };
  } catch (error) {
    console.error('Delete from storage failed:', error);
    throw error;
  }
};

export const replaceImage = async (oldPhotoUrl, newFile, bucket, clinicId) => {
  try {
    const newPath = generatePhotoFileName(clinicId, newFile.name);
    const newUpload = await uploadOptimizedImage(newFile, bucket, newPath);
    
    if (oldPhotoUrl) {
      await deleteImageFromStorage(bucket, oldPhotoUrl).catch(e => console.warn('Could not delete old image', e));
    }
    
    return newUpload;
  } catch (error) {
    console.error('Replace failed:', error);
    throw error;
  }
};