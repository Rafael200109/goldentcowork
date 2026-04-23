import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export const PhotoOrderButton = ({ direction = 'left', isDisabled = false, onClick, className }) => {
  const Icon = direction === 'left' ? ChevronLeft : ChevronRight;

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isDisabled && onClick) onClick();
      }}
      disabled={isDisabled}
      className={cn(
        "pointer-events-auto flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-md backdrop-blur-sm transition-colors",
        isDisabled 
          ? "cursor-not-allowed opacity-50 text-gray-400" 
          : "text-gray-600 hover:bg-gray-100 cursor-pointer",
        className
      )}
      aria-label={`Mover a la ${direction === 'left' ? 'izquierda' : 'derecha'}`}
    >
      <Icon className="h-5 w-5" />
    </button>
  );
};

export default PhotoOrderButton;