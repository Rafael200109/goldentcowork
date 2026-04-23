import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';
import LazyImage from '@/components/ui/LazyImage';
import { cn } from '@/lib/utils';

const slideVariants = {
  enter: (direction) => ({
    x: direction > 0 ? 1000 : -1000,
    opacity: 0
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1
  },
  exit: (direction) => ({
    zIndex: 0,
    x: direction < 0 ? 1000 : -1000,
    opacity: 0
  })
};

const swipeConfidenceThreshold = 10000;
const swipePower = (offset, velocity) => {
  return Math.abs(offset) * velocity;
};

const PhotoGallery = ({ photos, onPhotoClick }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const thumbnailContainerRef = useRef(null);

  const hasPhotos = photos && photos.length > 0;

  const navigateTo = useCallback((newIndex, newDirection) => {
    if (!hasPhotos) return;
    let nextIndex = newIndex;
    if (newIndex < 0) nextIndex = photos.length - 1;
    if (newIndex >= photos.length) nextIndex = 0;

    setDirection(newDirection);
    setCurrentIndex(nextIndex);
  }, [photos, hasPhotos]);

  const handleNext = useCallback((e) => {
    e?.stopPropagation();
    navigateTo(currentIndex + 1, 1);
  }, [currentIndex, navigateTo]);

  const handlePrev = useCallback((e) => {
    e?.stopPropagation();
    navigateTo(currentIndex - 1, -1);
  }, [currentIndex, navigateTo]);

  const handleThumbnailClick = useCallback((index) => {
    if (index === currentIndex) return;
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
  }, [currentIndex]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };
    // Only attach if we have photos
    if (hasPhotos) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev, hasPhotos]);

  // Scroll active thumbnail into view
  useEffect(() => {
    if (!thumbnailContainerRef.current) return;
    const container = thumbnailContainerRef.current;
    const activeThumb = container.children[currentIndex];
    
    if (activeThumb) {
      const containerRect = container.getBoundingClientRect();
      const thumbRect = activeThumb.getBoundingClientRect();
      
      const isVisible = (
        thumbRect.left >= containerRect.left &&
        thumbRect.right <= containerRect.right
      );

      if (!isVisible) {
        container.scrollTo({
          left: activeThumb.offsetLeft - container.offsetWidth / 2 + activeThumb.offsetWidth / 2,
          behavior: 'smooth'
        });
      }
    }
  }, [currentIndex]);

  const scrollThumbnails = (scrollDirection) => {
    if (!thumbnailContainerRef.current) return;
    const container = thumbnailContainerRef.current;
    const scrollAmount = container.offsetWidth * 0.7; // scroll 70% of container width
    container.scrollBy({
      left: scrollDirection === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  if (!hasPhotos) {
    return (
      <div className="w-full h-[300px] md:h-[400px] bg-muted flex items-center justify-center rounded-[var(--carousel-radius)] border">
        <p className="text-muted-foreground font-medium">No hay imágenes disponibles</p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-3 focus:outline-none" tabIndex={0}>
      {/* Main Image Carousel */}
      <div 
        className="relative w-full h-[300px] md:h-[400px] lg:h-[500px] bg-muted overflow-hidden rounded-[var(--carousel-radius)] shadow-sm group cursor-pointer"
        onClick={() => onPhotoClick(currentIndex)}
      >
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 }
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={1}
            onDragEnd={(e, { offset, velocity }) => {
              const swipe = swipePower(offset.x, velocity.x);
              if (swipe < -swipeConfidenceThreshold) {
                handleNext();
              } else if (swipe > swipeConfidenceThreshold) {
                handlePrev();
              }
            }}
            className="absolute inset-0 w-full h-full"
          >
            <img 
              src={photos[currentIndex].photo_url} 
              alt={`Foto ${currentIndex + 1} de la clínica`}
              className="w-full h-full object-cover pointer-events-none"
              loading="lazy"
            />
          </motion.div>
        </AnimatePresence>

        {/* Counter Badge */}
        <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-sm font-medium z-10">
          {currentIndex + 1} / {photos.length}
        </div>

        {/* Expand Icon */}
        <div className="absolute top-4 right-4 bg-black/40 hover:bg-black/60 backdrop-blur-md text-white p-2 rounded-full z-10 transition-colors opacity-0 group-hover:opacity-100">
          <Maximize2 className="w-5 h-5" />
        </div>

        {/* Navigation Arrows */}
        {photos.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-foreground p-2 rounded-full shadow-md z-10 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 hover:scale-110"
              aria-label="Anterior"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-foreground p-2 rounded-full shadow-md z-10 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 hover:scale-110"
              aria-label="Siguiente"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnail Strip */}
      {photos.length > 1 && (
        <div className="relative group/thumb">
          {/* Scroll Left Button */}
          <button 
            onClick={() => scrollThumbnails('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 bg-background border shadow-md rounded-full p-1 z-10 opacity-0 group-hover/thumb:opacity-100 transition-opacity hidden md:flex hover:bg-accent"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div 
            ref={thumbnailContainerRef}
            className="flex overflow-x-auto gap-2 scrollbar-hide snap-x px-1 py-1"
            style={{ scrollSnapType: 'x mandatory' }}
          >
            {photos.map((photo, index) => (
              <button
                key={photo.id || index}
                onClick={() => handleThumbnailClick(index)}
                className={cn(
                  "relative flex-shrink-0 w-20 h-20 md:w-24 md:h-24 rounded-[var(--carousel-thumb-radius)] overflow-hidden transition-all duration-300 snap-center",
                  currentIndex === index 
                    ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-100 opacity-100" 
                    : "opacity-60 hover:opacity-100 hover:scale-[1.02]"
                )}
              >
                <img
                  src={photo.photo_url}
                  alt={`Miniatura ${index + 1}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </button>
            ))}
          </div>

          {/* Scroll Right Button */}
          <button 
            onClick={() => scrollThumbnails('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 bg-background border shadow-md rounded-full p-1 z-10 opacity-0 group-hover/thumb:opacity-100 transition-opacity hidden md:flex hover:bg-accent"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default PhotoGallery;