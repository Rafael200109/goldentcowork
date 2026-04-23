import React, { useMemo, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { usePublishClinic } from '@/contexts/PublishClinicContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { FiHome, FiAlertCircle, FiLoader, FiCheckCircle, FiInfo, FiClipboard, FiGrid } from 'react-icons/fi';
import { cn } from '@/lib/utils';
import ImageUploader from '@/components/publish/ImageUploader';
import LocationPicker from '@/components/publish/LocationPicker';
import { useClinicServices } from '@/hooks/useClinicServices';
import RichTextEditor from '@/components/ui/RichTextEditor';

const MIN_PHOTOS = 5;

const PublishClinic = () => {
  const { toast } = useToast();
  const { clinicData, updateClinicData, publishClinic, loading, resetClinicData } = usePublishClinic();
  const { dentalServices, amenities, loading: loadingServices } = useClinicServices();
  const [minHoursError, setMinHoursError] = useState('');
  const [cubiclesError, setCubiclesError] = useState('');

  useEffect(() => {
    // Hardcode clinic_type so it's not visible
    if (!clinicData.type || clinicData.type !== 'clinic') {
        updateClinicData({ type: 'clinic' });
    }
    if (clinicData.min_hours_booking === undefined) {
      updateClinicData({ min_hours_booking: 4 });
    }
    if (clinicData.number_of_cubicles === undefined) {
      updateClinicData({ number_of_cubicles: 1 });
    }
    if (clinicData.policies_html === undefined) {
      updateClinicData({ policies_html: '' });
    }
  }, []);

  const isFormValid = useMemo(() => {
    const hasName = typeof clinicData.name === 'string' && clinicData.name.trim().length > 0;
    
    const plainTextDesc = typeof clinicData.description === 'string' ? clinicData.description.replace(/<[^>]*>?/gm, '').trim() : '';
    const hasDescription = plainTextDesc.length > 0;

    const hasAddressStreet = typeof clinicData.address_street === 'string' && clinicData.address_street.trim().length > 0;
    const hasAddressProvince = typeof clinicData.address_province === 'string' && clinicData.address_province.trim().length > 0;
    const hasAddressCity = typeof clinicData.address_city === 'string' && clinicData.address_city.trim().length > 0;
    const hasPhotos = Array.isArray(clinicData.photos) && clinicData.photos.length >= MIN_PHOTOS;
    const hasPrice = !isNaN(parseFloat(clinicData.price_per_hour)) && parseFloat(clinicData.price_per_hour) > 0;
    const hasMinHours = !isNaN(parseFloat(clinicData.min_hours_booking)) && parseFloat(clinicData.min_hours_booking) >= 4;
    const hasCubicles = !isNaN(parseFloat(clinicData.number_of_cubicles)) && parseFloat(clinicData.number_of_cubicles) >= 1 && parseFloat(clinicData.number_of_cubicles) <= 50;
    const hasLatitude = typeof clinicData.latitude === 'number';
    const hasLongitude = typeof clinicData.longitude === 'number';
    
    const plainTextPolicies = clinicData.policies_html ? clinicData.policies_html.replace(/<[^>]*>?/gm, '').trim() : '';
    const hasValidPolicies = plainTextPolicies.length <= 2000;

    return hasName && hasDescription && hasAddressStreet && 
           hasAddressProvince && hasAddressCity && hasPhotos && 
           hasPrice && hasMinHours && hasCubicles && hasLatitude && hasLongitude && hasValidPolicies;
  }, [clinicData]);

  const getMissingFieldsMessage = () => {
    const missing = [];
    if (!clinicData.name?.trim()) missing.push("Título");
    
    const plainTextDesc = typeof clinicData.description === 'string' ? clinicData.description.replace(/<[^>]*>?/gm, '').trim() : '';
    if (!plainTextDesc) missing.push("Descripción");

    if ((clinicData.photos?.length || 0) < MIN_PHOTOS) missing.push(`Fotos (faltan ${MIN_PHOTOS - (clinicData.photos?.length || 0)})`);
    if (!clinicData.address_street?.trim()) missing.push("Dirección");
    if (!clinicData.address_province?.trim()) missing.push("Provincia");
    if (!clinicData.address_city?.trim()) missing.push("Ciudad");
    if (typeof clinicData.latitude !== 'number' || typeof clinicData.longitude !== 'number') missing.push("Ubicación en mapa");
    if (Number(clinicData.price_per_hour) <= 0) missing.push("Precio");
    if (Number(clinicData.min_hours_booking) < 4) missing.push("Mínimo de horas (debe ser >= 4)");
    if (Number(clinicData.number_of_cubicles) < 1 || Number(clinicData.number_of_cubicles) > 50) missing.push("Número de cubículos (1-50)");
    
    const plainTextPolicies = clinicData.policies_html ? clinicData.policies_html.replace(/<[^>]*>?/gm, '').trim() : '';
    if (plainTextPolicies.length > 2000) missing.push("Políticas (excede límite de 2000 caracteres)");
    
    return missing.length ? `Falta: ${missing.join(", ")}` : null;
  };

  const handlePublish = async () => {
    if (!clinicData.min_hours_booking || Number(clinicData.min_hours_booking) < 4) {
      toast({ title: "Error de validación", description: "El mínimo de horas debe ser 4 o mayor", variant: "destructive" });
      setMinHoursError('El mínimo de horas debe ser 4 o mayor');
      return;
    }

    if (!clinicData.number_of_cubicles || Number(clinicData.number_of_cubicles) < 1 || Number(clinicData.number_of_cubicles) > 50) {
      toast({ title: "Error de validación", description: "El número de cubículos debe ser un entero entre 1 y 50.", variant: "destructive" });
      setCubiclesError('El número de cubículos debe ser un entero entre 1 y 50.');
      return;
    }

    const plainTextPolicies = clinicData.policies_html ? clinicData.policies_html.replace(/<[^>]*>?/gm, '').trim() : '';
    
    if (clinicData.policies_html && !plainTextPolicies) {
        toast({ title: "Error de validación", description: "El contenido de las políticas no puede estar vacío si agregas formato.", variant: "destructive" });
        return;
    }

    if (plainTextPolicies.length > 2000) {
      toast({ title: "Error de validación", description: "Las políticas no deben exceder 2000 caracteres.", variant: "destructive" });
      return;
    }

    if (!isFormValid) {
      toast({ title: "Formulario Incompleto", description: getMissingFieldsMessage() || "Por favor, completa todos los campos requeridos.", variant: "destructive" });
      return;
    }
    
    // Ensure clinic_type is set properly before submission
    updateClinicData({ type: 'clinic' });
    await publishClinic();
  };

  const handleMinHoursChange = (e) => {
    let val = e.target.value.replace('-', '');
    updateClinicData({ min_hours_booking: val });
    
    if (val === '') {
      setMinHoursError('El mínimo de horas es requerido');
    } else if (Number(val) < 4) {
      setMinHoursError('El mínimo de horas debe ser 4 o mayor');
    } else {
      setMinHoursError('');
    }
  };

  const handleMinHoursBlur = () => {
    if (!clinicData.min_hours_booking || Number(clinicData.min_hours_booking) < 4) {
      updateClinicData({ min_hours_booking: 4 });
      setMinHoursError('');
    }
  };

  const handleCubiclesChange = (e) => {
    const val = e.target.value;
    updateClinicData({ number_of_cubicles: val });

    if (val === '') {
      setCubiclesError('El número de cubículos es requerido');
    } else {
      const num = parseInt(val, 10);
      if (isNaN(num) || num < 1 || num > 50) {
        setCubiclesError('Debe ser entre 1 y 50.');
      } else {
        setCubiclesError('');
      }
    }
  };

  const handleCubiclesBlur = () => {
    const num = parseInt(clinicData.number_of_cubicles, 10);
    if (isNaN(num) || num < 1) {
      updateClinicData({ number_of_cubicles: 1 });
      setCubiclesError('');
    } else if (num > 50) {
      updateClinicData({ number_of_cubicles: 50 });
      setCubiclesError('');
    }
  };

  const handleServiceToggle = (serviceId) => {
    const currentServices = clinicData.selectedServices || [];
    const newServices = currentServices.includes(serviceId)
      ? currentServices.filter(id => id !== serviceId)
      : [...currentServices, serviceId];
    updateClinicData({ selectedServices: newServices });
  };

  const ServiceCard = ({ service, isSelected, onToggle }) => (
    <div 
      className={cn(
        "flex flex-col items-center justify-center p-3 border rounded-lg cursor-pointer transition-all h-full gap-2 hover:shadow-sm",
        isSelected ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:border-primary/50"
      )}
      onClick={() => onToggle(service.id)}
    >
      <div className="relative w-10 h-10">
        <img src={service.icon_url} alt={service.name} className="w-full h-full object-contain" />
        {isSelected && (
          <div className="absolute -top-1 -right-1 bg-primary text-white rounded-full p-0.5">
            <FiCheckCircle className="w-3 h-3" />
          </div>
        )}
      </div>
      <span className="text-xs font-medium text-center leading-tight">{service.name}</span>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <Card className="glassmorphism border-0 shadow-xl overflow-hidden">
        <CardHeader className="bg-primary/5 pb-6 border-b">
          <CardTitle className="text-2xl text-primary flex items-center gap-2">
            <FiHome className="w-6 h-6" /> Publicar Nueva Clínica
          </CardTitle>
          <CardDescription className="text-base text-foreground/80">Completa el formulario para listar un nuevo espacio y hacerlo visible a odontólogos en toda la red.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6 px-4 md:px-8">
          <Accordion type="single" collapsible defaultValue="item-1" className="w-full">
            <AccordionItem value="item-1" className="border-b-0 mb-4 bg-card rounded-xl border px-2 shadow-sm">
              <AccordionTrigger className="text-lg font-semibold hover:no-underline px-4 py-4">Paso 1: Información Básica</AccordionTrigger>
              <AccordionContent className="space-y-6 px-4 pb-6">
                <div>
                  <Label htmlFor="name" className="text-base">Título del anuncio <span className="text-destructive">*</span></Label>
                  <Input id="name" value={clinicData.name || ''} onChange={(e) => updateClinicData({ name: e.target.value })} placeholder="Ej: Moderno consultorio en el corazón de la ciudad" className="mt-1.5" />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-base">Descripción <span className="text-destructive">*</span></Label>
                  <RichTextEditor 
                    value={clinicData.description || ''} 
                    onChange={(content) => updateClinicData({ description: content })}
                    placeholder="Detalla el equipamiento, el ambiente y las ventajas de tu clínica."
                    maxLength={1000}
                  />
                </div>

                <div className="p-5 bg-muted/30 border rounded-xl">
                  <Label htmlFor="number_of_cubicles" className={cn("text-base flex items-center gap-2", cubiclesError ? "text-destructive" : "")}>
                    <FiGrid className="w-5 h-5 text-primary" /> 
                    Número de Cubículos <span className="text-destructive">*</span>
                  </Label>
                  <div className="flex flex-col sm:flex-row gap-4 mt-3">
                    <Input 
                      id="number_of_cubicles" 
                      type="number" 
                      min="1" 
                      max="50" 
                      value={clinicData.number_of_cubicles || ''} 
                      onChange={handleCubiclesChange}
                      onBlur={handleCubiclesBlur}
                      placeholder="Ej: 3" 
                      className={cn("w-32 text-lg font-medium h-12", cubiclesError ? "border-destructive focus-visible:ring-destructive" : "")}
                      required 
                    />
                    <div className="text-sm text-muted-foreground bg-background border p-3 rounded-lg flex-1">
                        Indica cuántos cubículos tiene tu clínica en total. Esto permitirá que múltiples odontólogos puedan reservar diferentes espacios al mismo tiempo.
                    </div>
                  </div>
                  {cubiclesError && (
                    <p className="text-sm text-destructive mt-2 font-medium">{cubiclesError}</p>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="border-b-0 mb-4 bg-card rounded-xl border px-2 shadow-sm">
              <AccordionTrigger className="text-lg font-semibold hover:no-underline px-4 py-4">Paso 2: Ubicación</AccordionTrigger>
              <AccordionContent className="px-4 pb-6">
                <LocationPicker />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="border-b-0 mb-4 bg-card rounded-xl border px-2 shadow-sm">
              <AccordionTrigger className="text-lg font-semibold hover:no-underline px-4 py-4">Paso 3: Fotos</AccordionTrigger>
              <AccordionContent className="px-4 pb-6">
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-4 flex items-start gap-3">
                    <FiInfo className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <p className="text-sm text-foreground/90 leading-relaxed">Sube al menos <strong>{MIN_PHOTOS} fotos</strong> de alta calidad. Muestra la fachada, la sala de espera, y especialmente el interior de los cubículos. La primera foto será tu portada principal.</p>
                </div>
                <ImageUploader />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4" className="border-b-0 mb-4 bg-card rounded-xl border px-2 shadow-sm">
              <AccordionTrigger className="text-lg font-semibold hover:no-underline px-4 py-4">Paso 4: Servicios y Comodidades</AccordionTrigger>
              <AccordionContent className="px-4 pb-6 space-y-8">
                <div>
                  <h4 className="font-semibold mb-4 text-foreground text-lg border-b pb-2">Servicios Odontológicos</h4>
                  {loadingServices ? (
                    <div className="flex justify-center p-8"><FiLoader className="animate-spin text-primary w-8 h-8" /></div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                      {dentalServices.map(service => (
                        <ServiceCard key={service.id} service={service} isSelected={(clinicData.selectedServices || []).includes(service.id)} onToggle={handleServiceToggle} />
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="font-semibold mb-4 text-foreground text-lg border-b pb-2">Comodidades de la Clínica</h4>
                  {loadingServices ? (
                    <div className="flex justify-center p-8"><FiLoader className="animate-spin text-primary w-8 h-8" /></div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                      {amenities.map(service => (
                        <ServiceCard key={service.id} service={service} isSelected={(clinicData.selectedServices || []).includes(service.id)} onToggle={handleServiceToggle} />
                      ))}
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5" className="border-b-0 mb-4 bg-card rounded-xl border px-2 shadow-sm">
              <AccordionTrigger className="text-lg font-semibold hover:no-underline px-4 py-4">Paso 5: Precio y Condiciones</AccordionTrigger>
              <AccordionContent className="space-y-6 px-4 pb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-muted/20 p-4 rounded-xl border">
                      <Label className="text-base font-semibold">Precio por hora (DOP) <span className="text-destructive">*</span></Label>
                      <div className="relative mt-2">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">RD$</span>
                        <Input type="number" className="pl-12 h-12 text-lg" value={clinicData.price_per_hour || ''} onChange={(e) => updateClinicData({ price_per_hour: Number(e.target.value) })} placeholder="1500" />
                      </div>
                    </div>
                    <div className="bg-muted/20 p-4 rounded-xl border">
                      <Label className={cn("text-base font-semibold", minHoursError ? "text-destructive" : "")}>Mínimo de horas <span className="text-destructive">*</span></Label>
                      <Input 
                        type="number" 
                        value={clinicData.min_hours_booking || ''} 
                        onChange={handleMinHoursChange} 
                        onBlur={handleMinHoursBlur}
                        min="4"
                        step="1"
                        className={cn("mt-2 h-12 text-lg", minHoursError ? "border-destructive focus-visible:ring-destructive" : "")}
                        placeholder="Ej: 4" 
                      />
                      {minHoursError ? (
                          <p className="text-sm text-destructive mt-1.5 font-medium">{minHoursError}</p>
                      ) : (
                          <p className="text-xs text-muted-foreground mt-1.5">El estándar recomendado es mínimo 4 horas.</p>
                      )}
                    </div>
                </div>
                
                <div className="space-y-2 mt-8 border-t pt-6">
                  <Label htmlFor="policies_html" className="flex items-center gap-2 text-lg font-semibold">
                    <FiClipboard className="w-5 h-5 text-primary" /> Políticas y Reglas de la Clínica (Opcional)
                  </Label>
                  <p className="text-sm text-muted-foreground mb-4">
                    Describe normas de limpieza, manejo de equipos, políticas de cancelación específicas u otras reglas que el odontólogo deba conocer.
                  </p>
                  <div className={cn("transition-all bg-background rounded-lg border", (clinicData.policies_html?.replace(/<[^>]*>?/gm, '').trim().length || 0) > 2000 ? "border-destructive ring-1 ring-destructive" : "")}>
                    <RichTextEditor 
                      value={clinicData.policies_html || ''} 
                      onChange={(content) => updateClinicData({ policies_html: content })} 
                      placeholder="Ej: Es obligatorio dejar el área esterilizada. No se permiten procedimientos quirúrgicos mayores..." 
                      maxLength={2000}
                    />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className="flex flex-col pt-8 gap-4 px-2">
            {!isFormValid && (
              <div className="flex items-start gap-3 text-sm text-amber-700 bg-amber-50 p-4 rounded-lg border border-amber-200 shadow-sm">
                <FiAlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                    <span className="font-semibold block mb-1">Aún faltan campos por completar:</span>
                    <span>{getMissingFieldsMessage()}</span>
                </div>
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-4 mt-2">
              <Button size="lg" onClick={handlePublish} disabled={!isFormValid || loading || !!minHoursError || !!cubiclesError} className="flex-1 h-14 text-lg font-semibold shadow-lg hover:shadow-xl transition-all">
                {loading ? <><FiLoader className="mr-3 h-5 w-5 animate-spin" /> Publicando Anuncio...</> : <><FiCheckCircle className="mr-3 h-5 w-5" /> Publicar Clínica</>}
              </Button>
              <Button size="lg" variant="outline" onClick={() => { resetClinicData(); setMinHoursError(''); setCubiclesError(''); }} disabled={loading} className="sm:w-1/3 h-14 text-base">
                Limpiar Formulario
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default PublishClinic;