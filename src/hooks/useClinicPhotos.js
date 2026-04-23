
import { useState, useCallback, useEffect } from 'react';
import { supabaseClient } from '@/config/supabaseConfig';
import { useToast } from '@/components/ui/use-toast';
import { uploadOptimizedImage, deleteImageFromStorage } from '@/lib/imageUploadHandler';
import { validatePhotoFile, validatePhotoCount, generatePhotoFileName } from '@/lib/photoValidation';
import { retryWithBackoff } from '@/lib/supabaseValidator';
import { useSupabaseConnection } from '@/hooks/useSupabaseConnection';

export const useClinicPhotos = (clinicId) => {
  const [photos, setPhotos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const { toast } = useToast();
  const { isConnected } = useSupabaseConnection();

  // Fetch photos with retry logic
  const fetchPhotos = useCallback(async () => {
    if (!clinicId || !isConnected) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const fetchOperation = async () => {
        const { data, error } = await supabaseClient
          .from('clinic_photos')
          .select('*')
          .eq('clinic_id', clinicId)
          .order('display_order', { ascending: true });

        if (error) throw error;
        return data;
      };

      const data = await retryWithBackoff(fetchOperation);
      setPhotos(data || []);
    } catch (err) {
      console.error('❌ [useClinicPhotos] Fetch error:', err);
      setError(err.message);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudieron cargar las fotos. Por favor, intenta nuevamente.'
      });
    } finally {
      setIsLoading(false);
    }
  }, [clinicId, isConnected, toast]);

  useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos]);

  // Update photos order with error handling
  const updatePhotosOrder = async (clinicId, reorderedPhotos) => {
    if (!isConnected) {
      throw new Error('No hay conexión con Supabase');
    }

    try {
      const updates = reorderedPhotos.map((photo, index) => ({
        id: photo.id,
        display_order: index,
        is_cover: index === 0
      }));

      const updateOperation = async () => {
        const updatePromises = updates.map(u =>
          supabaseClient
            .from('clinic_photos')
            .update({
              display_order: u.display_order,
              is_cover: u.is_cover
            })
            .eq('id', u.id)
        );

        await Promise.all(updatePromises);

        const { data, error } = await supabaseClient
          .from('clinic_photos')
          .select('*')
          .eq('clinic_id', clinicId)
          .order('display_order', { ascending: true });

        if (error) throw error;
        return data;
      };

      const data = await retryWithBackoff(updateOperation);
      setPhotos(data || []);
      return data;

    } catch (err) {
      console.error("❌ [useClinicPhotos] Error saving photo order:", err);
      throw err;
    }
  };

  // Delete photo with error handling
  const deletePhoto = async (photoId, photoUrl) => {
    if (!isConnected) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No hay conexión con Supabase'
      });
      return;
    }

    const original = [...photos];
    setPhotos(prev => prev.filter(p => p.id !== photoId));

    try {
      const deleteOperation = async () => {
        const { error } = await supabaseClient
          .from('clinic_photos')
          .delete()
          .eq('id', photoId);

        if (error) throw error;
      };

      await retryWithBackoff(deleteOperation);
      await deleteImageFromStorage('clinic_photos', photoUrl).catch(() => {});
      await updatePhotosOrder(clinicId, photos.filter(p => p.id !== photoId));

      toast({
        title: 'Foto eliminada',
        description: 'Se eliminó correctamente'
      });

    } catch (err) {
      console.error('❌ [useClinicPhotos] Delete error:', err);
      setPhotos(original);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo eliminar la foto'
      });
    }
  };

  // Upload photo with error handling
  const uploadPhoto = async (files) => {
    if (!isConnected) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No hay conexión con Supabase'
      });
      return;
    }

    const fileList = Array.from(files);
    if (!fileList.length) return;

    const validation = validatePhotoCount(photos.length, fileList.length);
    if (!validation.valid) {
      toast({
        variant: "destructive",
        title: "Límite excedido",
        description: validation.error
      });
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const newPhotos = [];

      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];

        const valid = validatePhotoFile(file);
        if (!valid.valid) continue;

        const path = generatePhotoFileName(clinicId, file.name);
        const result = await uploadOptimizedImage(file, 'clinic_photos', path);

        newPhotos.push({
          clinic_id: clinicId,
          photo_url: result.url,
          display_order: photos.length + i
        });
      }

      if (newPhotos.length > 0) {
        const insertOperation = async () => {
          const { error } = await supabaseClient
            .from('clinic_photos')
            .insert(newPhotos);

          if (error) throw error;
        };

        await retryWithBackoff(insertOperation);
        await fetchPhotos();

        toast({
          title: 'Éxito',
          description: 'Fotos subidas correctamente.'
        });
      }

    } catch (err) {
      console.error('❌ [useClinicPhotos] Upload error:', err);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Error subiendo fotos'
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return {
    photos,
    isLoading,
    uploading,
    uploadProgress,
    uploadPhoto,
    deletePhoto,
    updatePhotosOrder,
    error
  };
};
