import { useState, useCallback, useEffect, useRef } from 'react';

/**
 * Custom hook to manage photo carousel logic
 * @param {Array} photos - Array of photo objects
 * @returns {Object} Carousel state and handlers
 */
export function usePhotoCarousel(photos = []) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const totalPhotos = photos?.length || 0;
  
  // Touch/swipe handling state
  const touchStartRef = useRef(null);
  const touchEndRef = useRef(null);

  // Debounce ref to prevent rapid clicking
  const isTransitioningRef = useRef(false);

  const goToIndex = useCallback((newIndex) => {
    if (!totalPhotos || isTransitioningRef.current) return;
    if (newIndex === currentIndex) return;

    let validIndex = newIndex;
    
    // Circular logic
    if (newIndex < 0) validIndex = totalPhotos - 1;
    if (newIndex >= totalPhotos) validIndex = 0;

    setDirection(newIndex > currentIndex ? 1 : -1);
    setCurrentIndex(validIndex);
    
    // Lock transition briefly
    isTransitioningRef.current = true;
    setTimeout(() => {
      isTransitioningRef.current = false;
    }, 400); // match animation duration approximately
  }, [currentIndex, totalPhotos]);

  const next = useCallback(() => {
    goToIndex(currentIndex + 1);
  }, [currentIndex, goToIndex]);

  const previous = useCallback(() => {
    goToIndex(currentIndex - 1);
  }, [currentIndex, goToIndex]);

  // Touch Handlers for swipe
  const minSwipeDistance = 50;

  const onTouchStart = useCallback((e) => {
    touchEndRef.current = null;
    touchStartRef.current = e.targetTouches[0].clientX;
  }, []);

  const onTouchMove = useCallback((e) => {
    touchEndRef.current = e.targetTouches[0].clientX;
  }, []);

  const onTouchEnd = useCallback(() => {
    if (!touchStartRef.current || !touchEndRef.current) return;
    const distance = touchStartRef.current - touchEndRef.current;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      next();
    } else if (isRightSwipe) {
      previous();
    }
  }, [next, previous]);

  // Preload next and previous images
  useEffect(() => {
    if (!totalPhotos) return;
    
    const preloadImage = (index) => {
      const src = photos[index]?.photo_url || photos[index];
      if (src && typeof src === 'string') {
        const img = new Image();
        img.src = src;
      }
    };

    const nextIdx = (currentIndex + 1) % totalPhotos;
    const prevIdx = (currentIndex - 1 + totalPhotos) % totalPhotos;
    
    preloadImage(nextIdx);
    preloadImage(prevIdx);
  }, [currentIndex, photos, totalPhotos]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') previous();
    };

    if (totalPhotos > 0) {
      window.addEventListener('keydown', handleKeyDown);
    }
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [next, previous, totalPhotos]);

  return {
    currentIndex,
    totalPhotos,
    direction,
    isFirst: currentIndex === 0,
    isLast: currentIndex === totalPhotos - 1,
    handlers: {
      next,
      previous,
      goToIndex,
      onTouchStart,
      onTouchMove,
      onTouchEnd
    }
  };
}