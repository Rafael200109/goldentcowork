import { useState } from 'react';
import { supabaseClient } from '@/config/supabaseConfig';
import { useToast } from '@/components/ui/use-toast';
import { handleSupabaseError } from '@/lib/utils';

export const useBookingChatAttachments = (bookingId) => {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const uploadFile = async (file, folder = 'general') => {
    if (!file) return null;
    
    // Basic validation
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast({
        variant: "destructive",
        title: "Archivo muy grande",
        description: "El tamaño máximo permitido es 10MB.",
      });
      return null;
    }

    setUploading(true);
    setProgress(0);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${bookingId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { data, error } = await supabaseClient.storage
        .from('booking_chat_attachments')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabaseClient.storage
        .from('booking_chat_attachments')
        .getPublicUrl(filePath);

      return {
        url: publicUrl,
        name: file.name,
        size: file.size,
        type: file.type
      };

    } catch (error) {
      handleSupabaseError(error, "Error subiendo archivo");
      return null;
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return {
    uploadFile,
    uploading,
    progress
  };
};