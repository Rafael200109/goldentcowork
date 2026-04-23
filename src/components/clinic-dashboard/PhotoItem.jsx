import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { X, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PhotoOrderButton } from '@/components/ui/PhotoOrderButton';

const PhotoItem = memo(({ 
  photo, 
  index, 
  isFirst, 
  isLast, 
  isUploading, 
  isSavingOrder, 
  onDelete, 
  onMoveLeft, 
  onMoveRight 
}) => {
  return (
    <motion.div
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
            onDelete(photo.id, photo.photo_url);
          }}
          disabled={isUploading || isSavingOrder}
          aria-label="Eliminar foto"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Reorder Arrows Container */}
      <div className="absolute inset-x-0 bottom-0 top-0 flex items-center justify-between p-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <PhotoOrderButton
          direction="left"
          isDisabled={isFirst || isSavingOrder}
          onClick={() => onMoveLeft(index)}
        />
        <PhotoOrderButton
          direction="right"
          isDisabled={isLast || isSavingOrder}
          onClick={() => onMoveRight(index)}
        />
      </div>
    </motion.div>
  );
});

PhotoItem.displayName = 'PhotoItem';

export default PhotoItem;