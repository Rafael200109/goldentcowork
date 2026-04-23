# REPORTE DE INVESTIGACIÓN: FLUJO DE AUTENTICACIÓN Y ERROR DE DOBLE INTENTO

**Fecha de Análisis:** 18 de Marzo, 2026
**Objetivo:** Identificar la causa raíz por la cual los usuarios deben ingresar sus credenciales dos veces para lograr iniciar sesión.

---

## 1. Análisis del Flujo de Autenticación (Línea por Línea)

### A. Capa de Interfaz (`src/pages/Login.jsx`)
1. El usuario ingresa email y contraseña y envía el formulario (`handleSubmit`).
2. Se validan los campos localmente. Si pasa, se activa `setIsSubmitting(true)`.
3. Se llama a la función `signIn(email, password)` proveniente de `SupabaseAuthContext`.
4. **Vulnerabilidad de Condición de Carrera (Race Condition):**
   - Si `signIn` es exitoso, el bloque de código en `handleSubmit` intenta obtener el perfil del usuario: 
     `const { data: profile } = await supabase.from('profiles').select('role').eq('id', signInData.user.id).single();`
   - Simultáneamente, el estado global `user` se actualiza. Esto dispara el `useEffect` en la línea 32:
     `const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();`
   - **Resultado:** Se disparan dos peticiones idénticas a la base de datos de manera simultánea para obtener el rol del usuario e intentar redirigirlo.

### B. Capa de Contexto de Autenticación (`src/contexts/SupabaseAuthContext.jsx`)
1. La función `signIn` ejecuta `supabase.auth.signInWithPassword`.
2. Si es exitoso, guarda datos en una caché local (`storageManager.saveAuthCache(data.user)`).
3. **Manejo de Sesión Redundante:** Existe un sistema de respaldo manual de sesión (`SESSION_KEY = 'goldent_supa_session_backup'`) que intercepta los cambios de estado (`onAuthStateChange`).
4. Cuando el usuario inicia sesión, el evento `SIGNED_IN` se dispara, lo que ejecuta `handleSession(currentSession)`, actualizando el estado `user` y guardando el respaldo manual en localStorage.

### C. Capa de Contexto de Usuario (`src/contexts/UserContext.jsx`)
1. Al actualizarse el `user` tras el login exitoso, `UserContext` también reacciona.
2. Llama a `getProfile(user.id)`.
3. Este contexto implementa un mecanismo de reintentos recursivos (hasta 3 veces) y una verificación contra "Race Conditions" usando `loadingIdRef`.

---

## 2. Hipótesis Principales del Comportamiento "Dos Intentos"

Basado en la evidencia del código, el problema de requerir dos intentos de inicio de sesión se debe a una combinación de factores de asincronía y manejo del estado:

### Hipótesis A: Colisión de Redirecciones (Race Condition)
Cuando el usuario presiona "Ingresar" por primera vez, el login en Supabase **sí es exitoso**. Sin embargo, en `Login.jsx`, tanto el `handleSubmit` como el `useEffect` intentan consultar la tabla `profiles` y ejecutar `redirectToDashboard` al mismo tiempo. 
Si el componente se desmonta por la primera redirección antes de que termine la segunda petición asíncrona, React puede abortar el flujo y dejar al usuario en la página de login (aparentemente sin haber ingresado), aunque su sesión ya está activa en el contexto. Al intentar por segunda vez, el `useEffect` (que escucha la sesión que ya está activa en caché) o el nuevo intento de login logran redirigir correctamente.

### Hipótesis B: Problemas de Sincronización de Caché y Estado
El sistema utiliza una caché optimista (`storageManager.saveAuthCache`) y un respaldo de sesión manual (`goldent_supa_session_backup`) en paralelo con la sesión nativa de Supabase. 
1. Primer intento: `signIn` se ejecuta, guarda en caché. El estado global `user` de React tarda un ciclo de renderizado en actualizarse mediante el listener `onAuthStateChange`.
2. El código asume que el estado ya está disponible. Si hay una desincronización entre la escritura de la caché local y la respuesta de Supabase, el UI puede lanzar un falso error o detener el flujo.
3. Segundo intento: Al hacer clic de nuevo, el estado previo ya está "caliente" (persistido en localStorage) y el listener de Supabase detecta la sesión inmediatamente, saltándose las demoras de red.

### Hipótesis C: Entorno sin Integración Completada (Supabase Desconectado)
Dado que el entorno actual indica que **Supabase no está conectado formalmente** (falta de variables de entorno o inicialización fallida del cliente), el primer intento falla por timeout o error de red. El componente atrapa el error y detiene la carga. El segundo intento podría estar dependiendo de datos cacheados residuales (`storageManager.getAuthCache()`) que hacen creer al sistema que hay un usuario válido (por la lógica optimista en la línea 157 de `SupabaseAuthContext.jsx`), permitiendo el paso.

---

## 3. Explicación Técnica y Ubicación del Problema

El problema central reside en la **duplicación de responsabilidades de redirección** en `src/pages/Login.jsx`.

**Ubicación Exacta:**
Archivo: `src/pages/Login.jsx`
Líneas conflictivas:
1. `useEffect` (Líneas 31-40): Escucha cambios en `user` e intenta redirigir.
2. `handleSubmit` (Líneas 82-87): Espera a `signIn`, consulta perfil e intenta redirigir.

**Explicación:**
El patrón actual mezcla un enfoque "imperativo" (redirigir inmediatamente después de hacer la petición API en el botón) con un enfoque "reactivo" (redirigir escuchando los cambios en el estado global `user`). Cuando ambos ocurren a la vez, se generan conflictos en el ciclo de vida de React (desmontar componentes mientras hay promesas pendientes), lo que a menudo trunca la primera redirección.

---

## 4. Recomendaciones para Investigación Adicional / Solución Futura

*Nota: No se han implementado cambios según las instrucciones, estas son solo sugerencias.*

1. **Unificar la lógica de redirección:** Eliminar la consulta de base de datos (`supabase.from('profiles')...`) y la redirección dentro de `handleSubmit`. Confiar únicamente en el enfoque reactivo: dejar que el `useEffect` detecte que `user` ya no es nulo y procese la redirección, o viceversa (manejar todo en el submit y quitar el `useEffect`).
2. **Delegar el rol a UserContext:** En lugar de consultar `profiles` en `Login.jsx`, utilizar el estado `profile` que ya provee `UserContext`, reduciendo las llamadas a la base de datos de 3 (Login Submit, Login Effect, UserContext) a 1.
3. **Verificar Conexión:** Asegurar que las variables de entorno de Supabase estén correctamente configuradas, ya que errores de red intermitentes forzarán el uso agresivo de las funciones de reintento.