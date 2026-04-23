# Clinic Photo Carousel Component

A responsive, high-performance, and accessible image carousel built specifically for clinic detail pages.

## Overview
The `PhotoCarouselContainer` and its internal `ClinicPhotoCarousel` replace standard grid galleries or pop-out lightboxes by presenting a main, large image display paired with an interactive thumbnail strip. It uses `framer-motion` for smooth visual transitions and supports swipe/touch logic for mobile devices.

## File Structure
- `PhotoCarouselContainer.jsx`: The primary wrapper. Handles error boundaries and responsive container margins.
- `ClinicPhotoCarousel.jsx`: The core engine. Displays the main image, handles animations, and renders the layout.
- `PhotoCarouselThumbnail.jsx`: Individual thumbnail button. Handles active states, focus rings, and scroll-into-view logic.
- `PhotoCarouselArrow.jsx`: Arrow buttons using `lucide-react` icons.
- `usePhotoCarousel.js`: Custom hook encapsulating navigation logic, circular bounds, debounce, and touch swipe event handlers.

## Props

### PhotoCarouselContainer
| Prop | Type | Default | Description |
|---|---|---|---|
| `photos` | `Array<Object \| String>` | `[]` | Array of image URL strings, or objects containing a `photo_url` property. |
| `className` | `String` | `""` | Optional CSS classes for additional styling. |

## Usage Examples

**Basic Integration:**