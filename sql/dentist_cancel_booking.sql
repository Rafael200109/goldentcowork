-- Función para que dentistas cancelen sus propias reservas con lógica de reembolso
-- Se ejecuta desde el cliente con supabase.rpc('dentist_cancel_booking', { p_booking_id: bookingId })

CREATE OR REPLACE FUNCTION dentist_cancel_booking(p_booking_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_booking RECORD;
    v_hours_until_start INTEGER;
    v_refund_percentage INTEGER := 0;
    v_message TEXT;
BEGIN
    -- Obtener la reserva y verificar permisos
    SELECT b.*, p.role INTO v_booking
    FROM bookings b
    JOIN profiles p ON b.dentist_id = p.id
    WHERE b.id = p_booking_id;

    IF NOT FOUND THEN
        RETURN JSON_BUILD_OBJECT('error', 'Reserva no encontrada');
    END IF;

    -- Verificar que sea un dentista cancelando su propia reserva
    IF v_booking.role != 'dentist' THEN
        RETURN JSON_BUILD_OBJECT('error', 'Solo dentistas pueden cancelar reservas');
    END IF;

    -- Verificar que la reserva esté en estado confirmado
    IF v_booking.status != 'confirmed' THEN
        RETURN JSON_BUILD_OBJECT('error', 'Cannot cancel booking in this status');
    END IF;

    -- Calcular horas hasta el inicio
    v_hours_until_start := EXTRACT(EPOCH FROM (v_booking.start_time - NOW())) / 3600;

    -- Lógica de reembolso
    IF v_hours_until_start >= 24 THEN
        v_refund_percentage := 100;
        v_message := 'Reembolso completo (cancelado >24h antes)';
    ELSIF v_hours_until_start >= 0 THEN
        v_refund_percentage := 50;
        v_message := 'Reembolso parcial al 50% (cancelado <24h antes)';
    ELSE
        v_refund_percentage := 0;
        v_message := 'Sin reembolso (cancelado después de la reserva)';
    END IF;

    -- Actualizar el estado de la reserva
    UPDATE bookings
    SET status = 'cancelled_by_dentist',
        updated_at = NOW(),
        cancellation_details = JSON_BUILD_OBJECT(
            'cancelled_by', 'dentist',
            'cancelled_at', NOW(),
            'refund_percentage', v_refund_percentage,
            'hours_until_start', v_hours_until_start
        )
    WHERE id = p_booking_id;

    -- Aquí podrías agregar lógica adicional para procesar el reembolso
    -- dependiendo de tu sistema de pagos (PayPal, Cardnet, etc.)

    RETURN JSON_BUILD_OBJECT(
        'success', true,
        'message', v_message,
        'refund_percentage', v_refund_percentage
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN JSON_BUILD_OBJECT('error', SQLERRM);
END;
$$;