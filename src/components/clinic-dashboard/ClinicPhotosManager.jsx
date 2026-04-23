import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useClinicPhotos } from '@/hooks/useClinicPhotos';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, ImagePlus, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { PHOTO_LIMITS } from '@/lib/photoValidation';
import PhotoItem from './PhotoItem';

const ClinicPhotosManager = ({ clinicId }) => {
  const { 
    photos, 
    isLoading, 
    uploading, 
    uploadProgress, 
    uploadPhoto, 
    deletePhoto, 
    updatePhotosOrder 
  } = useClinicPhotos(clinicId);
  
  const [items, setItems] = useState([]);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const fileInputRef = useRef(null);
  const pendingReorder = useRef(false);
  const { toast } = useToast();

  // Handle synchronization between hook state and local items state
  useEffect(() => {
    // Only update items if:
    // 1. Photos are available
    // 2. We are not actively saving an order
    // 3. There is no pending reorder operation (prevents overwriting optimistic UI)
    if (photos && !isSavingOrder && !pendingReorder.current) {
      const sortedPhotos = [...photos].sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
      
      // Compare current items with new photos to prevent unnecessary re-renders
      const currentOrderIds = items.map(p => p.id).join(',');
      const newOrderIds = sortedPhotos.map(p => p.id).join(',');
      
      if (currentOrderIds !== newOrderIds) {
        console.log("ClinicPhotosManager: Sincronizando estado local con DB", { old: currentOrderIds, new: newOrderIds });
        setItems(sortedPhotos);
      }
    }
  }, [photos, isSavingOrder, items]);

  const handleFileChange = useCallback(async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      await uploadPhoto(e.target.files);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [uploadPhoto]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDraggingFile(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDraggingFile(false);
  }, []);

  const handleDrop = useCallback(async (e) => {
    e.preventDefault();
    setIsDraggingFile(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await uploadPhoto(e.dataTransfer.files);
    }
  }, [uploadPhoto]);

  const moveImageLeft = useCallback(async (index) => {
    if (index === 0 || isSavingOrder || pendingReorder.current) return;
    
    pendingReorder.current = true;
    setIsSavingOrder(true);
    
    const previousItems = [...items];
    const newItems = [...items];
    const temp = newItems[index - 1];
    newItems[index - 1] = newItems[index];
    newItems[index] = temp;
    
    // 1. Optimistic update for smooth UI
    setItems(newItems);
    
    try {
      console.log(`Moviendo imagen a la izquierda: de índice ${index} a ${index - 1}`);
      // 2. Persist to DB and await confirmation
      const confirmedOrder = await updatePhotosOrder(clinicId, newItems);
      
      // 3. Update with confirmed data
      setItems(confirmedOrder);
    } catch (err) {
      console.error("Reorder failed, reverting optimistic UI state", err);
      // Revert to previous state on failure
      setItems(previousItems);
    } finally {
      setIsSavingOrder(false);
      // Use setTimeout to ensure the React re-render queue settles before opening up to hook syncs
      setTimeout(() => {
        pendingReorder.current = false;
      }, 50);
    }
  }, [items, isSavingOrder, clinicId, updatePhotosOrder]);

  const moveImageRight = useCallback(async (index) => {
    if (index === items.length - 1 || isSavingOrder || pendingReorder.current) return;
    
    pendingReorder.current = true;
    setIsSavingOrder(true);
    
    const previousItems = [...items];
    const newItems = [...items];
    const temp = newItems[index + 1];
    newItems[index + 1] = newItems[index];
    newItems[index] = temp;
    
    // 1. Optimistic update for smooth UI
    setItems(newItems);
    
    try {
      console.log(`Moviendo imagen a la derecha: de índice ${index} a ${index + 1}`);
      // 2. Persist to DB and await confirmation
      const confirmedOrder = await updatePhotosOrder(clinicId, newItems);
      
      // 3. Update with confirmed data
      setItems(confirmedOrder);
    } catch (err) {
      console.error("Reorder failed, reverting optimistic UI state", err);
      // Revert to previous state on failure
      setItems(previousItems);
    } finally {
      setIsSavingOrder(false);
      setTimeout(() => {
        pendingReorder.current = false;
      }, 50);
    }
  }, [items, isSavingOrder, clinicId, updatePhotosOrder]);

  const handleDelete = useCallback((id, url) => {
      deletePhoto(id, url);
  }, [deletePhoto]);

  if (isLoading && items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4 min-h-[300px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">Cargando galería de fotos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
         <div>
             <Label className="text-lg">Fotos de la Clínica</Label>
             <p className="text-sm text-muted-foreground">
                Usa las flechas para reordenar las fotos. Formatos aceptados: JPG, PNG, WebP (Máx {PHOTO_LIMITS.MAX_SIZE_MB}MB).
             </p>
         </div>
         <div className="text-sm font-medium">
             <span className={cn(items.length < PHOTO_LIMITS.MIN_PHOTOS ? "text-amber-500" : "text-green-500")}>
                 {items.length} / {PHOTO_LIMITS.MAX_PHOTOS} fotos
             </span>
         </div>
      </div>

      {uploading && (
        <div className="w-full bg-muted rounded-full h-3 mb-4 overflow-hidden border border-border/50">
            <motion.div 
                className="bg-primary h-full rounded-full" 
                initial={{ width: 0 }}
                animate={{ width: `${uploadProgress}%` }}
                transition={{ duration: 0.3 }}
            />
            <p className="text-xs text-center mt-2 text-muted-foreground font-medium">Procesando y subiendo... {uploadProgress}%</p>
        </div>
      )}

      <div className="w-full">
        <div className="flex flex-wrap gap-4">
          <AnimatePresence mode="popLayout">
              {items.map((photo, index) => (
                <PhotoItem
                  key={photo.id}
                  photo={photo}
                  index={index}
                  isFirst={index === 0}
                  isLast={index === items.length - 1}
                  isUploading={uploading}
                  isSavingOrder={isSavingOrder}
                  onDelete={handleDelete}
                  onMoveLeft={moveImageLeft}
                  onMoveRight={moveImageRight}
                />
              ))}
              
              {(!uploading && items.length < PHOTO_LIMITS.MAX_PHOTOS) && (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={cn(
                    "w-full sm:w-[calc(50%-0.5rem)] md:w-[calc(33.333%-0.67rem)] lg:w-[calc(25%-0.75rem)] aspect-square relative rounded-xl border-2 border-dashed transition-all duration-200 flex flex-col items-center justify-center cursor-pointer group bg-muted/30",
                    isDraggingFile ? "border-primary bg-primary/10 scale-[0.98]" : "border-border hover:border-primary hover:bg-primary/5"
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
                          isDraggingFile ? "bg-primary text-primary-foreground shadow-lg" : "bg-background shadow-sm text-muted-foreground group-hover:text-primary group-hover:scale-110"
                      )}>
                          <ImagePlus className="w-7 h-7" />
                      </div>
                      <span className="text-sm font-semibold text-foreground">
                          {isDraggingFile ? 'Suelta para subir' : 'Añadir fotos'}
                      </span>
                      <span className="text-xs text-muted-foreground mt-1 px-2">
                          Arrastra o haz clic aquí
                      </span>
                  </div>
                </motion.div>
              )}
          </AnimatePresence>
        </div>
      </div>

      <div className="pt-4">
          {items.length < PHOTO_LIMITS.MIN_PHOTOS ? (
             <motion.div 
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 className="flex items-start gap-3 text-sm text-amber-700 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400 p-4 rounded-lg border border-amber-200 dark:border-amber-900/50"
             >
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                    <p className="font-semibold mb-1">Acción requerida</p>
                    <p>Necesitas subir al menos {PHOTO_LIMITS.MIN_PHOTOS} fotos para que tu clínica sea visible. Faltan {PHOTO_LIMITS.MIN_PHOTOS - items.length}.</p>
                </div>
             </motion.div>
          ) : (
             <motion.div 
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 className="flex items-center gap-3 text-sm text-green-700 bg-green-50 dark:bg-green-950/30 dark:text-green-400 p-4 rounded-lg border border-green-200 dark:border-green-900/50"
             >
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                <span className="font-medium">¡Excelente! Tu galería cumple con los requisitos mínimos.</span>
             </motion.div>
          )}
      </div>
    </div>
  );
};

export default ClinicPhotosManager;