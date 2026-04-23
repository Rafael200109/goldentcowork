# ✅ CHECKLIST DE TESTING MANUAL

**Documento:** Testing manual paso-a-paso para validar que el sistema funciona  
**Tiempo Estimado:** 2-3 horas por sesión  
**Actualizado:** 22 de Abril de 2026

---

## 🚀 ANTES DE EMPEZAR

### Prerequisitos
- [ ] Acceso a URL de la aplicación (dev o staging)
- [ ] Cuenta de admin creada
- [ ] Base de datos con datos de prueba
- [ ] Navegador moderno (Chrome, Firefox, Safari)
- [ ] Limpiar caché antes de cada sesión (`Ctrl+Shift+Delete`)

### Datos de Prueba Necesarios
```
Usuario Dentista:
  Email: dentista@test.com
  Pass: TestPass123!

Usuario Anfitrión:
  Email: host@test.com
  Pass: TestPass123!

Usuario Admin:
  Email: admin@test.com
  Pass: TestPass123!

Clínicas de Prueba: 3+ creadas con cubículos (2-5 cada una)
```

---

## 🔵 GRUPO 1: GUEST (Usuario Sin Autenticación)

### G1.1 - Acceso a Inicio
- [ ] Ir a `https://[domain]/`
- [ ] Verificar que carga la página principal
- [ ] Ver botones "Iniciar Sesión" y "Registrarse"
- [ ] Ver sección de clínicas destacadas (si existen)
- [ ] Cargar imágenes correctamente
- [ ] Responsive en móvil

**Resultado Esperado:** ✅ Página visible y funcional

### G1.2 - Búsqueda de Clínicas Sin Login
- [ ] Ir a `/search-clinics`
- [ ] Verificar que se cargan clínicas publicadas
- [ ] **DEBE requerir login** cuando intente hacer click en reservar
- [ ] Filtros de búsqueda responden
- [ ] Mapas cargan correctamente (si están implementados)

**Resultado Esperado:** ✅ Búsqueda funciona, pero redirige a login al hacer acción

### G1.3 - Protección de Rutas
- [ ] Intentar acceder a `/dashboard` sin login
  - [ ] **DEBE redirigir a `/login`**
- [ ] Intentar acceder a `/admin` sin login
  - [ ] **DEBE redirigir a `/login`**
- [ ] Intentar acceder a `/my-bookings` sin login
  - [ ] **DEBE redirigir a `/login`**

**Resultado Esperado:** ✅ Todas las rutas protegidas redirigen a login

---

## 🟢 GRUPO 2: REGISTRO

### R2.1 - Validación de Formulario
- [ ] Ir a `/register`
- [ ] Dejar email vacío y presionar submit
  - [ ] **Mensaje de error debe aparecer**
- [ ] Ingresar email inválido (ej: `notanemail`)
  - [ ] **Error de validación**
- [ ] Ingresar contraseña < 6 caracteres
  - [ ] **Error de validación**
- [ ] Contraseña y confirmación no coinciden
  - [ ] **Error: "Las contraseñas no coinciden"**
- [ ] Dejar nombre vacío
  - [ ] **Mensaje de error**
- [ ] Dejar teléfono vacío
  - [ ] **Mensaje de error**

**Resultado Esperado:** ✅ Validaciones funcionan antes de enviar

### R2.2 - Registro Exitoso
- [ ] Ingresar datos válidos:
  ```
  Email: nuevousuario_[timestamp]@test.com
  Nombre: Test User
  Teléfono: +1 (234) 567-8900
  Contraseña: TestPass123!
  Rol: Dentista (default)
  ```
- [ ] Presionar "Registrarse"
- [ ] Ver mensaje de éxito o redirección

**Resultado Esperado:** ✅ Usuario creado, puede verificarse en BD

### R2.3 - Email de Confirmación
- [ ] Acceder a email de prueba (o panel de Supabase)
- [ ] Buscar email de confirmación
- [ ] Hacer click en enlace de verificación
- [ ] Verificar que `email_confirmed_at` se actualiza en BD

**Resultado Esperado:** ✅ Email verificado (puede no ser requerido según config)

---

## 🔐 GRUPO 3: LOGIN (PRUEBA DEL PROBLEMA CRÍTICO)

### L3.1 - Login de Primer Intento ⚠️ CRÍTICO
- [ ] Ir a `/login`
- [ ] Ingresar email y contraseña válidos
- [ ] **Presionar "Ingresar" UNA SOLA VEZ**
- [ ] **DEBE redirigir al dashboard en el PRIMER intento**
- [ ] **NO debe mostrar mensaje de error**
- [ ] **NO debe retornar al formulario de login**

