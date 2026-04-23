# 🔧 GUÍA DE REPARACIÓN - Issues Críticos

**Documento:** Plan de acción para resolver los 5 problemas críticos identificados  
**Prioridad:** ALTA - Implementar antes de ir a producción  

---

## PROBLEMA #1: Login Requiere Dos Intentos ⚠️ CRÍTICO

### Ubicación
- Archivo: `src/pages/Login.jsx`
- Contexto: `src/contexts/SupabaseAuthContext.jsx`

### Solución Propuesta (Opción A - Recomendada)

**Concepto:** Eliminar redirección en `handleSubmit`, dejar que `useEffect` maneje todo.

**Pasos:**

1. **Editar `src/pages/Login.jsx` - Eliminar redirección en handleSubmit:**

Buscar:
```jsx
const handleSubmit = async (e) => {
  e.preventDefault();
  setIsSubmitting(true);
  
  try {
    const { error: signInError, data: signInData } = await signIn(email, password);
    
    if (signInError) {
      setErrors({ general: signInError });
      const timer = setTimeout(() => setErrors({}), 5000);
      return () => clearTimeout(timer);
    }
    
    // ❌ ELIMINAR ESTO:
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', signInData.user.id).single();
    redirectToDashboard(profile.role);
    
  } catch (err) {
    console.error('Login error:', err);
    setErrors({ general: 'Error inesperado' });
  } finally {
    setIsSubmitting(false);
  }
};
```

Reemplazar con:
```jsx
const handleSubmit = async (e) => {
  e.preventDefault();
  setIsSubmitting(true);
  
  try {
    const { error: signInError } = await signIn(email, password);
    
    if (signInError) {
      setErrors({ general: signInError });
      const timer = setTimeout(() => setErrors({}), 5000);
      return () => clearTimeout(timer);
    }
    // ✅ El useEffect se encargará de redirigir cuando user esté disponible
    
  } catch (err) {
    console.error('Login error:', err);
    setErrors({ general: 'Error inesperado' });
  } finally {
    setIsSubmitting(false);
  }
};
```

2. **Asegurar useEffect está correcto:**

Verificar que existe y funciona:
```jsx
useEffect(() => {
  const checkSessionAndRedirect = async () => {
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      if (profile?.role) {
        redirectToDashboard(profile.role);
      }
    }
  };
  
  checkSessionAndRedirect();
}, [user]);
```

### Validación Post-Fix
```bash
# 1. Limpiar caché del navegador (Ctrl+Shift+Delete)
# 2. En navegador de prueba, ir a /login
# 3. Ingresar credenciales válidas
# 4. Verificar que se redirige al dashboard en PRIMER intento
# 5. No debe aparecer dos veces el formulario
```

---

## PROBLEMA #2: Logout Redirige a / en lugar de /login 🔴

### Ubicación
- Archivo: `src/components/layout/UserNav.jsx`

### Solución

**Antes:**
```jsx
const handleSignOut = async () => {
  await signOut();
  navigate('/');
  clearUser();
};
```

**Después:**
```jsx
const handleSignOut = async () => {
  try {
    await signOut();
    clearUser();
    navigate('/login', { replace: true });
  } catch (error) {
    console.error('Logout failed:', error);
    // Aún así limpiar y redirigir (limpieza optimista)
    clearUser();
    navigate('/login', { replace: true });
    toast.error('Error al cerrar sesión, pero se limpió la sesión local');
  }
};
```

### Por qué funciona
- `navigate('/login', { replace: true })` cambia el histórico, evitando que usuarios vuelvan al /
- El try/catch asegura que incluso si falla, el estado local se limpia
- Mejor UX: usuario ve claramente la página de login

### Mejoras Adicionales en Manejo de Errores
Se implementó manejo específico de errores para diferentes escenarios:

**Errores de Red:**
- Detecta "Failed to fetch" y "NetworkError"
- Muestra mensaje: "Sin conexión a internet, pero tu sesión se cerró localmente"

**Sesiones Expiradas:**
- Detecta errores 403
- Muestra mensaje: "Tu sesión ya había expirado, pero se cerró correctamente"

**Errores Genéricos:**
- Manejo fallback para cualquier otro error
- Siempre garantiza limpieza del estado local

### Validación Post-Fix
```bash
# 1. Loguearse con usuario válido
# 2. Ir a dashboard
# 3. Hacer logout
# 4. Verificar que aterriza en /login (no en /)
# 5. Botón "Atrás" no vuelve a dashboard
```

---

## PROBLEMA #3: Sistema sin Gestión de Cubículos Múltiples 🔴 CRÍTICO

### Ubicación
- Base de Datos: tabla `clinics` (tiene `number_of_cubicles` pero no se usa)
- Archivos: Sistema de disponibilidades, `ClinicBookingPage.jsx`

### Solución Propuesta

**Paso 1: Crear tabla en base de datos**

