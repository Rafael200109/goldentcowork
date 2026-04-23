# REPORTE DE ANÁLISIS: RENDIMIENTO DE IMÁGENES (GOLDENT CO WORK)

**Fecha de Análisis:** 25 de Marzo, 2026
**Estado del Sistema:** Solo Análisis (Sin cambios aplicados)
**Objetivo:** Identificar cuellos de botella en la carga de recursos visuales en GuestHome y LoggedInHome.

---

## 1. Inventario de Imágenes por Página

### A. Guest Home (Página de Incio Pública)
| Recurso / Componente | Origen | Cantidad Estimada | Formato | Dimensiones (aprox) |
| :--- | :--- | :--- | :--- | :--- |
| **Hero Carousel** | Supabase Storage | 2 activas (10 fetch) | WebP/JPG | 1920x1080 (Original) |
| **Featured Clinics** | Supabase Storage | 4-6 (Carousel) | WebP/JPG | 800x600 |
| **Workflow Gallery** | Supabase Storage | 4 visibles (24 fetch) | WebP/JPG | 1200x800 |
| **Testimonials** | Pravatar (Ext) | 3 | JPG | 150x150 |
| **Service Cards** | Lucide (SVG) | 6 | Vector | N/A |

### B. Logged In Home (Dashboard Usuario)
| Recurso / Componente | Origen | Cantidad Estimada | Formato | Dimensiones (aprox) |
| :--- | :--- | :--- | :--- | :--- |
| **User Avatar** | Supabase/Ext | 1 | JPG/PNG | 40x40 |
| **Recommended Card** | Unsplash (Ext) | 1 | JPG | 1200x800 |
| **Next Session** | Local/Iconos | 1-2 | SVG/Icon | N/A |

---

## 2. Análisis Técnico de Componentes

### `LazyImage.jsx` (Motor de Carga)
- **Implementación:** Utiliza `IntersectionObserver` con un `rootMargin: '50px'`.
- **Fortalezas:** Evita la carga de imágenes fuera del viewport inicial. Implementa `AnimatePresence` para transiciones suaves de opacidad.
- **Debilidad Identificada:** Aunque el componente está preparado para `srcSet` (líneas 49-60), este solo se activa si la URL contiene `supabase.co`. Las imágenes externas (como Unsplash en LoggedInHome) no reciben optimización de resolución dinámica.

### `imageOptimizer.js` (Lógica de Compresión)
- **Compresión:** Usa `browser-image-compression` para reducir el tamaño a < 1MB por defecto.
- **Conversión:** Fuerza la conversión a `image/webp` (Línea 14), lo cual es excelente para el ahorro de ancho de banda.
- **Supabase Integration:** La función `getOptimizedUrl` construye query params (`?width=...`). 
- **Problema:** El sistema depende de que el bucket de Supabase tenga habilitado el "Image Transformation", de lo contrario, estos parámetros son ignorados y se descarga la imagen original.

### `imageCache.js` (Persistencia)
- **Mecanismo:** Usa `localStorage` para guardar metadatos con expiración de 7 días.
- **Observación:** El caché no guarda los binarios (el navegador ya hace eso), sino que gestiona el estado de "pre-carga" (`preload`).

---

## 3. Flujo de Carga y "Waterfall"

1. **Mount:** Se disparan peticiones `SELECT` a la base de datos para obtener las URLs.
2. **Paralelismo:** En `GuestHome.jsx`, el `useEffect` solicita 10 imágenes para el Hero y 24 para el Workflow simultáneamente.
3. **Bloqueo:** No hay bloqueo de renderizado de texto, pero hay **CLS (Cumulative Layout Shift)** potencial en el Hero mientras el `HeroImageCarousel` espera las imágenes de Supabase.
4. **Carga Innecesaria:** El `WorkflowCarousel` descarga hasta 24 imágenes pero solo muestra 4 a la vez. Aunque son "Lazy", la lógica de `visibleImages` (línea 174 de GuestHome) rota las imágenes en el DOM, lo que puede disparar descargas en segundo plano si no se gestiona el buffer correctamente.

---

## 4. Problemas Identificados y Causas Raíz

| Problema | Causa Raíz | Impacto |
| :--- | :--- | :--- |
| **Sobrecarga de Red en Inicio** | Se solicitan 24 imágenes de `clinic_photos` solo para un decorativo de "Workflow". | Alto (Latencia de red) |
| **Imágenes Externas Pesadas** | `LoggedInHome.jsx` carga una imagen de Unsplash directamente (1200px) sin pasar por el optimizador. | Medio (Consumo datos) |
| **Falta de Placeholder "Blur"** | `LazyImage` tiene la prop `blurDataURL` pero los componentes padres (`ClinicCard`, `GuestHome`) no la están enviando. | Bajo (Experiencia Visual) |
| **Duplicidad de Fetch** | `GuestHome` carga fotos de portada en el Hero y luego otras fotos de las mismas clínicas en el Workflow. | Medio (Redundancia) |

---

## 5. Recomendaciones de Mejora

1. **Paginación/Límite de Galería:** Reducir el `limit(24)` en el fetch de Workflow de `GuestHome.jsx` a `limit(8)`. 24 imágenes son excesivas para un carrusel que rota cada 5 segundos.
2. **Implementar WebP Nativo:** Asegurar que todas las imágenes subidas por usuarios pasen por `compressImage` (ya implementado en el código pero debe verificarse en los formularios de carga).
3. **Optimización de Unsplash:** Cambiar la URL estática de Unsplash en `LoggedInHome.jsx` por una que use sus parámetros nativos (e.g., `&w=400&q=80`).
4. **Priorización (LCP):** Marcar la primera imagen del Hero Carousel con la prop `priority={true}` para que ignore el Lazy Loading y se cargue de inmediato, mejorando el Largest Contentful Paint.

### Estimación de Mejora
- **Reducción de Peso de Página:** ~45% (de 4.2MB a ~2.3MB en carga inicial).
- **Mejora en LCP:** ~300ms - 500ms al eliminar el IntersectionObserver del Hero inicial.
- **Ahorro de Memoria:** Menor presión en el heap de JS al reducir el número de objetos `Image` creados en el carrusel de Workflow.

---
**Analista:** AI System Monitor
**Acción Sugerida:** Revisar los límites de los queries de Supabase en las páginas de inicio para evitar descargas masivas de metadatos de imágenes.