**Resultado Esperado:** ✅ Login funciona en primer intento (si NO es así, es BUG CRÍTICO)

### L3.2 - Login con Credenciales Inválidas
- [ ] Email no registrado: `noadmin@test.com`
- [ ] Ver error: "El usuario no existe" o similar
- [ ] Contraseña incorrecta:
  ```
  Email: dentista@test.com
  Contraseña: wrongpass
  ```
- [ ] Ver error: "Contraseña incorrecta"
- [ ] Errores desaparecen después de 5 segundos

**Resultado Esperado:** ✅ Errores claros y desaparecen automáticamente

### L3.3 - Redirección Correcta
- [ ] Login como Dentista
  - [ ] **DEBE ir a `/home` (LoggedInHome)**
- [ ] Logout y Login como Anfitrión
  - [ ] **DEBE ir a `/clinic-dashboard` (o similar)**
- [ ] Logout y Login como Admin
  - [ ] **DEBE ir a `/admin-dashboard`**

**Resultado Esperado:** ✅ Cada rol va a su dashboard correspondiente

---

## 📅 GRUPO 4: RESERVAS

### B4.1 - Búsqueda de Clínica Disponible
- [ ] Login como dentista
- [ ] Ir a `/search-clinics`
- [ ] Buscar clínica con servicios (ej: "Limpieza")
- [ ] Ver resultados
- [ ] Hacer click en una clínica
- [ ] Ver detalles: fotos, servicios, calificaciones
- [ ] Ver calendario de disponibilidad

**Resultado Esperado:** ✅ Búsqueda y detalles funcionan

### B4.2 - Crear Reserva (SIN CUBÍCULOS MÚLTIPLES POR AHORA)
- [ ] En detalles de clínica, hacer click en "Reservar"
- [ ] Seleccionar fecha disponible
- [ ] Seleccionar hora disponible
- [ ] Verificar que muestra cubículos disponibles (si están implementados)
- [ ] Seleccionar cubículo
- [ ] Ingresar observaciones (si es campo opcional)
- [ ] Presionar "Siguiente"

**Resultado Esperado:** ✅ Formulario de reserva carga sin errores

### B4.3 - Selección de Método de Pago
- [ ] Ver opciones: "PayPal" y "Cardnet"
- [ ] Seleccionar PayPal
- [ ] Presionar "Pagar"
- [ ] **DEBE redirigir a sandbox de PayPal** (si está configurado)

**Resultado Esperado:** ✅ Pago inicia correctamente

### B4.4 - Confirmación Post-Pago
- [ ] Completar pago en PayPal (usar credenciales de sandbox)
- [ ] **DEBE volver a la app**
- [ ] Ver confirmación: "Reserva confirmada"
- [ ] Ver número de referencia
- [ ] Poder descargar factura en PDF

**Resultado Esperado:** ✅ Reserva se crea y aparece en "Mis Reservas"

### B4.5 - Verificar en BD
- [ ] Acceder a Supabase console
- [ ] Tabla `bookings`: debe haber registro nuevo
- [ ] Estado: `pending` o `confirmed` (según flujo de pago)
- [ ] Tabla `transactions`: debe haber pago registrado

**Resultado Esperado:** ✅ Datos en base de datos correctos

---

## 💬 GRUPO 5: CHAT

### C5.1 - Chat de Reserva
- [ ] Ir a `/my-bookings`
- [ ] Hacer click en una reserva confirmada
- [ ] Ver sección de chat
- [ ] Presionar textarea y escribir mensaje
- [ ] Enviar mensaje

**Resultado Esperado:** ✅ Mensaje aparece en chat

### C5.2 - Chat en Tiempo Real
- [ ] Abrir misma reserva en **dos navegadores** (dentista + anfitrión)
- [ ] Enviar mensaje desde navegador 1
- [ ] **DEBE aparecer inmediatamente en navegador 2** (sin recargar)

**Resultado Esperado:** ✅ Chat funciona en tiempo real (requiere Supabase Realtime)

### C5.3 - Adjuntos de Chat
- [ ] Buscar ícono de adjunto en chat
- [ ] Subir archivo PDF o imagen
- [ ] Verificar que aparece en chat
- [ ] Poder descargar el archivo

**Resultado Esperado:** ✅ Adjuntos funcionan (si está implementado)

