# Informe de Estado: Funcionalidad de Cancelación de Reservas

Este documento detalla el estado actual de la lógica de cancelaciones en el sistema basado en el análisis del código fuente y las funciones de base de datos disponibles.

## 1. Resumen Ejecutivo
La funcionalidad de cancelación está **parcialmente implementada**.
- **Anfitriones:** ✅ Totalmente funcional para reservas confirmadas.
- **Administradores:** ✅ Funcional para rechazar/cancelar reservas pendientes.
- **Odontólogos:** ❌ **No implementada** (No pueden cancelar desde su panel).

---

## 2. Análisis Detallado por Rol

### A. Odontólogos (Usuarios que reservan)
*   **Estado Actual:** No disponible.
*   **Interfaz (UI):**
    *   Archivo: `src/pages/MyBookingsPage.jsx`
    *   Situación: Visualizan sus reservas y facturas, pero **no existe ningún botón o acción para cancelar** una reserva confirmada o pendiente.
*   **Backend (Base de Datos):**
    *   No existe una función almacenada específica (ej. `dentist_cancel_booking`) que maneje la lógica de reembolso o penalización para el usuario.
    *   La función genérica `cancel_booking` existente restringe su uso a `admin` o `accountant`.
*   **Impacto:** Los odontólogos actualmente deben contactar a soporte o al anfitrión para solicitar una cancelación.

### B. Anfitriones (Dueños de Clínicas)
*   **Estado Actual:** Implementado.
*   **Interfaz (UI):**
    *   Archivo: `src/components/clinic-dashboard/BookingDetailsSheet.jsx`
    *   Acción: Botón "Cancelar Reserva" visible para reservas en estado `confirmed`.
*   **Backend (Base de Datos):**
    *   Función: `host_cancel_booking(p_booking_id)`
    *   Permisos: Verifica estrictamente que el usuario sea el dueño de la clínica (`host_id`).
*   **Flujo de Cancelación:**
    1.  El estado de la reserva cambia a `cancelled_by_host`.
    2.  El estado de la transacción cambia a `refund_requested`. **IMPORTANTE:** Esto no reembolsa el dinero automáticamente; alerta a un administrador para que realice el reembolso manual.
    3.  Se crea una notificación en sistema para el odontólogo.

### C. Administradores
*   **Estado Actual:** Implementado (Enfoque en Pagos Pendientes).
*   **Interfaz (UI):**
    *   Archivo: `src/components/admin/BookingConfirmationActions.jsx`
    *   Acción: Opción "Cancelar Reserva" en el menú de acciones.
*   **Backend (Base de Datos):**
    *   Función: `cancel_pending_booking` o `cancel_booking`.
*   **Flujo:**
    *   Diseñado principalmente para limpiar reservas manuales (Cardnet) que no se pagaron o para moderación.
    *   Al cancelar una reserva pendiente, la transacción simplemente se cancela (sin flujo de dinero real que reembolsar).

---

## 3. Matriz de Permisos y Acciones

| Rol | Puede Cancelar | Tipo de Reserva | Resultado Financiero | Notificación Enviada |
| :--- | :---: | :--- | :--- | :---: |
| **Odontólogo** | **NO** | N/A | N/A | N/A |
| **Anfitrión** | **SÍ** | Confirmada | Solicitud de Reembolso (`refund_requested`) | Sí (al Odontólogo) |
| **Admin** | **SÍ** | Pendiente / Cualquiera | Cancelación Directa | Sí (al Usuario) |

## 4. Recomendaciones
Para completar la funcionalidad, se sugiere:
1.  Crear una función SQL `dentist_cancel_booking` que aplique políticas de cancelación (ej. reembolso total si es >24h antes).
2.  Implementar el botón "Cancelar" en `MyBookingsPage.jsx`.