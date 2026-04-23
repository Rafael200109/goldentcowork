import React from 'react';
import OptimizedImage from './OptimizedImage';
import { cn } from '@/lib/utils';
import { getRecommendedWidth } from '@/lib/IMAGE_OPTIMIZATION_CONFIG';

/**
 * Simplified wrapper around OptimizedImage for common use cases.
 */
const LazyImage = ({ 
  src, 
  alt, 
  className, 
  aspectRatio = 'aspect-video', 
  priority = false, 
  context = 'detail', // 'thumbnail', 'card', 'detail', 'full', 'hero'
  sizes,
  objectFit = 'cover',
  fallbackSrc = "https://images.unsplash.com/photo-1579069780919-d3947e04e316?q=80&w=600&auto=format&fit=crop",
  ...props 
}) => {
  
  // Determine standard sizes based on context if not explicitly provided
  const defaultSizes = {
    'thumbnail': '(max-width: 640px) 100vw, 200px',
    'card': '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px',
    'detail': '(max-width: 768px) 100vw, 800px',
    'full': '100vw',
    'hero': '100vw'
  };

  const targetWidth = getRecommendedWidth(context);
  const resolvedSizes = sizes || defaultSizes[context] || defaultSizes['detail'];

  // Ensure we have a valid string for the source
  const validSrc = typeof src === 'string' && src.trim().length > 0 ? src : null;

  return (
    <OptimizedImage
      src={validSrc}
      alt={alt || "Imagen"}
      className={cn(aspectRatio, className)}
      lazy={!priority}
      priority={priority}
      width={targetWidth}
      sizes={resolvedSizes}
      objectFit={objectFit}
      fallbackSrc={fallbackSrc}
      {...props}
    />
  );
};

export default LazyImage;