import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

const PhotoLightbox = ({ isOpen, photos, currentIndex, onClose, onNavigate }) => {
  const [touchStart, setTouchStart] = useState(null);

  const handleKeyDown = useCallback((e) => {
    if (!isOpen) return;
    if (e.key === 'Escape') onClose();
    if (e.key === 'ArrowRight') onNavigate('next');
    if (e.key === 'ArrowLeft') onNavigate('prev');
  }, [isOpen, onClose, onNavigate]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen || !photos || photos.length === 0) return null;

  const currentPhoto = photos[currentIndex];

  const handleTouchStart = (e) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e) => {
    if (!touchStart) return;
    const touchEnd = e.changedTouches[0].clientX;
    const distance = touchStart - touchEnd;
    
    if (distance > 50) {
      onNavigate('next');
    } else if (distance < -50) {
      onNavigate('prev');
    }
    setTouchStart(null);
  };

  const handleBackgroundClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 flex items-center justify-center bg-black/90 backdrop-blur-sm"
          style={{ zIndex: 'var(--lightbox-z, 100)' }}
          onClick={handleBackgroundClick}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 md:top-6 md:right-6 p-2 text-white/70 hover:text-white bg-black/20 hover:bg-black/40 rounded-full transition-colors z-10"
            aria-label="Cerrar"
          >
            <X className="w-6 h-6 md:w-8 md:h-8" />
          </button>

          {/* Previous Button */}
          {photos.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); onNavigate('prev'); }}
              className="absolute left-2 md:left-6 p-2 md:p-3 text-white/70 hover:text-white bg-black/20 hover:bg-black/40 rounded-full transition-colors z-10"
              aria-label="Foto anterior"
            >
              <ChevronLeft className="w-8 h-8 md:w-10 md:h-10" />
            </button>
          )}

          {/* Main Image Container */}
          <div 
            className="relative w-full max-w-7xl h-full max-h-[85vh] flex items-center justify-center p-4 md:p-12 pointer-events-none"
          >
            <AnimatePresence mode="wait">
              <motion.img
                key={currentIndex}
                src={currentPhoto?.photo_url}
                alt={`Vista detallada ${currentIndex + 1}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="max-w-full max-h-full object-contain drop-shadow-2xl pointer-events-auto select-none"
                onClick={(e) => e.stopPropagation()}
              />
            </AnimatePresence>
          </div>

          {/* Next Button */}
          {photos.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); onNavigate('next'); }}
              className="absolute right-2 md:right-6 p-2 md:p-3 text-white/70 hover:text-white bg-black/20 hover:bg-black/40 rounded-full transition-colors z-10"
              aria-label="Siguiente foto"
            >
              <ChevronRight className="w-8 h-8 md:w-10 md:h-10" />
            </button>
          )}

          {/* Counter */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/50 text-white text-sm font-medium rounded-full tracking-wide">
            {currentIndex + 1} / {photos.length}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PhotoLightbox;