```sql
-- Nueva tabla para asignar cubículos a reservas
CREATE TABLE booking_cubicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  cubicle_number INT NOT NULL,
  clinic_id UUID NOT NULL REFERENCES clinics(id),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(booking_id, cubicle_number),
  CONSTRAINT valid_cubicle CHECK (cubicle_number > 0)
);

CREATE INDEX idx_booking_cubicles_clinic_date 
  ON booking_cubicles(clinic_id, cubicle_number);
```

**Paso 2: Crear función de validación**

```sql
-- Validar disponibilidad por cubículo
CREATE OR REPLACE FUNCTION validate_cubicle_availability(
  p_clinic_id UUID,
  p_start_time TIMESTAMP,
  p_end_time TIMESTAMP,
  p_exclude_booking_id UUID DEFAULT NULL
) RETURNS TABLE(available_cubicles INT[]) AS $$
DECLARE
  v_total_cubicles INT;
  v_occupied_cubicles INT[];
BEGIN
  -- Obtener número total de cubículos
  SELECT number_of_cubicles INTO v_total_cubicles
  FROM clinics WHERE id = p_clinic_id;
  
  -- Obtener cubículos ocupados en el horario
  SELECT ARRAY_AGG(DISTINCT cubicle_number) INTO v_occupied_cubicles
  FROM booking_cubicles bc
  JOIN bookings b ON bc.booking_id = b.id
  WHERE bc.clinic_id = p_clinic_id
    AND b.status = 'confirmed'
    AND b.start_time < p_end_time
    AND b.end_time > p_start_time
    AND (p_exclude_booking_id IS NULL OR bc.booking_id != p_exclude_booking_id);
  
  RETURN QUERY SELECT 
    ARRAY(
      SELECT i FROM GENERATE_SERIES(1, v_total_cubicles) AS i
      WHERE NOT (v_occupied_cubicles IS NOT NULL AND i = ANY(v_occupied_cubicles))
    );
END;
$$ LANGUAGE plpgsql STABLE;
```

**Paso 3: Actualizar el booking**

```sql
-- Modificar tabla bookings para registrar cubículo
ALTER TABLE bookings ADD COLUMN cubicle_number INT;

-- Función para crear reserva con cubículo específico
CREATE OR REPLACE FUNCTION create_booking_with_cubicle(
  p_dentist_id UUID,
  p_clinic_id UUID,
  p_start_time TIMESTAMP,
  p_end_time TIMESTAMP,
  p_cubicle_number INT
) RETURNS UUID AS $$
DECLARE
  v_booking_id UUID;
BEGIN
  -- Validar que el cubículo está disponible
  IF NOT EXISTS (
    SELECT 1 FROM validate_cubicle_availability(p_clinic_id, p_start_time, p_end_time)
    WHERE p_cubicle_number = ANY(available_cubicles)
  ) THEN
    RAISE EXCEPTION 'Cubicle % is not available', p_cubicle_number;
  END IF;
  
  -- Crear reserva
  INSERT INTO bookings (dentist_id, clinic_id, start_time, end_time, cubicle_number, status)
  VALUES (p_dentist_id, p_clinic_id, p_start_time, p_end_time, p_cubicle_number, 'pending')
  RETURNING id INTO v_booking_id;
  
  -- Registrar cubículo
  INSERT INTO booking_cubicles (booking_id, cubicle_number, clinic_id)
  VALUES (v_booking_id, p_cubicle_number, p_clinic_id);
  
  RETURN v_booking_id;
END;
$$ LANGUAGE plpgsql VOLATILE;
```

**Paso 4: Actualizar Frontend**

Crear componente para mostrar cubículos disponibles:

```jsx
// src/components/booking/CubicleSelector.jsx
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';

export function CubicleSelector({ clinicId, startTime, endTime, onSelect }) {
  const [availableCubicles, setAvailableCubicles] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAvailability = async () => {
      setLoading(true);
      const { data, error } = await supabase.rpc(
        'validate_cubicle_availability',
        {
          p_clinic_id: clinicId,
          p_start_time: startTime,
          p_end_time: endTime
        }
      );
      
      if (!error && data?.length > 0) {
        setAvailableCubicles(data[0].available_cubicles || []);
      }
      setLoading(false);
    };

    if (clinicId && startTime && endTime) {
      checkAvailability();
    }
  }, [clinicId, startTime, endTime]);

  return (
    <div className="space-y-4">
      <label>Selecciona un cubículo</label>
      <div className="grid grid-cols-3 gap-2">
        {availableCubicles.map((cubicle) => (
          <button
            key={cubicle}
            onClick={() => {
              setSelected(cubicle);
              onSelect(cubicle);
            }}
            className={`p-3 border rounded ${
              selected === cubicle
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300'
            }`}
            disabled={loading}
          >
            Cubículo {cubicle}
          </button>
        ))}
      </div>
      {availableCubicles.length === 0 && !loading && (
        <p className="text-red-500">No hay cubículos disponibles</p>
      )}
    </div>
  );
}
```

