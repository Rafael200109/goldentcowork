# Image Optimization Guide for Goldent

This guide outlines the image optimization strategy implemented in the Goldent application to ensure high performance, low bandwidth usage, and a great user experience.

## Core Utilities

### 1. ImageOptimizer (`src/lib/imageOptimizer.js`)
Handles client-side compression and format conversion.
- `compressImage(file)`: Compresses images using `browser-image-compression`.
- `convertToWebP(file)`: Converts images to WebP format for smaller file sizes.
- `getOptimizedUrl(url, options)`: Appends Supabase transformation parameters.

### 2. ImageUploadHandler (`src/lib/imageUploadHandler.js`)
Manages the upload process for clinic photos.
- Automatically generates multiple sizes: thumbnail (150px), small (300px), medium (600px), large (1200px).
- Uploads all variants to Supabase Storage.
- Provides real-time upload progress.

### 3. LazyImage Component (`src/components/ui/LazyImage.jsx`)
A replacement for the standard `<img>` tag.
- **Intersection Observer**: Loads images only when they enter the viewport.
- **Blur-up Effect**: Shows a blur placeholder or pulse animation while loading.
- **Responsive `srcSet`**: Automatically serves the correct size based on the device width.
- **WebP Support**: Uses WebP format where supported.

## Usage Guide

### When to use `LazyImage`
Use `LazyImage` for almost all images in the application, especially:
- Lists of items (clinics, users).
- Galleries and carousels.
- Heavy profile images or dashboard grids.

**Example:**