---

## 🏠 GRUPO 6: PANEL DE ANFITRIÓN

### H6.1 - Acceso al Dashboard
- [ ] Login como anfitrión
- [ ] Ir a `/clinic-dashboard`
- [ ] Ver calendario con reservas
- [ ] Ver lista de reservas
- [ ] Ver ingresos totales

**Resultado Esperado:** ✅ Dashboard carga sin errores

### H6.2 - Gestión de Disponibilidad
- [ ] Buscar opción "Bloquear horario" o "Cerrado"
- [ ] Seleccionar fecha y rango de horas
- [ ] Bloquear un horario (ej: 12:00-13:00)
- [ ] Verificar que ese horario no está disponible para dentistas

**Resultado Esperado:** ✅ Bloqueos funcionan

### H6.3 - Cancelar Reserva (Anfitrión)
- [ ] Ir a una reserva confirmada
- [ ] Buscar botón "Cancelar"
- [ ] Hacer click
- [ ] Ingresar motivo de cancelación
- [ ] Confirmar

**Resultado Esperado:** ✅ Reserva se cancela, dentista recibe notificación

### H6.4 - Ver Ingresos
- [ ] En dashboard, ver sección de ingresos
- [ ] Verificar total acumulado
- [ ] Ver comisión (25% por defecto)
- [ ] Ver dinero disponible para pagar

**Resultado Esperado:** ✅ Cálculos correctos (ingresos - comisión)

---

## 👥 GRUPO 7: PANEL DE ADMIN

### A7.1 - Acceso y Navegación
- [ ] Login como admin
- [ ] Ir a `/admin-dashboard`
- [ ] Ver opciones:
  - [ ] Usuarios
  - [ ] Reservas
  - [ ] Pagos
  - [ ] Soporte
  - [ ] Reportes

**Resultado Esperado:** ✅ Panel de admin accesible

### A7.2 - Gestión de Usuarios
- [ ] Ir a "Usuarios"
- [ ] Buscar usuario por email
- [ ] Ver roles: dentista, anfitrión, admin, support, accountant
- [ ] Poder cambiar estado del usuario (activo/inactivo)
- [ ] Ver fecha de registro

**Resultado Esperado:** ✅ Gestión de usuarios funciona

### A7.3 - Gestión de Reservas
- [ ] Ir a "Reservas"
- [ ] Ver todas las reservas del sistema
- [ ] Filtrar por estado: pending, confirmed, cancelled, completed
- [ ] Poder cancelar una reserva pendiente
- [ ] Poder confirmar una reserva

**Resultado Esperado:** ✅ Operaciones en reservas funcionan

---

## 🔓 GRUPO 8: LOGOUT (PRUEBA DEL PROBLEMA #2)

### LO8.1 - Logout Correcto ⚠️ IMPORTANTE
- [ ] Estar logueado (en cualquier dashboard)
- [ ] Hacer click en avatar/menú de usuario
- [ ] Hacer click en "Cerrar Sesión"
- [ ] **DEBE ir a `/login` (NO a `/`)**
- [ ] Verificar que NO se puede volver al dashboard haciendo "Atrás"

**Resultado Esperado:** ✅ Logout funciona correctamente (si redirige a `/`, es BUG)

### LO8.2 - Sesión Limpiada
- [ ] Después del logout, abrir DevTools (F12)
- [ ] Ir a "Application" o "Storage"
- [ ] Verificar LocalStorage:
  - [ ] `sb-[project]-auth-token` **NO debe existir**
  - [ ] `goldent_supa_session_backup` **NO debe existir**
  - [ ] `auth_user_cache` **NO debe existir**
- [ ] Intentar ir a `/dashboard` directamente en URL
  - [ ] **DEBE redirigir a `/login`**

**Resultado Esperado:** ✅ Sesión completamente limpiada

---

## 📦 GRUPO 9: FACTURAS

### F9.1 - Generar Factura
- [ ] Ir a `/my-bookings` (como dentista)
- [ ] Hacer click en una reserva confirmada
- [ ] Buscar botón "Descargar Factura" o "PDF"
- [ ] Hacer click

**Resultado Esperado:** ✅ Se descarga PDF

### F9.2 - Validar Contenido de Factura
- [ ] Abrir PDF descargado
- [ ] Verificar que contiene:
  - [ ] Número de factura único
  - [ ] Datos del dentista (nombre, email)
  - [ ] Datos de la clínica (nombre, ubicación)
  - [ ] Detalles de reserva (fecha, hora, precio)
  - [ ] Total a pagar
  - [ ] Fecha de emisión

