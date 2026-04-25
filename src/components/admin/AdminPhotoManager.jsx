import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabaseClient } from '@/config/supabaseConfig';
import { useClinicPhotos } from '@/hooks/useClinicPhotos';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, ImagePlus, X, Star, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { PHOTO_LIMITS } from '@/lib/photoValidation';
import { PhotoOrderButton } from '@/components/ui/PhotoOrderButton';

const AdminPhotoManager = ({ clinicId, clinicName }) => {
  const { photos, isLoading, uploading, uploadProgress, uploadPhoto, deletePhoto } = useClinicPhotos(clinicId);
  const [items, setItems] = useState([]);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const fileInputRef = useRef(null);
  const { toast } = useToast();

  useEffect(() => {
    if (photos && !isSavingOrder) {
      const sortedPhotos = [...photos].sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
      setItems(sortedPhotos);
    }
  }, [photos, isSavingOrder]);

  const handleFileChange = useCallback(async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      await uploadPhoto(e.target.files);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [uploadPhoto]);

  const saveOrderToSupabase = async (newOrder) => {
    setIsSavingOrder(true);
    try {
      const updates = newOrder.map((photo, index) => ({
        id: photo.id,
        display_order: index
      }));

      for (const update of updates) {
        const { error } = await supabaseClient
          .from('clinic_photos')
          .update({ display_order: update.display_order })
          .eq('id', update.id);
        
        if (error) throw error;
      }
    } catch (err) {
      console.error("Error saving photo order:", err);
      toast({
        title: "Error al guardar el orden",
        description: "Hubo un problema actualizando el orden. Por favor intenta de nuevo.",
        variant: "destructive"
      });
      if (photos) {
        setItems([...photos].sort((a, b) => (a.display_order || 0) - (b.display_order || 0)));
      }
    } finally {
      setIsSavingOrder(false);
    }
  };

  const moveImageLeft = (index) => {
    if (index === 0 || isSavingOrder) return;
    const newItems = [...items];
    const temp = newItems[index - 1];
    newItems[index - 1] = newItems[index];
    newItems[index] = temp;
    setItems(newItems);
    saveOrderToSupabase(newItems);
  };

  const moveImageRight = (index) => {
    if (index === items.length - 1 || isSavingOrder) return;
    const newItems = [...items];
    const temp = newItems[index + 1];
    newItems[index + 1] = newItems[index];
    newItems[index] = temp;
    setItems(newItems);
    saveOrderToSupabase(newItems);
  };

  if (isLoading && items.length === 0) {
    return (
      <Card className="w-full">
        <CardContent className="flex flex-col items-center justify-center p-12 space-y-4 min-h-[300px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground animate-pulse">Cargando galería de fotos...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle>Gestión de Fotos - Administrador</CardTitle>
            <CardDescription>
              Editando galería de la clínica: <span className="font-semibold text-foreground">{clinicName}</span>
            </CardDescription>
            <p className="text-sm text-muted-foreground mt-2">
              Usa las flechas para reordenar las fotos. Formatos aceptados: JPG, PNG, WebP (Máx {PHOTO_LIMITS.MAX_SIZE_MB}MB).
            </p>
          </div>
          <div className="text-sm font-medium whitespace-nowrap">
             <span className={cn(items.length < PHOTO_LIMITS.MIN_PHOTOS ? "text-amber-500" : "text-green-500")}>
                 {items.length} / {PHOTO_LIMITS.MAX_PHOTOS} fotos
             </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
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

        <div className="flex flex-wrap gap-4">
          <AnimatePresence mode="popLayout">
            {items.map((photo, index) => (
              <motion.div
                key={photo.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
                className={cn(
                  "relative w-full sm:w-[calc(50%-0.5rem)] md:w-[calc(33.333%-0.67rem)] lg:w-[calc(25%-0.75rem)] aspect-square rounded-xl overflow-hidden border border-border bg-muted group",
                  photo.is_cover && "border-primary ring-2 ring-primary/20"
                )}
              >
                <img
                  src={photo.photo_url}
                  alt={photo.is_cover ? "Foto principal de la clínica" : "Foto de la clínica"}
                  className="w-full h-full object-cover select-none"
                  draggable={false}
                />

                {/* Cover Badge */}
                {photo.is_cover && (
                  <div className="absolute top-2 left-2 z-10 pointer-events-none">
                    <div className="bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-md flex items-center shadow-md">
                      <Star className="w-3 h-3 mr-1 fill-current" /> Portada
                    </div>
                  </div>
                )}

                {/* Delete Button */}
                <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="destructive"
                    size="icon"
                    className="h-8 w-8 rounded-full shadow-md opacity-90 hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.preventDefault();
                      deletePhoto(photo.id, photo.photo_url);
                    }}
                    disabled={uploading || isSavingOrder}
                    aria-label="Eliminar foto"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                {/* Reorder Arrows Container */}
                <div className="absolute inset-x-0 bottom-0 top-0 flex items-center justify-between p-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <PhotoOrderButton
                    direction="left"
                    isDisabled={index === 0 || isSavingOrder}
                    onClick={() => moveImageLeft(index)}
                  />
                  <PhotoOrderButton
                    direction="right"
                    isDisabled={index === items.length - 1 || isSavingOrder}
                    onClick={() => moveImageRight(index)}
                  />
                </div>
              </motion.div>
            ))}

            {(!uploading && items.length < PHOTO_LIMITS.MAX_PHOTOS) && (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="w-full sm:w-[calc(50%-0.5rem)] md:w-[calc(33.333%-0.67rem)] lg:w-[calc(25%-0.75rem)] aspect-square relative rounded-xl border-2 border-dashed border-border hover:border-primary transition-colors flex flex-col items-center justify-center cursor-pointer group bg-muted/30"
              >
                <Input
                  type="file"
                  accept={PHOTO_LIMITS.VALID_TYPES.join(',')}
                  onChange={handleFileChange}
                  ref={fileInputRef}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  multiple
                  disabled={uploading}
                  title="Haz clic para subir fotos"
                />
                <div className="flex flex-col items-center justify-center text-center p-4 pointer-events-none">
                    <div className="p-4 rounded-full mb-3 bg-background shadow-sm text-muted-foreground group-hover:text-primary transition-colors duration-300 group-hover:scale-110">
                        <ImagePlus className="w-7 h-7" />
                    </div>
                    <span className="text-sm font-semibold text-foreground">
                        Añadir fotos
                    </span>
                    <span className="text-xs text-muted-foreground mt-1 px-2">
                        Haz clic aquí
                    </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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
      </CardContent>
    </Card>
  );
};

export default AdminPhotoManager;