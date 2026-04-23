import React, { useState, useCallback, useRef } from 'react';
import { usePublishClinic } from '@/contexts/PublishClinicContext.jsx';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ImagePlus, Trash2, UploadCloud, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { uploadOptimizedImage } from '@/lib/imageUploadHandler';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { sanitizeFileName } from '@/lib/fileUtils';

const MIN_PHOTOS = 5;

const ImageUploader = () => {
  const { clinicData, updateClinicData } = usePublishClinic();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  const processFiles = useCallback(async (files) => {
    const fileList = Array.from(files);
    if (!fileList.length) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const validImages = fileList.filter(file => validTypes.includes(file.type));
    
    if (validImages.length !== fileList.length) {
      toast({
        title: "Formatos no válidos",
        description: "Solo se aceptan formatos JPG, JPEG, PNG y WebP.",
        variant: "destructive"
      });
    }

    if (validImages.length === 0) return;

    const currentPhotos = clinicData.photos || [];

    setUploading(true);
    setUploadProgress(0);

    try {
      const newPhotos = [];
      let processedCount = 0;
      const totalCount = validImages.length;

      for (const file of validImages) {
        const sanitizedName = sanitizeFileName(file.name);
        const fileName = `${Date.now()}_${sanitizedName}`;
        const path = `${user.id}/${fileName}`;

        const result = await uploadOptimizedImage(
          file, 
          'clinic_photos',
          path, 
          (progress) => {
             const baseProgress = (processedCount / totalCount) * 100;
             const currentItemContribution = (progress / totalCount);
             setUploadProgress(Math.round(baseProgress + currentItemContribution));
          }
        );

        newPhotos.push({
          file,
          url: result.url,
          thumbnailUrl: result.thumbnail,
          id: result.url,
          meta: result
        });

        processedCount++;
      }
      
      updateClinicData({ photos: [...currentPhotos, ...newPhotos] });
      toast({
          title: "Fotos subidas",
          description: `Se han procesado ${newPhotos.length} fotos exitosamente.`,
      });

    } catch (error) {
      console.error("Upload error", error);
      toast({
        title: "Error al subir",
        description: "Hubo un problema al procesar las imágenes.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }

  }, [clinicData.photos, updateClinicData, toast, user]);

  const handleFileChange = (event) => {
    processFiles(event.target.files);
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    processFiles(e.dataTransfer.files);
  };
  
  const onPhotoRemove = (photoId) => {
    const updatedPhotos = (clinicData.photos || []).filter(p => p.id !== photoId);
    updateClinicData({ photos: updatedPhotos });
    toast({ title: 'Foto eliminada', description: 'La foto ha sido quitada de la selección.' });
  };

  const uploadedPhotos = clinicData.photos || [];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-2">
         <Label>Fotos de la Clínica</Label>
         <span className="text-xs text-muted-foreground">Formatos: JPG, PNG, WebP</span>
      </div>

      {uploading && (
        <div className="w-full bg-muted rounded-full h-2.5 mb-4 overflow-hidden">
            <div className="bg-primary h-2.5 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
            <p className="text-xs text-center mt-1 text-muted-foreground">Optimizando y subiendo... {uploadProgress}%</p>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        <AnimatePresence>
          {uploadedPhotos.map((photo, index) => (
            <motion.div
              key={photo.id}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="relative aspect-square rounded-lg overflow-hidden border border-muted group shadow-sm bg-muted"
            >
              <img 
                src={photo.thumbnailUrl || photo.url}
                alt={`Foto ${index + 1}`} 
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                 <Button
                  variant="destructive"
                  size="icon"
                  className="h-8 w-8 rounded-full"
                  onClick={(e) => {
                    e.preventDefault();
                    onPhotoRemove(photo.id);
                  }}
                  disabled={uploading}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              {index === 0 && (
                <div className="absolute bottom-0 left-0 right-0 bg-primary/90 text-primary-foreground text-[10px] py-1 text-center font-medium">
                  Portada
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        
        {/* Siempre permitimos subir más fotos */}
        {!uploading && (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              "aspect-square relative rounded-lg border-2 border-dashed transition-all duration-200 flex flex-col items-center justify-center cursor-pointer group",
              isDragging 
                ? "border-primary bg-primary/10 scale-95" 
                : "border-muted-foreground/25 hover:border-primary hover:bg-muted/50"
            )}
          >
            <Input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              ref={fileInputRef}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              multiple
              disabled={uploading}
            />
            <div className="flex flex-col items-center justify-center text-center p-2 pointer-events-none">
                <div className={cn(
                    "p-3 rounded-full bg-muted mb-2 transition-colors group-hover:bg-primary/10",
                    isDragging && "bg-primary/20"
                )}>
                    {isDragging ? (
                        <UploadCloud className="w-6 h-6 text-primary animate-bounce" />
                    ) : (
                        <ImagePlus className="w-6 h-6 text-muted-foreground group-hover:text-primary" />
                    )}
                </div>
                <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground">
                    {isDragging ? 'Suelta aquí' : 'Subir fotos'}
                </span>
                <span className="text-[10px] text-muted-foreground/60 mt-1">
                    {uploadedPhotos.length} fotos
                </span>
            </div>
          </div>
        )}
      </div>
      
      {uploadedPhotos.length < MIN_PHOTOS ? (
         <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md">
            <X className="w-4 h-4" />
            <span className="font-medium">Sugerimos agregar al menos {MIN_PHOTOS - uploadedPhotos.length} fotos más.</span>
         </div>
      ) : (
         <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 dark:bg-green-900/20 p-3 rounded-md">
            <Check className="w-4 h-4" />
            <span className="font-medium">¡Genial! Tienes una buena cantidad de fotos.</span>
         </div>
      )}
    </div>
  );
};

export default ImageUploader;