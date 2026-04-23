import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
// FIX: Using core optimizer functions directly to ensure safe formatting
import { getOptimizedUrl, generateSrcSet } from '@/lib/imageOptimizer';
import { IMAGE_OPTIMIZATION_CONFIG } from '@/lib/IMAGE_OPTIMIZATION_CONFIG';

export const OptimizedImage = ({
  src,
  alt = '',
  width,
  height,
  sizes = '100vw',
  lazy = true,
  priority = false,
  className,
  imageClassName,
  objectFit = 'cover',
  onLoad,
  onError,
  fallbackSrc = "https://images.unsplash.com/photo-1579069780919-d3947e04e316?q=80&w=600&auto=format&fit=crop"
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(!src);
  const [isInView, setIsInView] = useState(!lazy || priority);
  const containerRef = useRef(null);
  const imgRef = useRef(null);
  
  // Check if image is already cached on mount/src change
  useEffect(() => {
    if (imgRef.current && imgRef.current.complete) {
      if (imgRef.current.naturalWidth > 0) {
        setIsLoaded(true);
        if (onLoad) onLoad();
      } else {
        setHasError(true);
        setIsLoaded(true);
      }
    }
  }, [src, onLoad]);

  // Handle Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazy || priority || isInView) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: IMAGE_OPTIMIZATION_CONFIG.LAZY_LOADING.ROOT_MARGIN,
        threshold: IMAGE_OPTIMIZATION_CONFIG.LAZY_LOADING.THRESHOLD
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [lazy, priority, isInView]);

  // Validate src updates safely
  useEffect(() => {
    if (!src || typeof src !== 'string' || src.trim() === '') {
      setHasError(true);
      setIsLoaded(true); // Treat as loaded to show fallback
    } else {
      setHasError(false);
      setIsLoaded(false);
    }
  }, [src]);

  // Generate URLs if we should load
  const shouldLoad = isInView || priority;
  
  // FIX: Pass options as an object { width, height }
  const optimizedSrc = shouldLoad && src && !hasError ? getOptimizedUrl(src, { width, height }) : '';
  const webpSrcSet = shouldLoad && src && !hasError ? generateSrcSet(src) : '';
  const displaySrc = hasError || !src ? fallbackSrc : optimizedSrc;

  const handleLoad = (e) => {
    setIsLoaded(true);
    if (onLoad) onLoad(e);
  };

  const handleError = (e) => {
    console.warn(`[OptimizedImage] Failed to load image: ${src}`);
    setHasError(true);
    setIsLoaded(true); // Treat as loaded to remove skeleton and show fallback immediately
    if (onError) onError(e);
  };

  return (
    <div 
      ref={containerRef} 
      className={cn(
        "relative overflow-hidden bg-transparent", // FIX: Removed bg-muted which caused black boxes
        className
      )}
    >
      {/* Light Skeleton Loading State */}
      {(!isLoaded || !shouldLoad) && !hasError && (
        <div className="absolute inset-0 z-10 animate-pulse bg-gray-200 dark:bg-gray-800" />
      )}

      {/* Picture Tag for WebP + Fallback */}
      {shouldLoad && (
        <picture>
          {!hasError && webpSrcSet && (
            <source srcSet={webpSrcSet} sizes={sizes} type="image/webp" />
          )}
          <img
            ref={imgRef}
            src={displaySrc || fallbackSrc}
            alt={alt || "Image"}
            width={width}
            height={height}
            loading={priority ? "eager" : "lazy"}
            decoding={priority ? "sync" : "async"}
            onLoad={handleLoad}
            onError={handleError}
            className={cn(
              "w-full h-full transition-opacity duration-500 ease-in-out",
              objectFit === 'cover' ? 'object-cover' : 'object-contain',
              isLoaded ? "opacity-100" : "opacity-0",
              imageClassName
            )}
          />
        </picture>
      )}
    </div>
  );
};

export default OptimizedImage;