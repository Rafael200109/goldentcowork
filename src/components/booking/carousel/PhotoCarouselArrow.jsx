import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const PhotoCarouselArrow = ({ 
  direction = 'right', 
  onClick, 
  disabled = false,
  className
}) => {
  const isLeft = direction === 'left';
  const Icon = isLeft ? ChevronLeft : ChevronRight;
  
  return (
    <Button
      variant="secondary"
      size="icon"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      disabled={disabled}
      className={cn(
        "absolute top-1/2 -translate-y-1/2 z-10 w-10 h-10 md:w-12 md:h-12 rounded-full shadow-lg",
        "bg-white/90 hover:bg-white text-foreground hover:scale-110",
        "transition-all duration-300 ease-in-out",
        "disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed",
        isLeft ? "left-2 md:left-4" : "right-2 md:right-4",
        className
      )}
      aria-label={isLeft ? "Foto anterior" : "Siguiente foto"}
    >
      <Icon className="w-5 h-5 md:w-6 md:h-6" />
    </Button>
  );
};

export default PhotoCarouselArrow;