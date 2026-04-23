# Mejores Prácticas de Optimización de Imágenes

Esta guía documenta la arquitectura actualizada para la gestión de recursos visuales en la plataforma.

## 1. Uso del Componente `<LazyImage />`
**Siempre** utiliza `<LazyImage />` en lugar de la etiqueta estándar `<img>`.

### Propiedades:
- `src`: URL de la imagen.
- `priority`: `'high'` (carga inmediata), `'medium'` (observador de intersección), `'low'` (diferido).
- `aspectRatio`: Fundamental para evitar saltos de diseño (CLS). Ej: `aspect-[16/9]`.
- `blurDataURL`: Imagen base64 miniatura para efecto de carga suave.

## 2. Gestión de Animaciones Fade (Carruseles)
- Los carruseles deben utilizar transiciones de **opacidad** (cross-fade) en lugar de desplazamientos laterales, ya que son más elegantes y menos distractivos.
- Intervalo estándar: **10 segundos** (10000ms).
- Duración de la transición: **0.8 a 1.2 segundos**.
- Pre-carga: Siempre precargar el índice `currentIndex + 1` usando la cola de prioridad.

## 3. Caché y Red (LRU)
- El sistema mantiene hasta 100 imágenes en memoria.
- Las peticiones están limitadas a 3 simultáneas para no bloquear los requests de la API.
- Se reintentan peticiones fallidas hasta 2 veces antes de mostrar la imagen de respaldo (`fallbackSrc`).

## 4. Subida de Imágenes
- Todas las imágenes subidas por los anfitriones pasan por `compressImage()` en el cliente antes de tocar Supabase.
- Se fuerzan a WebP y tamaño máximo de 1MB. Resoluciones generadas automáticamente (Thumbnail, Medium, Large).