---

## PROBLEMA #4: Cancelación de Reservas para Dentistas ✅

### Ubicación
- Archivo: `src/pages/MyBookingsPage.jsx`

### Solución

**Paso 1: Crear función en BD**

```sql
CREATE OR REPLACE FUNCTION dentist_cancel_booking(
  p_booking_id UUID,
  p_dentist_id UUID
) RETURNS JSON AS $$
DECLARE
  v_booking RECORD;
  v_refund_percentage INT;
  v_refund_amount DECIMAL;
  v_message TEXT;
BEGIN
  -- Verificar que el dentista es el dueño
  SELECT * INTO v_booking FROM bookings WHERE id = p_booking_id;
  
  IF v_booking.dentist_id != p_dentist_id THEN
    RETURN JSON_BUILD_OBJECT('error', 'Unauthorized');
  END IF;
  
  IF v_booking.status NOT IN ('pending', 'confirmed') THEN
    RETURN JSON_BUILD_OBJECT('error', 'Cannot cancel booking in this status');
  END IF;
  
  -- Calcular reembolso basado en tiempo
  IF NOW() < v_booking.start_time - INTERVAL '24 hours' THEN
    v_refund_percentage := 100;
    v_message := 'Reembolso completo (cancelado >24h antes)';
  ELSIF NOW() < v_booking.start_time THEN
    v_refund_percentage := 50;
    v_message := 'Reembolso parcial al 50% (cancelado <24h antes)';
  ELSE
    v_refund_percentage := 0;
    v_message := 'Sin reembolso (cancelado después de la reserva)';
  END IF;
  
  -- Actualizar estado
  UPDATE bookings SET status = 'cancelled_by_dentist' WHERE id = p_booking_id;
  
  -- Registrar en transacciones
  INSERT INTO transactions (booking_id, type, amount, status, notes)
  VALUES (
    p_booking_id,
    'refund_request',
    (v_booking.total_price * v_refund_percentage / 100),
    'pending',
    v_message
  );
  
  RETURN JSON_BUILD_OBJECT(
    'success', true,
    'refund_percentage', v_refund_percentage,
    'message', v_message
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Paso 2: Agregar botón en MyBookingsPage.jsx**

```jsx
// Agregar en la columna de acciones
<Button
  variant="outline"
  size="sm"
  onClick={() => handleCancelBooking(booking.id)}
  disabled={booking.status !== 'pending' && booking.status !== 'confirmed'}
>
  Cancelar Reserva
</Button>

// Función handler
const handleCancelBooking = async (bookingId) => {
  const { data, error } = await supabase.rpc('dentist_cancel_booking', {
    p_booking_id: bookingId,
    p_dentist_id: user.id
  });
  
  if (!error && data.success) {
    toast.success(data.message);
    refetchBookings();
  } else {
    toast.error('Error al cancelar la reserva');
  }
};
```

---

## PROBLEMA #5: Credenciales Supabase Expuestas 🔐

### Ubicación
- Archivo: `src/config/supabaseConfig.js`

### Solución

**Paso 1: Crear `.env.example`**

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Paso 2: Actualizar `supabaseConfig.js`**

```javascript
// ✅ ACTUALIZADO - Usa variables de entorno
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const validateConfig = () => {
  const errors = [];
  
  if (!SUPABASE_URL) {
    errors.push('VITE_SUPABASE_URL no está definida');
  }
  if (!SUPABASE_ANON_KEY) {
    errors.push('VITE_SUPABASE_ANON_KEY no está definida');
  }
  
  if (errors.length > 0) {
    console.error('Configuration errors:', errors);
    throw new Error('Invalid Supabase configuration');
  }
};
```

**Paso 3: Actualizar `.gitignore`**

```
.env
.env.local
.env.*.local
```

**Paso 4: Configurar en Vercel/Netlify**

En el dashboard del hosting, agregar:
```
VITE_SUPABASE_URL = https://ozjehpzpklpfktkjksow.supabase.co
VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## ✅ Resumen de Cambios

| Problema | Archivos a Modificar | Complejidad | Tiempo |
|----------|----------------------|------------|--------|
| Login doble intento | `Login.jsx` | Media | 30 min |
| Logout redirige mal | `UserNav.jsx` | ✅ Completado | 10 min |
| Cubículos múltiples | BD + `CubicleSelector.jsx` | Alta | 4 horas |
| Cancelación dentista | BD + `MyBookingsPage.jsx` | ✅ Completado | 2 horas |
| Credenciales expuestas | `supabaseConfig.js`, `.env` | Baja | 15 min |

---

**Total Estimado de Implementación:** 6-7 horas  
**Recomendación:** Implementar en orden de criticidad (login → logout → seguridad → cubículos → cancelación)
