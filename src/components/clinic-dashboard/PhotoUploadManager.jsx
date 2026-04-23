import React, { useRef, useState } from 'react';
import { useClinicPhotos } from '@/hooks/useClinicPhotos';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, ImagePlus, Trash2, Star, GripVertical, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { PHOTO_LIMITS } from '@/lib/photoValidation';

const PhotoUploadManager = ({ clinicId, isAdmin = false }) => {
  const { photos, isLoading, uploading, uploadProgress, uploadPhoto, deletePhoto, setAsCover, reorderPhotos } = useClinicPhotos(clinicId);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      await uploadPhoto(e.target.files);
    }
    if (fileInputRef.current) fileInputRef.current.value = ''; 
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await uploadPhoto(e.dataTransfer.files);
    }
  };

  if (isLoading && photos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Cargando galería de fotos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
         <div>
             <Label className="text-lg">Fotos de la Clínica</Label>
             <p className="text-sm text-muted-foreground">Formatos aceptados: JPG, PNG, WebP (Máx {PHOTO_LIMITS.MAX_SIZE_MB}MB).</p>
         </div>
         <div className="text-sm font-medium">
             <span className={cn(photos.length < PHOTO_LIMITS.MIN_PHOTOS ? "text-amber-500" : "text-green-500")}>
                 {photos.length} / {PHOTO_LIMITS.MAX_PHOTOS} fotos
             </span>
         </div>
      </div>

      {uploading && (
        <div className="w-full bg-muted rounded-full h-3 mb-4 overflow-hidden border border-border/50">
            <motion.div 
                className="bg-primary h-full rounded-full transition-all" 
                initial={{ width: 0 }}
                animate={{ width: `${uploadProgress}%` }}
            />
            <p className="text-xs text-center mt-2 text-muted-foreground font-medium">Procesando y subiendo... {uploadProgress}%</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <AnimatePresence>
          {photos.map((photo, index) => (
            <motion.div
              key={photo.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={cn(
                "relative aspect-square rounded-xl overflow-hidden border group shadow-sm transition-all",
                photo.is_cover ? "border-primary border-2 ring-2 ring-primary/20" : "border-border hover:border-primary/50"
              )}
            >
              <img 
                src={photo.photo_url} 
                alt={`Foto ${index + 1}`} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
              />
              
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-3">
                 <div className="flex justify-between items-start">
                     {photo.is_cover ? (
                         <div className="bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-md flex items-center shadow-md">
                             <Star className="w-3 h-3 mr-1 fill-current" /> Portada
                         </div>
                     ) : (
                         <Button 
                             variant="secondary" 
                             size="sm" 
                             className="h-7 text-xs bg-white/90 hover:bg-white text-black"
                             onClick={(e) => { e.preventDefault(); setAsCover(photo.id); }}
                             disabled={uploading}
                         >
                             Hacer portada
                         </Button>
                     )}
                     <Button
                         variant="destructive"
                         size="icon"
                         className="h-8 w-8 rounded-full shadow-md"
                         onClick={(e) => { e.preventDefault(); deletePhoto(photo.id, photo.photo_url); }}
                         disabled={uploading}
                     >
                         <Trash2 className="w-4 h-4" />
                     </Button>
                 </div>

                 <div className="flex justify-center gap-2 mt-auto">
                    <Button
                        variant="secondary"
                        size="icon"
                        className="h-8 w-8 rounded-full bg-white/90 hover:bg-white text-black"
                        onClick={(e) => { e.preventDefault(); reorderPhotos(index, index - 1); }}
                        disabled={index === 0 || uploading}
                    >
                        <GripVertical className="w-4 h-4 rotate-90" />
                    </Button>
                    <Button
                        variant="secondary"
                        size="icon"
                        className="h-8 w-8 rounded-full bg-white/90 hover:bg-white text-black"
                        onClick={(e) => { e.preventDefault(); reorderPhotos(index, index + 1); }}
                        disabled={index === photos.length - 1 || uploading}
                    >
                        <GripVertical className="w-4 h-4 rotate-90" />
                    </Button>
                 </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {(!uploading && photos.length < PHOTO_LIMITS.MAX_PHOTOS) && (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              "aspect-square relative rounded-xl border-2 border-dashed transition-all duration-200 flex flex-col items-center justify-center cursor-pointer group bg-muted/30",
              isDragging ? "border-primary bg-primary/10 scale-[0.98]" : "border-border hover:border-primary hover:bg-primary/5"
            )}
          >
            <Input
              type="file"
              accept={PHOTO_LIMITS.VALID_TYPES.join(',')}
              onChange={handleFileChange}
              ref={fileInputRef}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              multiple
              disabled={uploading}
              title="Arrastra o haz clic para subir fotos"
            />
            <div className="flex flex-col items-center justify-center text-center p-4 pointer-events-none">
                <div className={cn(
                    "p-4 rounded-full mb-3 transition-colors duration-300",
                    isDragging ? "bg-primary text-primary-foreground shadow-lg" : "bg-background shadow-sm text-muted-foreground group-hover:text-primary group-hover:scale-110"
                )}>
                    <ImagePlus className="w-7 h-7" />
                </div>
                <span className="text-sm font-semibold text-foreground">
                    {isDragging ? 'Suelta para subir' : 'Añadir fotos'}
                </span>
                <span className="text-xs text-muted-foreground mt-1 px-2">
                    Arrastra o haz clic aquí
                </span>
            </div>
          </div>
        )}
      </div>

      <div className="pt-4">
          {photos.length < PHOTO_LIMITS.MIN_PHOTOS ? (
             <div className="flex items-start gap-3 text-sm text-amber-700 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400 p-4 rounded-lg border border-amber-200 dark:border-amber-900/50">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                    <p className="font-semibold mb-1">Acción requerida</p>
                    <p>Necesitas subir al menos {PHOTO_LIMITS.MIN_PHOTOS} fotos para que tu clínica sea visible. Faltan {PHOTO_LIMITS.MIN_PHOTOS - photos.length}.</p>
                </div>
             </div>
          ) : (
             <div className="flex items-center gap-3 text-sm text-green-700 bg-green-50 dark:bg-green-950/30 dark:text-green-400 p-4 rounded-lg border border-green-200 dark:border-green-900/50">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                <span className="font-medium">¡Excelente! Tu galería cumple con los requisitos mínimos.</span>
             </div>
          )}
      </div>
    </div>
  );
};

export default PhotoUploadManager;