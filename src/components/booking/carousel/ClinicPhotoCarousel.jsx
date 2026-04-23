import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePhotoCarousel } from '@/hooks/usePhotoCarousel';
import PhotoCarouselArrow from './PhotoCarouselArrow';
import PhotoCarouselThumbnail from './PhotoCarouselThumbnail';
import { cn } from '@/lib/utils';
import { Image as ImageIcon } from 'lucide-react';

const slideVariants = {
  enter: (direction) => ({
    x: direction > 0 ? '100%' : '-100%',
    opacity: 0,
    scale: 0.95
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
    scale: 1
  },
  exit: (direction) => ({
    zIndex: 0,
    x: direction < 0 ? '100%' : '-100%',
    opacity: 0,
    scale: 1.05
  })
};

const ClinicPhotoCarousel = ({ photos = [], className }) => {
  const {
    currentIndex,
    totalPhotos,
    direction,
    handlers
  } = usePhotoCarousel(photos);

  if (!photos || totalPhotos === 0) {
    return (
      <div className={cn("w-full h-[400px] flex flex-col items-center justify-center bg-muted rounded-[var(--carousel-radius)] border border-dashed", className)}>
        <ImageIcon className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
        <p className="text-muted-foreground font-medium">No hay fotos disponibles para esta clínica</p>
      </div>
    );
  }

  // Handle both string arrays and object arrays
  const currentPhotoUrl = typeof photos[currentIndex] === 'string' 
    ? photos[currentIndex] 
    : photos[currentIndex]?.photo_url;

  return (
    <div className={cn("flex flex-col gap-[var(--carousel-spacing-md)] w-full focus:outline-none", className)} tabIndex={0}>
      
      {/* Main Large Photo Area */}
      <div 
        className="relative w-full aspect-[4/3] md:aspect-video lg:aspect-[21/9] bg-[hsl(var(--carousel-bg))] overflow-hidden rounded-[var(--carousel-radius)] shadow-sm group"
        onTouchStart={handlers.onTouchStart}
        onTouchMove={handlers.onTouchMove}
        onTouchEnd={handlers.onTouchEnd}
      >
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.3 },
              scale: { duration: 0.4 }
            }}
            className="absolute inset-0 w-full h-full flex items-center justify-center bg-black/5"
          >
            <img 
              src={currentPhotoUrl} 
              alt={`Foto de la clínica ${currentIndex + 1} de ${totalPhotos}`}
              className="w-full h-full object-cover select-none pointer-events-none"
              loading="lazy"
              onError={(e) => {
                e.target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjY2NjIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHJlY3QgeD0iMyIgeT0iMyIgd2lkdGg9IjE4IiBoZWlnaHQ9IjE4IiByeD0iMiIgcnk9IjIiPjwvcmVjdD48Y2lyY2xlIGN4PSI4LjUiIGN5PSI4LjUiIHI9IjEuNSI+PC9jaXJjbGU+PHBvbHlsaW5lIHBvaW50cz0iMjEgMTUgMTYgMTAgNSAyMSI+PC9wb2x5bGluZT48L3N2Zz4=';
                e.target.className = 'w-1/4 h-1/4 object-contain opacity-20';
              }}
            />
          </motion.div>
        </AnimatePresence>

        {/* Overlay Gradients for better text/arrow visibility */}
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 top-0 h-1/6 bg-gradient-to-b from-black/20 to-transparent pointer-events-none" />

        {/* Navigation Arrows */}
        {totalPhotos > 1 && (
          <>
            <PhotoCarouselArrow 
              direction="left" 
              onClick={handlers.previous} 
              className="opacity-0 md:opacity-100 group-hover:opacity-100 focus-within:opacity-100"
            />
            <PhotoCarouselArrow 
              direction="right" 
              onClick={handlers.next} 
              className="opacity-0 md:opacity-100 group-hover:opacity-100 focus-within:opacity-100"
            />
          </>
        )}

        {/* Counter Badge */}
        <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-xs font-semibold z-10 tracking-widest shadow-sm border border-white/10">
          {currentIndex + 1} / {totalPhotos}
        </div>
      </div>

      {/* Thumbnails Strip */}
      {totalPhotos > 1 && (
        <div 
          className="flex overflow-x-auto gap-[var(--carousel-spacing-sm)] md:gap-[var(--carousel-spacing-md)] pb-4 pt-1 px-1 scrollbar-hide snap-x"
          style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}
        >
          {photos.map((photo, index) => (
            <PhotoCarouselThumbnail
              key={photo.id || index}
              photo={photo}
              index={index}
              isActive={currentIndex === index}
              onClick={handlers.goToIndex}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ClinicPhotoCarousel;