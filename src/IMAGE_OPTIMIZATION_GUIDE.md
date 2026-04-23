# Guía de Optimización de Imágenes - Goldent Co Work

Esta guía documenta la arquitectura de carga y optimización de imágenes implementada en la plataforma para garantizar un rendimiento óptimo y una excelente experiencia de usuario (Core Web Vitals).

## 1. Arquitectura del Sistema

El sistema se compone de 5 piezas fundamentales:
1. **`LazyImage.jsx`**: El componente UI principal que reemplaza a la etiqueta `<img>` estándar.
2. **`imageLoadingQueue.js`**: Gestor de concurrencia que previene cuellos de botella en la red priorizando imágenes críticas.
3. **`imageCache.js`**: Capa de persistencia local (Memoria + LocalStorage) para evitar descargas redundantes.
4. **`imageOptimizer.js`**: Utilidades para manipulación de URLs de Supabase (srcset, WebP, compresión).
5. **`performanceMetrics.js`**: Monitor de rendimiento que ajusta la calidad de la imagen basándose en la velocidad de la red del usuario.

---

## 2. Uso del Componente `<LazyImage />`

Siempre utiliza este componente en lugar de `<img>` o `next/image` para mantener el control sobre la concurrencia.

### Propiedades Clave:
- `src`: URL de la imagen (Supabase u otra fuente).
- `priority`: Define el orden en la cola de carga. Valores: `'high'` (inmediato, sin observer), `'medium'` (viewport), `'low'` (fondo/oculto).
- `blurDataURL`: (Opcional) Imagen base64 de bajísima resolución para mostrar mientras carga.
- `aspectRatio`: Clase Tailwind para mantener la estructura antes de que cargue la imagen (ej: `aspect-video`, `aspect-[4/3]`).
- `fallbackSrc`: URL a mostrar si falla la carga.

### Ejemplo Básico: