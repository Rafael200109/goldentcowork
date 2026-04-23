import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Loader2, Save, CheckCircle, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useClinicServices } from '@/hooks/useClinicServices';

const EditClinicServices = ({ clinicId }) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [selectedServiceIds, setSelectedServiceIds] = useState(new Set());
  const [originalServiceIds, setOriginalServiceIds] = useState(new Set());

  const { dentalServices, amenities, clinicServices, loading, error, refetch } = useClinicServices(clinicId);

  useEffect(() => {
    if (!loading && !error && clinicServices) {
      const currentIds = new Set(clinicServices.map(cs => cs.service_id).filter(Boolean));
      setSelectedServiceIds(currentIds);
      setOriginalServiceIds(new Set(currentIds));
    }
  }, [clinicServices, loading, error]);

  const toggleService = (serviceId) => {
    const newSelected = new Set(selectedServiceIds);
    if (newSelected.has(serviceId)) {
      newSelected.delete(serviceId);
    } else {
      newSelected.add(serviceId);
    }
    setSelectedServiceIds(newSelected);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const currentIds = Array.from(selectedServiceIds);
      const originalIds = Array.from(originalServiceIds);

      const toAdd = currentIds.filter(id => !originalServiceIds.has(id));
      const toRemove = originalIds.filter(id => !selectedServiceIds.has(id));

      if (toAdd.length === 0 && toRemove.length === 0) {
        setSaving(false);
        toast({ title: 'Sin cambios', description: 'No hay cambios para guardar.' });
        return;
      }

      // 1. Remove deselected services
      if (toRemove.length > 0) {
        const { error: deleteError } = await supabase
          .from('clinic_services')
          .delete()
          .eq('clinic_id', clinicId)
          .in('service_id', toRemove);
        
        if (deleteError) {
            if (deleteError.code === '42501') throw new Error('Error RLS: No tienes permisos para eliminar servicios de esta clínica.');
            throw deleteError;
        }
      }

      // 2. Add newly selected services
      if (toAdd.length > 0) {
        const allFlat = [...dentalServices, ...amenities];
        
        const servicesToInsert = toAdd.map(id => {
          const serviceDetails = allFlat.find(s => s.id === id);
          if (!serviceDetails) return null;
          return {
            clinic_id: clinicId,
            service_id: id,
            service_name: serviceDetails.name,
            service_icon: serviceDetails.icon_url,
            category: serviceDetails.category
          };
        }).filter(Boolean);

        if (servicesToInsert.length > 0) {
          const { error: insertError } = await supabase
            .from('clinic_services')
            .insert(servicesToInsert);
          
          if (insertError) {
             if (insertError.code === '42501') throw new Error('Error RLS: No tienes permisos para añadir servicios a esta clínica.');
             throw insertError;
          }
        }
      }

      setOriginalServiceIds(new Set(selectedServiceIds));
      
      toast({
        title: '¡Servicios actualizados!',
        description: 'Los cambios se han guardado correctamente.',
      });

      // Refetch to ensure sync
      refetch();

    } catch (error) {
      console.error('Error saving services:', error);
      toast({
        variant: 'destructive',
        title: 'Error al guardar',
        description: error.message || 'Ocurrió un error al actualizar los servicios.',
      });
    } finally {
      setSaving(false);
    }
  };

  const ServiceCard = ({ service, isSelected, onToggle }) => (
    <div 
      className={cn(
        "flex flex-col items-center justify-center p-3 border rounded-lg cursor-pointer transition-all h-full gap-2 hover:shadow-sm relative",
        isSelected ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:border-primary/50"
      )}
      onClick={() => onToggle(service.id)}
    >
      <div className="relative w-8 h-8 md:w-10 md:h-10">
        <img 
          src={service.icon_url} 
          alt={service.name}
          className="w-full h-full object-contain opacity-90"
        />
        {isSelected && (
          <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full p-0.5 shadow-sm">
            <CheckCircle className="w-3 h-3" />
          </div>
        )}
      </div>
      <span className="text-[10px] md:text-xs font-medium text-center leading-tight line-clamp-2">{service.name}</span>
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
      return (
        <Alert variant="destructive" className="my-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error de acceso</AlertTitle>
            <AlertDescription className="flex flex-col gap-2">
                <p>{error}</p>
                <Button variant="outline" size="sm" onClick={refetch} className="w-fit">Reintentar</Button>
            </AlertDescription>
        </Alert>
      );
  }

  return (
    <Card className="border shadow-sm">
      <CardHeader>
        <CardTitle>Servicios y Comodidades</CardTitle>
        <CardDescription>Selecciona los servicios que ofrece la clínica.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        <div>
          <h4 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Servicios Odontológicos</h4>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
            {dentalServices.map(service => (
              <ServiceCard 
                key={service.id} 
                service={service} 
                isSelected={selectedServiceIds.has(service.id)}
                onToggle={toggleService}
              />
            ))}
          </div>
        </div>

        <div>
           <h4 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Comodidades</h4>
           <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
            {amenities.map(service => (
              <ServiceCard 
                key={service.id} 
                service={service} 
                isSelected={selectedServiceIds.has(service.id)}
                onToggle={toggleService}
              />
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Guardar Servicios
          </Button>
        </div>

      </CardContent>
    </Card>
  );
};

export default EditClinicServices;