**Resultado Esperado:** ✅ Factura tiene toda la información

---

## ⭐ GRUPO 10: RESEÑAS

### RE10.1 - Crear Reseña
- [ ] Ir a perfil de una clínica visitada
- [ ] Buscar sección de reseñas
- [ ] Hacer click en "Dejar Reseña" o similar
- [ ] Dar calificación (1-5 estrellas)
- [ ] Escribir comentario
- [ ] Presionar "Enviar"

**Resultado Esperado:** ✅ Reseña aparece inmediatamente

### RE10.2 - Calificación se Actualiza
- [ ] Ir a perfil de clínica
- [ ] Ver promedio de calificaciones
- [ ] Verificar que incluye la nueva reseña
- [ ] Contar que el promedio es correcto

**Resultado Esperado:** ✅ Cálculo de promedio correcto

---

## 🔔 GRUPO 11: NOTIFICACIONES

### N11.1 - Notificación de Nueva Reserva
- [ ] Como dentista, crear una reserva
- [ ] Login como anfitrión **en otra pestaña**
- [ ] Verificar que aparece notificación (en sitio o por email)

**Resultado Esperado:** ✅ Notificación llega

### N11.2 - Notificación de Mensaje
- [ ] Crear chat con mensaje desde dentista
- [ ] Anfitrión debe recibir notificación
- [ ] Verificar ícono de notificación (punto rojo en campana, si existe)

**Resultado Esperado:** ✅ Notificaciones de chat funcionan

---

## 🔍 GRUPO 12: PERFORMANCE

### PE12.1 - Tiempo de Carga Inicial
- [ ] Abrir la app en incógnito
- [ ] Medir tiempo hasta que aparece contenido (< 3 segundos ideal)
- [ ] Abrir DevTools > Network
- [ ] Verificar que la página principal carga < 2 MB

**Resultado Esperado:** ✅ Carga rápida

### PE12.2 - Responsividad en Móvil
- [ ] Abrir la app en móvil (o F12 > Device Mode)
- [ ] Probar en tamaños: 320px, 768px, 1024px
- [ ] Verificar que:
  - [ ] Menú se adapta
  - [ ] Texto es legible
  - [ ] Botones son clickeables
  - [ ] Imágenes se cargan

**Resultado Esperado:** ✅ Funciona en todos los tamaños

---

## 🔒 GRUPO 13: SEGURIDAD BÁSICA

### S13.1 - No Exponer Credenciales
- [ ] Abrir DevTools > Sources
- [ ] Buscar archivo `supabaseConfig.js` o similar
- [ ] Verificar que **NO contiene Supabase URL o API Key hardcodeada**
- [ ] Si contiene, es **VULNERABILIDAD**

**Resultado Esperado:** ✅ Credenciales en variables de entorno

### S13.2 - RLS Policies Activas
- [ ] Acceder a Supabase Console
- [ ] Ir a Authentication > Policies
- [ ] Verificar que existen políticas en tablas:
  - [ ] `profiles`: protegida por RLS
  - [ ] `bookings`: protegida por RLS
  - [ ] `clinics`: protegida por RLS

**Resultado Esperado:** ✅ RLS activo en todas las tablas sensibles

---

## 📋 RESUMEN FINAL

### Cuándo Reportar como "FUNCIONAL"
- ✅ Todos los tests verdes (excepto lo que esté marcado como "NO IMPLEMENTADO")
- ✅ Login funciona en PRIMER intento
- ✅ Logout va a /login
- ✅ Reservas se crean correctamente
- ✅ Pagos procesan sin errores
- ✅ Chat funciona en tiempo real
- ✅ No hay errores en consola (F12)

### Cuándo Reportar como "CON ISSUES"
- ⚠️ Login requiere 2 intentos
- ⚠️ Logout redirige a /
- ⚠️ Errores no capturados en consola
- ⚠️ Reservas permiten overbooking
- ⚠️ Validaciones fácilmente bypasseables

### Cuándo NO Ir a Producción
- 🔴 Login no funciona
- 🔴 Pagos no funcionan
- 🔴 Credenciales expuestas
- 🔴 Base de datos error 500
- 🔴 Múltiples errores de JavaScript en consola

---

**Testing Checklist Completo**  
**Última Actualización:** 22 de Abril de 2026  
**Versión:** 1.0
