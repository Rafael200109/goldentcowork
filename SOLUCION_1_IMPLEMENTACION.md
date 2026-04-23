# 🔧 GUÍA PASO A PASO: Solución 1 - Cambiar "From" en Supabase

**Tiempo Total:** 5 minutos  
**Resultado:** Los correos de reset y verificación llegarán a bandeja principal ✅

---

## 📋 PASO 1: Acceder a Supabase Dashboard

1. Ve a [https://app.supabase.com](https://app.supabase.com)
2. Inicia sesión con tu cuenta
3. Selecciona tu proyecto "goldent" (o como lo tengas nombrado)

**Resultado esperado:** Ves el dashboard principal del proyecto

---

## 📋 PASO 2: Navegar a Email Templates

Busca en el menú izquierdo:

```
Authentication (o Auth)
    ↓
Email Templates
```

Si no ves "Email Templates", haz esto:
1. Abre el menú lateral (≡)
2. Busca "Authentication"
3. Dentro verás "Email Templates"

**Ruta exacta:** Dashboard → Authentication → Email Templates

**Resultado esperado:** Ves una lista de plantillas:
- Confirm signup
- Invite
- Magic Link
- Change Email
- Reset Password

---

## 📋 PASO 3: Editar "Reset Password"

1. Busca en la lista: **"Reset Password"**
2. Haz clic en esa fila para abrirla
3. Se abrirá un editor de plantilla HTML

**Resultado esperado:** Ves el código HTML del correo de reset

---

## 📋 PASO 4: Buscar y Cambiar el "From"

En el editor, busca la sección de configuración (al inicio). Verás algo como:

```
From: <noreply@goldent.com>
```

o 

```
From: "GolDent" <noreply@goldent.com>
```

### ❌ CAMBIAR ESTO:
```
noreply@goldent.com
```

### ✅ POR ESTO:
```
noreply@mail.supabase.goldent.com
```

**Opción A - Sin nombre (recomendado):**
```
noreply@mail.supabase.goldent.com
```

**Opción B - Con nombre visible al usuario:**
```
"GolDent Soporte" <noreply@mail.supabase.goldent.com>
```

---

## 📋 PASO 5: Guardar los cambios

1. Una vez hayas actualizado el "From"
2. Busca el botón "Save" o "Guardar" 
3. Haz clic para guardar

**Resultado esperado:** Ves un mensaje verde de confirmación

---

## 📋 PASO 6: Repetir para "Confirm Signup"

Haz exactamente lo mismo para el correo de verificación:

1. Vuelve a "Email Templates"
2. Abre **"Confirm signup"**
3. Busca y cambia el "From" de:
   ```
   noreply@goldent.com
   ```
   a:
   ```
   noreply@mail.supabase.goldent.com
   ```
4. Guarda los cambios

---

## 📋 PASO 7: Repetir para otros correos (Opcional)

Si quieres ser consistente, haz lo mismo para:
- **"Magic Link"** - Para login sin contraseña
- **"Change Email"** - Para cambios de correo
- **"Invite"** - Para invitaciones

Busca todos los "From:" y cámbialos al mismo dominio.

---

## ✅ VERIFICACIÓN INMEDIATA (5 minutos después)

Una vez hayas guardado los cambios:

### Test 1: Reset de Contraseña
```
1. Ve a http://tu-app.com/forgot-password
2. Ingresa tu correo
3. Revisa BANDEJA PRINCIPAL (no spam)
4. El correo debe estar ahí
5. Copia el enlace y verifica que funciona
```

### Test 2: Nuevo Registro (Verificación)
```
1. Ve a http://tu-app.com/register
2. Crea una cuenta nueva
3. Revisa bandeja principal
4. El correo de verificación debe estar ahí
5. El botón de confirmación debe funcionar
```

---

## 🎯 Qué Esperar Después

### Inmediatamente (0-5 min)
- ✅ Los nuevos correos de reset llegarán a bandeja principal
- ✅ Los nuevos correos de verificación llegarán a bandeja principal
- ✅ El remitente mostrará `noreply@mail.supabase.goldent.com`

### Dentro de 24 horas
- ✅ Gmail mejora su reputación de tu dominio
- ✅ Menos posibilidad de spam futuro
- ✅ Mejor deliverability en general

---

## 🆘 Si Algo No Funciona

### "No encuentro Email Templates"
```
Solución: Ve a Authentication → Settings
En la sección "Email" busca "Email Templates"
O presiona Ctrl+K y busca "email template"
```

### "El campo 'From' está grisado/no se puede editar"
```
Solución: Scroll hacia arriba en la plantilla
El campo "From" debe estar al inicio
Si está bloqueado, contacta a Supabase
```

### "Cambié pero los correos siguen yendo a spam"
```
Solución 1: Espera 24 horas (propagación de DNS)
Solución 2: Si no funciona, implementa Solución 2 (SPF/DKIM)
Documento: EMAIL_AUTHENTICATION_ANALYSIS.md
```

---

## 📝 Resumen Rápido

| Paso | Acción |
|------|--------|
| 1 | Accede a Supabase Dashboard |
| 2 | Ve a Authentication → Email Templates |
| 3 | Abre "Reset Password" |
| 4 | Cambia "From" a `noreply@mail.supabase.goldent.com` |
| 5 | Guarda |
| 6 | Repite para "Confirm signup" |
| 7 | Prueba en 5 minutos |

---

## ✅ Estado Final

Una vez completes todos los pasos:

✅ **Reset Password:** Bandeja principal (no spam)  
✅ **Verify Email:** Bandeja principal (no spam)  
✅ **Otros correos:** Consistentes con mismo "From"  
✅ **Reputación:** Mejora automáticamente  

**Problema resuelto.** 🎉