import React, { useEffect, useRef } from 'react';
import LazyImage from '@/components/ui/LazyImage';
import { cn } from '@/lib/utils';

const PhotoCarouselThumbnail = ({ 
  photo, 
  isActive, 
  index, 
  onClick 
}) => {
  const buttonRef = useRef(null);
  
  // Extract URL safely whether photo is an object or string
  const photoUrl = typeof photo === 'string' ? photo : photo?.photo_url;

  // Scroll active thumbnail into view
  useEffect(() => {
    if (isActive && buttonRef.current) {
      const container = buttonRef.current.parentElement;
      if (container) {
        const containerRect = container.getBoundingClientRect();
        const thumbRect = buttonRef.current.getBoundingClientRect();
        
        const isVisible = (
          thumbRect.left >= containerRect.left &&
          thumbRect.right <= containerRect.right
        );

        if (!isVisible) {
          container.scrollTo({
            left: buttonRef.current.offsetLeft - container.offsetWidth / 2 + buttonRef.current.offsetWidth / 2,
            behavior: 'smooth'
          });
        }
      }
    }
  }, [isActive]);

  if (!photoUrl) return null;

  return (
    <button
      ref={buttonRef}
      onClick={() => onClick(index)}
      className={cn(
        "relative flex-shrink-0 rounded-[var(--carousel-thumb-radius)] overflow-hidden transition-all duration-300 ease-in-out snap-center",
        "w-[80px] h-[80px] md:w-[100px] md:h-[100px] lg:w-[120px] lg:h-[120px]",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        isActive 
          ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-100 opacity-100 shadow-md" 
          : "opacity-60 hover:opacity-100 hover:scale-[1.05]"
      )}
      aria-label={`Ver foto ${index + 1}`}
      aria-pressed={isActive}
    >
      <div className="w-full h-full bg-muted">
         <LazyImage
           src={photoUrl}
           alt={`Miniatura ${index + 1}`}
           className="w-full h-full object-cover"
           aspectRatio="aspect-square"
           context="thumbnail"
         />
      </div>
      
      {/* Active state overlay highlight */}
      <div className={cn(
        "absolute inset-0 bg-primary/0 transition-colors duration-300",
        isActive && "bg-primary/5"
      )} />
    </button>
  );
};

export default PhotoCarouselThumbnail;