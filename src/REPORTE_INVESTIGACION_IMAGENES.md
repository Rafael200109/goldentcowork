# REPORTE DE INVESTIGACIÓN: Problema de Imágenes Negras en Tarjetas de Clínicas

De acuerdo a la solicitud, se ha realizado un rastreo profundo del flujo completo de datos y renderizado de imágenes. A continuación, los hallazgos detallados.

---

### 1. ¿Existe una imagen por defecto? ¿Dónde?
**Sí, existe una imagen por defecto** y está definida de manera redundante en 3 archivos clave del flujo:
- **`src/components/search/ClinicCard.jsx`**: `const defaultImageUrl = "https://images.unsplash.com/photo-1579069780919-d3947e04e316?q=80&w=600&auto=format&fit=crop";`
- **`src/components/ui/LazyImage.jsx`**: Tiene el mismo enlace de Unsplash asignado al prop `fallbackSrc`.
- **`src/components/ui/OptimizedImage.jsx`**: Tiene el mismo enlace asignado por defecto a su prop `fallbackSrc`.

**No hay ninguna imagen "negra" hardcodeada**. 

---

### 2. ¿Cuál es la URL de la imagen negra?
La "imagen negra" **no es una URL ni un archivo de imagen real**. Es un efecto visual provocado por el fondo del contenedor y el estado de la UI:
- El componente `OptimizedImage.jsx` envuelve la imagen en un contenedor con la clase de Tailwind `bg-muted`.
- En el archivo `src/index.css`, para el modo oscuro (`.dark`), `--muted` está definido como `83 25% 15%` (un tono gris/verde extremadamente oscuro, casi negro).
- Si la imagen falla en cargar, se queda atascada en opacidad 0 (`opacity-0`), o si el contenedor se expone debido a un problema de tamaño, el usuario ve el fondo `bg-muted` vacío, lo cual se percibe como un "cuadro negro".

---

### 3. ¿Cuál es el flujo completo de datos?
El flujo de la foto de portada viaja sin problemas desde la base de datos hasta el componente final:
1. **`useCachedClinics.js` (Supabase)**: Ejecuta el query trayendo `clinic_photos ( photo_url, is_cover )`.
2. **`SearchClinics.jsx`**: Mapea la respuesta, buscando explícitamente la portada:
   `clinic.clinic_photos.find(p => p.is_cover === true) || clinic.clinic_photos[0]` y lo pasa como `imageUrl`.
3. **`ClinicCard.jsx`**: Recibe los datos y vuelve a verificar (por redundancia de seguridad) el orden de prioridad: portada explícita -> `imageUrl` -> primera foto -> `defaultImageUrl`.
4. **`LazyImage.jsx`**: Recibe la URL validada, calcula los anchos recomendados (`targetWidth`) y delega a `OptimizedImage`.
5. **`OptimizedImage.jsx`**: Recibe el `src`, inicia el `IntersectionObserver`, invoca el optimizador de URL (`getOptimizedUrl` y `generateSrcSet`) y finalmente monta la etiqueta `<picture>` e `<img>`.

---

### 4. ¿Dónde se rompe el flujo?
El flujo de datos (la URL de Supabase) es correcto, pero se rompe dramáticamente en **el renderizado y optimización final en `OptimizedImage.jsx` y `imageOptimizer.js`**.

Se identificaron tres puntos críticos de ruptura:
1. **Firma de función errónea (Argumentos incorrectos)**: 
   En `OptimizedImage.jsx` se invoca: `getOptimizedUrl(src, width, height)`.
   Sin embargo, en `imageOptimizer.js` la función se define como: `getOptimizedUrl(url, options = {})`.
   Al pasar `width` (un número) como segundo argumento, el objeto `options` se convierte en un número, por lo que `options.width` es `undefined`. La URL resultante se rompe o ignora los parámetros.
2. **URLs de Optimización de Supabase mal formadas**:
   El optimizador asume que concatenando `?width=300&format=webp` a una URL pública normal de Supabase (`/object/public/`) comprimirá la imagen. Si el bucket no tiene habilitada la Transformación de Imágenes nativa, o si la ruta exigida por Supabase es `/render/image/public/`, Supabase rechazará la imagen (Error 400) o enviará el archivo original masivo, manteniendo el contenedor oscuro cargando indefinidamente.
3. **Condición de Carrera en el estado de Carga (`isLoaded`)**:
   Si la imagen falla, o si se carga instantáneamente desde el caché, el componente `OptimizedImage` puede perder el evento `onLoad`. Si `isLoaded` no cambia a `true`, la imagen real se queda permanentemente con la clase `opacity-0`, exponiendo el fondo `bg-muted` oscuro (negro).

---

### 5. ¿Cuál es la causa raíz del problema?
La causa raíz es una combinación de **errores de sintaxis al interactuar con el optimizador de URLs** (`getOptimizedUrl(src, width)` en lugar de un objeto) y un **manejo frágil del ciclo de vida de carga en React**. 

Cuando el optimizador genera parámetros mal formados para el `srcSet` o la URL optimizada falla al ser interpretada por Supabase Storage, la etiqueta `<source>` se quiebra. Esto, sumado a que el componente oculta todo tras un fondo oscuro (`bg-muted`) hasta que confirma la carga perfecta, resulta en "tarjetas negras" para el usuario. La base de datos y los datos de Supabase están en perfecto estado.

---

### 6. ¿Qué solución se necesita?
Para arreglar este problema definitivamente, se debe:
1. **Corregir los parámetros en `OptimizedImage.jsx`**: Cambiar la llamada al optimizador para que pase un objeto de configuración válido: `getOptimizedUrl(src, { width, height })`.
2. **Adaptar `imageOptimizer.js` para Supabase**: Verificar si se debe reemplazar la ruta `/object/public/` por `/render/image/public/` para que los parámetros `?width=x&format=webp` funcionen sin arrojar error, o desactivar los parámetros de ancho de forma condicional.
3. **Robustecer el fallback de carga (`OptimizedImage.jsx`)**: Asegurar que si los `srcSet` generados (fuentes webp) fallan, el componente active `opacity-100` y fuerce el `fallbackSrc` sin quedarse estancado en un esqueleto de carga oscuro infinito.