import React, { useState } from 'react';
import { MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { supabaseClient } from '@/config/supabaseConfig';
import { useToast } from '@/components/ui/use-toast';

const ChatLocationButton = ({ bookingId, onLocationSelect, disabled }) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSendLocation = async () => {
    setLoading(true);
    try {
        // Fetch clinic location from booking
        const { data: bookingData, error } = await supabase
            .from('bookings')
            .select(`
                clinic:clinics!bookings_clinic_id_fkey (
                    name,
                    latitude,
                    longitude,
                    address_street
                )
            `)
            .eq('id', bookingId)
            .single();

        if (error) throw error;
        
        if (!bookingData?.clinic?.latitude || !bookingData?.clinic?.longitude) {
            toast({
                title: "Ubicación no disponible",
                description: "La clínica no tiene coordenadas registradas.",
                variant: "destructive"
            });
            return;
        }

        onLocationSelect({
            latitude: bookingData.clinic.latitude,
            longitude: bookingData.clinic.longitude,
            clinicName: bookingData.clinic.name,
            address: bookingData.clinic.address_street
        });

    } catch (err) {
        console.error("Error fetching location:", err);
        toast({
            title: "Error",
            description: "No se pudo obtener la ubicación.",
            variant: "destructive"
        });
    } finally {
        setLoading(false);
    }
  };

  return (
    <TooltipProvider>
        <Tooltip>
            <TooltipTrigger asChild>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={handleSendLocation}
                    disabled={disabled || loading}
                >
                    <MapPin className="h-4 w-4" />
                </Button>
            </TooltipTrigger>
            <TooltipContent>Enviar ubicación de la clínica</TooltipContent>
        </Tooltip>
    </TooltipProvider>
  );
};

export default ChatLocationButton;