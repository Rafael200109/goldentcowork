import React from 'react';
import LazyImage from '@/components/ui/LazyImage';

const ImageGallery = ({ photos, clinicName }) => {
  if (!photos || photos.length === 0) {
    return (
      <div className="w-full h-[400px] md:h-[500px] bg-muted flex items-center justify-center rounded-lg border">
        <p className="text-muted-foreground">No hay imágenes disponibles</p>
      </div>
    );
  }

  // Define static grid based on photo count
  const mainPhoto = photos[0];
  const sidePhotos = photos.slice(1, 5);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 grid-rows-2 gap-2 h-[400px] md:h-[500px] w-full bg-background rounded-lg overflow-hidden">
      {/* Main Large Image */}
      <div className="md:col-span-2 md:row-span-2 relative group h-full">
        <LazyImage
          src={mainPhoto?.photo_url}
          alt={`Foto principal de ${clinicName}`}
          className="w-full h-full cursor-pointer rounded-l-lg md:rounded-r-none"
          aspectRatio="aspect-none"
          context="detail"
          priority={true}
        />
      </div>

      {/* Smaller Side Images */}
      {sidePhotos.map((photo, idx) => (
        <div key={idx} className="hidden md:block relative h-full group">
          <LazyImage
            src={photo?.photo_url}
            alt={`Foto ${idx + 2} de ${clinicName}`}
            className={cn(
              "w-full h-full cursor-pointer",
              idx === 1 ? "rounded-tr-lg" : "",
              idx === 3 ? "rounded-br-lg" : ""
            )}
            aspectRatio="aspect-none"
            context="thumbnail"
            priority={false}
          />
        </div>
      ))}
      
      {/* Fill empty spots if less than 5 photos */}
      {Array.from({ length: Math.max(0, 4 - sidePhotos.length) }).map((_, idx) => (
        <div 
          key={`empty-${idx}`} 
          className={cn(
            "hidden md:block bg-muted w-full h-full border border-border/50",
            (idx + sidePhotos.length) === 1 ? "rounded-tr-lg" : "",
            (idx + sidePhotos.length) === 3 ? "rounded-br-lg" : ""
          )} 
        />
      ))}
    </div>
  );
};

// Simple utility specifically for ImageGallery border radius handling
const cn = (...classes) => classes.filter(Boolean).join(' ');

export default ImageGallery;