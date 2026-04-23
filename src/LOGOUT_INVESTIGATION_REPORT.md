# Reporte de Investigación y Análisis de Logout

## A. Revisión del Contexto de Autenticación (`SupabaseAuthContext.jsx`)
**Hallazgos:**
- La función `signOut` utilizaba `supabase.auth.signOut()` correctamente dentro de un bloque `try/catch`.
- Se limpiaba la caché usando `storageManager.clearAuthCache()`.
- **Problema detectado:** El estado de `user` y `session` dependía puramente del listener `onAuthStateChange`. Si la red fallaba o había un retraso, la UI podía mostrar un estado inconsistente temporalmente.
- **Problema detectado:** No había un "fallback" de limpieza de estado si la llamada al servidor de Supabase fallaba (ej. usuario sin internet al intentar salir).

## B. Revisión de Almacenamiento Local (`storageManager.js`)
**Hallazgos:**
- El proyecto guarda explícitamente `auth_user_cache` y `goldent_supa_session_backup` en `localStorage`.
- Supabase maneja internamente sus propios tokens (generalmente `sb-[project]-auth-token`).
- **Problema detectado:** `clearAuthCache` removía las llaves explícitas, pero sería ideal asegurar una limpieza profunda en caso de que queden rastros de otras implementaciones o intentos fallidos.

## C. Revisión de Componentes de Logout (`UserNav.jsx`)
**Hallazgos:**
- El botón de cierre de sesión llama a `handleSignOut()`.
- Invoca `signOut()` del contexto y `clearUser()` del contexto de usuario.
- **Problema detectado:** Redirigía a la raíz (`/`) usando `navigate('/')` en lugar de la vista de login (`/login`) como se especificó en los requerimientos.
- **Problema detectado:** No manejaba errores de la promesa `signOut()` explícitamente en la UI (no había un bloque `try/catch` envolviendo la acción del botón).

## D. Revisión de Redirección y Rutas
**Hallazgos:**
- `ProtectedRoute.jsx` maneja bien la validación: si `!user` (y no está cargando), redirige a `/login`.
- Sin embargo, debido al problema en `UserNav.jsx`, la experiencia de usuario los enviaba primero a `/` (GuestHome) en lugar de la pantalla de login dedicada tras cerrar sesión manualmente.

## E. Revisión de Supabase Auth
**Hallazgos:**
- Implementación estándar correcta usando promesas asíncronas.
- El listener de eventos (`SIGNED_OUT`) captura eventos globales (ej. cierre de sesión en otra pestaña), lo cual es una buena práctica.

## F. Identificación de Problemas y Plan de Acción
1. **Severidad Media:** Redirección incorrecta a `/` en lugar de `/login` después del logout manual.
2. **Severidad Baja:** Falta de manejo de errores en la UI al fallar el logout (falta de `try/catch` en `UserNav.jsx`).
3. **Severidad Baja:** Limpieza de estado optimista faltante en `SupabaseAuthContext.jsx` antes de esperar la respuesta del listener.

**Soluciones Propuestas:**
- Modificar `UserNav.jsx` para redirigir a `/login` con `replace: true`.
- Implementar limpieza optimista e incondicional en el `catch` de `signOut` para asegurar que el usuario no quede "atrapado" logueado si hay fallos de red.