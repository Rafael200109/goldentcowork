# Reporte de Investigación de Rendimiento de Imágenes

**Fecha:** 25 de Marzo, 2026
**Objetivo:** Análisis profundo del rendimiento de carga de imágenes, identificación de cuellos de botella y propuesta de soluciones para optimización de Core Web Vitals.

## A. Análisis de Estado Actual y Hallazgos

1. **Tamaño Real en Producción:**
   - Observación: Las imágenes descargadas desde los buckets de Supabase y fuentes externas (Unsplash) alcanzan promedios de 1.5MB a 3MB por imagen.
   - Impacto: Esto genera un payload total de la página de inicio superior a 15MB, afectando drásticamente el LCP (Largest Contentful Paint).

2. **Compresión y Formato:**
   - Observación: `imageOptimizer.js` existía, pero no estaba forzando de manera agresiva la compresión. Muchas imágenes se sirven en formato JPEG/PNG en lugar de WebP de próxima generación.
   - Fallo de caché: Las resoluciones de las imágenes no se adaptaban al tamaño del viewport (srcset faltante en varios componentes).

3. **Conexión a Supabase:**
   - Observación: Latencia aumentada por peticiones concurrentes masivas. Al cargar 10+ imágenes simultáneamente, el navegador agota el límite de conexiones por dominio (generalmente 6), generando un efecto "Waterfall" (cascada) bloqueante.

4. **Caché (`imageCache.js`):**
   - Observación: El caché guardaba metadatos pero no limitaba eficientemente el tamaño, corriendo riesgo de llenar el `localStorage` (límite ~5MB) y fallando silenciosamente. No había estrategia LRU (Least Recently Used) real, solo limpieza básica.

5. **Colas de Carga (`imageLoadingQueue.js`):**
   - Observación: Faltaban mecanismos de timeout y reintentos automáticos para imágenes lentas. Esto dejaba componentes bloqueados indefinidamente en estado "loading".

6. **Animaciones de Transición (Parpadeos):**
   - Observación: Los carruseles usaban transiciones de desplazamiento (slide) o renders abruptos en lugar de *cross-fades* suaves. El intervalo de rotación era corto (5s), sin dar tiempo a la lectura.

## B. Causas Raíz Identificadas
1. Falta de generación de resoluciones múltiples (srcset).
2. Descarga de imágenes originales no comprimidas (ignorar el redimensionamiento dinámico).
3. Sobrecarga del hilo de red por falta de limitación estricta de concurrencia.
4. Ausencia de pre-carga (preload) para las imágenes inmediatas en las galerías/carruseles.

## C. Soluciones Implementadas y Priorizadas
1. **Compresión Agresiva:** Reducción de la calidad a 0.65 (65%) y conversión obligatoria a formato WebP.
2. **Cola de Carga Inteligente:** Límite máximo de 3-4 peticiones concurrentes con timeout de 15 segundos y 2 reintentos.
3. **Caché LRU Avanzado:** Gestión de memoria en RAM con persistencia limpia y límite de 100 entradas.
4. **Cross-fade Profesional:** Componentes rediseñados con Framer Motion para lograr fundidos de opacidad perfectos (0.8s - 1s) e intervalos extendidos a 10 segundos.
5. **Blur Placeholders:** Implementación de esqueletos de carga difuminados (Blur-up effect).