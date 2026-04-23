import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowLeft, Save, ShieldAlert, Info, ClipboardList } from 'lucide-react';
import { motion } from 'framer-motion';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import EditClinicServices from '@/components/clinic-dashboard/EditClinicServices';
import ClinicPhotosManager from '@/components/clinic-dashboard/ClinicPhotosManager';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useUser } from '@/contexts/UserContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import RichTextEditor from '@/components/ui/RichTextEditor';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png'
});
const MapEvents = ({
  onPositionChange
}) => {
  useMapEvents({
    click(e) {
      onPositionChange(e.latlng);
    }
  });
  return null;
};
const RecenterAutomatically = ({
  lat,
  lng
}) => {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) {
      map.setView([lat, lng]);
    }
  }, [lat, lng, map]);
  return null;
};
const EditClinicPage = () => {
  const {
    clinicId
  } = useParams();
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const {
    user
  } = useAuth();
  const {
    profile
  } = useUser();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clinicDataFull, setClinicDataFull] = useState(null);
  const [minHoursError, setMinHoursError] = useState('');
  const [cubiclesError, setCubiclesError] = useState('');
  const [policiesHtml, setPoliciesHtml] = useState('');
  const [policyId, setPolicyId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address_street: '',
    address_city: '',
    address_province: '',
    address_sector: '',
    price_per_hour: 0,
    min_hours_booking: 0,
    number_of_cubicles: 1,
    latitude: 18.4861,
    longitude: -69.9312
  });
  const fetchClinic = useCallback(async () => {
    setLoading(true);

    // Fetch Clinic Details
    const {
      data: clinicData,
      error: clinicError
    } = await supabase.from('clinics').select('*').eq('id', clinicId).single();
    if (clinicError || !clinicData) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo cargar la clínica o no tienes acceso (RLS).'
      });
      navigate(profile?.role === 'admin' ? '/admin/clinic-management' : '/clinic-dashboard');
      return;
    }
    setClinicDataFull(clinicData);
    setFormData({
      name: clinicData.name || '',
      description: clinicData.description || '',
      address_street: clinicData.address_street || '',
      address_city: clinicData.address_city || '',
      address_province: clinicData.address_province || '',
      address_sector: clinicData.address_sector || '',
      price_per_hour: clinicData.price_per_hour || 0,
      min_hours_booking: clinicData.min_hours_booking || 4,
      number_of_cubicles: clinicData.number_of_cubicles || 1,
      latitude: clinicData.latitude || 18.4861,
      longitude: clinicData.longitude || -69.9312
    });

    // Fetch Rich Text Policies
    // Removed the policy_type filter to ensure we load it even if it's NULL
    const {
      data: policyData
    } = await supabase.from('clinic_policies').select('*').eq('clinic_id', clinicId).limit(1).maybeSingle();
    if (policyData) {
      setPolicyId(policyData.id);
      setPoliciesHtml(policyData.policies_html || (policyData.policy_text ? `<p>${policyData.policy_text}</p>` : ''));
    } else if (clinicData.clinic_policies) {
      // Fallback prefill from legacy clinic_policies text column if exists and no structured row found
      setPoliciesHtml(`<p>${clinicData.clinic_policies}</p>`);
    }
    setLoading(false);
  }, [clinicId, navigate, toast, profile]);
  useEffect(() => {
    fetchClinic();
  }, [fetchClinic]);
  const handleChange = e => {
    const {
      name,
      value
    } = e.target;
    if (name === 'min_hours_booking') {
      let val = value.replace('-', '');
      setFormData(prev => ({
        ...prev,
        [name]: val
      }));
      if (val === '') {
        setMinHoursError('El mínimo de horas es requerido');
      } else if (Number(val) < 4) {
        setMinHoursError('El mínimo de horas debe ser 4 o mayor');
      } else {
        setMinHoursError('');
      }
    } else if (name === 'number_of_cubicles') {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
      if (value === '') {
        setCubiclesError('El número de cubículos es requerido');
      } else {
        const num = parseInt(value, 10);
        if (isNaN(num) || num < 1 || num > 100) {
          setCubiclesError('El número de cubículos debe ser un entero entre 1 y 100.');
        } else {
          setCubiclesError('');
        }
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  const handleDescriptionChange = content => {
    setFormData(prev => ({
      ...prev,
      description: content
    }));
  };
  const handleMinHoursBlur = () => {
    if (!formData.min_hours_booking || Number(formData.min_hours_booking) < 4) {
      setFormData(prev => ({
        ...prev,
        min_hours_booking: 4
      }));
      setMinHoursError('');
    }
  };
  const handleCubiclesBlur = () => {
    const num = parseInt(formData.number_of_cubicles, 10);
    if (isNaN(num) || num < 1) {
      setFormData(prev => ({
        ...prev,
        number_of_cubicles: 1
      }));
      setCubiclesError('');
    } else if (num > 100) {
      setFormData(prev => ({
        ...prev,
        number_of_cubicles: 100
      }));
      setCubiclesError('');
    }
  };
  const handleMapPositionChange = latlng => {
    setFormData(prev => ({
      ...prev,
      latitude: latlng.lat,
      longitude: latlng.lng
    }));
  };
  const handleSave = async e => {
    e.preventDefault();
    if (!formData.min_hours_booking || Number(formData.min_hours_booking) < 4) {
      toast({
        variant: 'destructive',
        title: 'Error de validación',
        description: 'El mínimo de horas debe ser 4 o mayor'
      });
      setMinHoursError('El mínimo de horas debe ser 4 o mayor');
      return;
    }
    if (!formData.number_of_cubicles || Number(formData.number_of_cubicles) < 1 || Number(formData.number_of_cubicles) > 100) {
      toast({
        variant: 'destructive',
        title: 'Error de validación',
        description: 'El número de cubículos debe ser un entero entre 1 y 100.'
      });
      setCubiclesError('El número de cubículos debe ser un entero entre 1 y 100.');
      return;
    }
    const plainTextDescription = formData.description.replace(/<[^>]*>?/gm, '').trim();
    if (!plainTextDescription) {
      toast({
        variant: 'destructive',
        title: 'Error de validación',
        description: 'La descripción no puede estar vacía'
      });
      return;
    }
    const plainTextPolicies = policiesHtml ? policiesHtml.replace(/<[^>]*>?/gm, '').trim() : '';
    if (policiesHtml && !plainTextPolicies) {
      toast({
        variant: 'destructive',
        title: 'Error de validación',
        description: 'El contenido de las políticas no puede estar vacío si agregas formato.'
      });
      return;
    }
    if (plainTextPolicies.length > 2000) {
      toast({
        variant: 'destructive',
        title: 'Error de validación',
        description: 'Las políticas no deben exceder los 2000 caracteres.'
      });
      return;
    }
    setSaving(true);
    try {
      const {
        count,
        error: countError
      } = await supabase.from('clinic_photos').select('*', {
        count: 'exact',
        head: true
      }).eq('clinic_id', clinicId);
      if (countError) throw new Error(`Error validando fotos: ${countError.message}`);
      if (count < 5) {
        toast({
          variant: 'destructive',
          title: 'Fotos insuficientes',
          description: 'Debes tener al menos 5 fotos de la clínica.'
        });
        setSaving(false);
        return;
      }

      // 1. Update Core Clinic Record
      const {
        error: updateError
      } = await supabase.from('clinics').update({
        ...formData,
        number_of_cubicles: parseInt(formData.number_of_cubicles, 10),
        min_hours_booking: parseInt(formData.min_hours_booking, 10),
        price_per_hour: parseFloat(formData.price_per_hour),
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude)
      }).eq('id', clinicId);
      if (updateError) {
        if (updateError.code === '42501') throw new Error('Error RLS: No tienes permisos para editar esta clínica.');
        if (updateError.message.includes('check_cubicles_range')) throw new Error('El número de cubículos debe ser un entero entre 1 y 100.');
        throw new Error(`Error al actualizar clínica: ${updateError.message}`);
      }

      // 2. Upsert Clinic Policies to structured table
      if (policiesHtml && plainTextPolicies) {
        if (!clinicId) throw new Error("ID de clínica no válido");
        const policyPayload = {
          policies_html: policiesHtml,
          policies_text: plainTextPolicies,
          policy_text: plainTextPolicies,
          policy_type: null,
          // explicit null to bypass constraint issues
          policies_formatted: true
        };
        if (policyId) {
          const {
            error: updatePolicyError
          } = await supabase.from('clinic_policies').update(policyPayload).eq('id', policyId);
          if (updatePolicyError) throw new Error(`Error al actualizar políticas en BD: ${updatePolicyError.message}`);
        } else {
          const {
            data: newPolicy,
            error: insertPolicyError
          } = await supabase.from('clinic_policies').insert({
            ...policyPayload,
            clinic_id: clinicId
          }).select().single();
          if (insertPolicyError) throw new Error(`Error al guardar nuevas políticas: ${insertPolicyError.message}`);
          if (newPolicy) setPolicyId(newPolicy.id);
        }
      } else if (policyId) {
        const {
          error: deletePolicyError
        } = await supabase.from('clinic_policies').delete().eq('id', policyId);
        if (deletePolicyError) console.error("Error deleting empty policy:", deletePolicyError);
        setPolicyId(null);
        setPoliciesHtml('');
      }
      toast({
        title: '¡Éxito!',
        description: 'Clínica y políticas actualizadas correctamente.'
      });
      navigate(profile?.role === 'admin' ? '/admin/clinic-management' : '/clinic-dashboard');
    } catch (error) {
      console.error("Save Error:", error);
      toast({
        variant: 'destructive',
        title: 'Error al guardar',
        description: error.message
      });
    } finally {
      setSaving(false);
    }
  };
  if (loading) {
    return <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>;
  }
  const isAdminMode = profile?.role === 'admin' && clinicDataFull?.host_id !== user?.id;
  return <motion.div initial={{
    opacity: 0,
    y: 20
  }} animate={{
    opacity: 1,
    y: 0
  }} transition={{
    duration: 0.5
  }}>
      <Button variant="outline" onClick={() => navigate(profile?.role === 'admin' ? '/admin/clinic-management' : '/clinic-dashboard')} className="mb-6 flex items-center">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Volver al Panel
      </Button>

      {isAdminMode && <Alert className="mb-6 bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-900/20 dark:border-amber-900 dark:text-amber-300">
              <ShieldAlert className="h-4 w-4" />
              <AlertTitle>Modo Administrador</AlertTitle>
              <AlertDescription>
                  Estás editando la clínica de otro usuario. Cualquier cambio realizado afectará la información pública de esta clínica.
              </AlertDescription>
          </Alert>}

      <Card className="max-w-4xl mx-auto glassmorphism">
        <CardHeader>
          <CardTitle className="text-3xl">Editar Clínica</CardTitle>
          <CardDescription>Realiza cambios en los detalles, servicios y fotos de la clínica.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-8">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre de la Clínica</Label>
                <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <RichTextEditor value={formData.description} onChange={handleDescriptionChange} maxLength={1000} />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="clinic_policies" className="flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-primary" /> Políticas y Reglas de la Clínica
                  </Label>
                </div>
                <p className="text-xs text-muted-foreground mb-2">
                  Describe las políticas y reglas específicas de tu clínica.
                </p>
                <div className={policiesHtml?.replace(/<[^>]*>?/gm, '').trim().length > 2000 ? "border border-destructive rounded-md p-1" : ""}>
                    <RichTextEditor value={policiesHtml} onChange={setPoliciesHtml} maxLength={2000} placeholder="Ej: No se permiten cancelaciones con menos de 24 horas de anticipación. Las sesiones deben ser confirmadas 48 horas antes..." />
                </div>
              </div>

              <div className="pt-2 pb-2">
                 <EditClinicServices clinicId={clinicId} />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                      <Label htmlFor="address_street">Dirección</Label>
                      <Input id="address_street" name="address_street" value={formData.address_street} onChange={handleChange} />
                  </div>
                   <div className="space-y-2">
                      <Label htmlFor="address_sector">Sector</Label>
                      <Input id="address_sector" name="address_sector" value={formData.address_sector} onChange={handleChange} />
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor="address_city">Ciudad</Label>
                      <Input id="address_city" name="address_city" value={formData.address_city} onChange={handleChange} />
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor="address_province">Provincia</Label>
                      <Input id="address_province" name="address_province" value={formData.address_province} onChange={handleChange} />
                  </div>
              </div>

              <div className="space-y-2">
                  <Label>Ubicación exacta (Mapa)</Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    Arrastra el marcador o haz clic en el mapa para ajustar la ubicación exacta de la clínica.
                  </p>
                  <div className="h-[350px] w-full rounded-xl overflow-hidden border-2 border-muted shadow-sm relative z-0">
                      <MapContainer center={[formData.latitude, formData.longitude]} zoom={13} scrollWheelZoom={false} style={{
                  height: '100%',
                  width: '100%'
                }}>
                          <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                          <Marker position={[formData.latitude, formData.longitude]} draggable={true} eventHandlers={{
                    dragend: e => {
                      const marker = e.target;
                      const position = marker.getLatLng();
                      handleMapPositionChange(position);
                    }
                  }} />
                          <MapEvents onPositionChange={handleMapPositionChange} />
                          <RecenterAutomatically lat={formData.latitude} lng={formData.longitude} />
                      </MapContainer>
                  </div>
                  <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                      <span>Latitud: {Number(formData.latitude).toFixed(6)}</span>
                      <span>Longitud: {Number(formData.longitude).toFixed(6)}</span>
                  </div>
              </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                      <Label htmlFor="price_per_hour">Precio por Hora (RD$)</Label>
                      <Input id="price_per_hour" name="price_per_hour" type="number" value={formData.price_per_hour} onChange={handleChange} required />
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor="min_hours_booking" className={minHoursError ? "text-red-500" : ""}>Mínimo de Horas</Label>
                      <Input id="min_hours_booking" name="min_hours_booking" type="number" min="4" step="1" className={minHoursError ? "border-red-500 focus-visible:ring-red-500" : ""} value={formData.min_hours_booking} onChange={handleChange} onBlur={handleMinHoursBlur} required />
                      {minHoursError && <p className="text-sm text-red-500">{minHoursError}</p>}
                  </div>
                  <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="number_of_cubicles" className={cubiclesError ? "text-red-500" : ""}>Número de cubículos de la clínica</Label>
                      <Input id="number_of_cubicles" name="number_of_cubicles" type="number" min="1" max="100" className={cubiclesError ? "border-red-500 focus-visible:ring-red-500" : ""} value={formData.number_of_cubicles} onChange={handleChange} onBlur={handleCubiclesBlur} placeholder="Ej: 3" required />
                      {cubiclesError ? <p className="text-sm text-red-500 mt-1">{cubiclesError}</p> : <p className="text-xs text-muted-foreground flex items-center mt-1">
                          <Info className="w-3 h-3 mr-1" /> Indica cuántos cubículos tiene tu clínica. Cada cubículo se podrá reservar de manera independiente en la plataforma.
                        </p>}
                  </div>
              </div>
            </div>

            <div className="pt-2 pb-2">
                <ClinicPhotosManager clinicId={clinicId} />
            </div>

            <div className="flex justify-end pt-4 border-t">
              <Button type="submit" disabled={saving || !!minHoursError || !!cubiclesError}>
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Guardar Detalles de Clínica
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>;
};
export default EditClinicPage;