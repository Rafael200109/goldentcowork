import React from 'react';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import ClinicPhotoCarousel from './ClinicPhotoCarousel';
import { cn } from '@/lib/utils';

/**
 * Wrapper container for the photo carousel to provide consistent padding,
 * error boundaries, and easy integration.
 */
const PhotoCarouselContainer = ({ photos, className }) => {
  return (
    <ErrorBoundary>
      <div className={cn("w-full mb-[var(--carousel-spacing-lg)]", className)}>
        <ClinicPhotoCarousel photos={photos} />
      </div>
    </ErrorBoundary>
  );
};

export default PhotoCarouselContainer;