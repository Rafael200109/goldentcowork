# REPORTE DE ANÁLISIS: Problema de Imágenes Negras en Tarjetas de Clínicas

## 1. RASTREO DE COMPONENTES
El flujo de renderizado de las tarjetas de clínicas es el siguiente:
1. **`src/pages/SearchClinics.jsx`**: Obtiene los datos de Supabase y mapea la propiedad `imageUrl` buscando la foto donde `is_cover === true` (o la primera si no hay portada).
2. **`src/components/search/ClinicList.jsx`**: Itera sobre las clínicas y renderiza el componente `ClinicCard`.
3. **`src/components/search/ClinicCard.jsx`**: Recibe la clínica, determina el `coverPhoto` y utiliza el componente `<LazyImage />` pasándole clases de Tailwind (`absolute inset-0 w-full h-full`).
4. **`src/components/ui/LazyImage.jsx`**: Calcula un `targetWidth` (ej. 400) basado en el contexto y envuelve a `<OptimizedImage />`.
5. **`src/components/ui/OptimizedImage.jsx`**: Componente final que maneja la etiqueta `<picture>`, `<img>` y el IntersectionObserver.

## 2. ANÁLISIS DE CÓDIGO Y CSS (CAUSAS RAÍZ IDENTIFICADAS)
Se han identificado **dos problemas críticos** simultáneos en `OptimizedImage.jsx` que causan que las tarjetas se vean negras o vacías:

### Problema A: Condición de carrera con la Caché del Navegador (Opacity 0)
- **Líneas problemáticas**: El manejo del estado `isLoaded` en `OptimizedImage.jsx`.
- **Mecanismo**: El componente inicia con `isLoaded = false` y aplica la clase `opacity-0` a la imagen. Depende exclusivamente del evento `onLoad={handleLoad}` para cambiar a `opacity-100`. 
- **El Bug**: Si la imagen ya está en la caché del navegador (muy común con `priority={true}` o al recargar), la imagen se carga *antes* de que React adjunte el event listener. El evento `onLoad` nunca se dispara, `isLoaded` se queda en `false` para siempre, y la imagen se queda invisible (`opacity-0`).

### Problema B: Conflicto Severo de Estilos CSS (Inline vs Tailwind)
- **Líneas problemáticas**: `<div ref={containerRef} className={cn("...", className)} style={{ width, height }}>` en `OptimizedImage.jsx`.
- **Mecanismo**: `LazyImage` envía un ancho numérico calculado (`width={400}`). `OptimizedImage` lo aplica como estilo en línea (`style="width: 400px"`). 
- **El Bug**: Este estilo en línea tiene mayor especificidad y sobrescribe las clases responsivas de Tailwind (`w-full h-full`) pasadas desde `ClinicCard`. Esto causa que la imagen no ocupe todo el contenedor de la tarjeta, dejando expuesto el fondo del contenedor padre (`bg-muted`), que en modo oscuro es un gris casi negro.

## 3. ANÁLISIS DE SUPABASE
- **Estado**: **Correcto**.
- La tabla `clinic_photos` contiene correctamente la columna `is_cover`.
- Las consultas ordenan adecuadamente.
- Las políticas RLS (`Public View`) permiten la lectura sin autenticación. 
- Las URLs de las imágenes son válidas. No es un problema de base de datos.

## 4. ANÁLISIS DE LÓGICA
- La selección de la imagen (`find(p => p.is_cover)`) es totalmente correcta.
- La delegación de `priority={index < 4}` en la lista es correcta para LCP (Largest Contentful Paint).
- El problema es netamente de interfaz (UI/React Lifecycle), no de lógica de negocio o de datos.

## 5. SOLUCIÓN RECOMENDADA (Pasos para implementación)

Para solucionar el problema definitivamente, se deben hacer los siguientes cambios en `src/components/ui/OptimizedImage.jsx`:

1. **Añadir Referencia a la Imagen**:
   Crear un `useRef` para la etiqueta `<img>` (`const imgRef = useRef(null)`).

2. **Verificar Caché en el Montaje**:
   Añadir un `useEffect` que verifique si la imagen ya está completa al montarse: