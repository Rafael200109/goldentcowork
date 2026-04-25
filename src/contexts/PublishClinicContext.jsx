import React, { createContext, useContext, useState } from 'react';
import { supabaseClient } from '@/config/supabaseConfig';
import { useAuth } from './SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';

const PublishClinicContext = createContext();

export const usePublishClinic = () => useContext(PublishClinicContext);

export const PublishClinicProvider = ({ children }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [clinicData, setClinicData] = useState({
    type: 'entire_clinic',
    min_hours_booking: 4,
    number_of_cubicles: 1,
    selectedServices: [],
    photos: [],
    policies_html: ''
  });

  const updateClinicData = (newData) => {
    setClinicData((prev) => ({ ...prev, ...newData }));
  };

  const resetClinicData = () => {
    setClinicData({
      type: 'entire_clinic',
      min_hours_booking: 4,
      number_of_cubicles: 1,
      selectedServices: [],
      photos: [],
      policies_html: ''
    });
  };

  const publishClinic = async () => {
    if (!user) {
      toast({ title: 'Error', description: 'Debes estar autenticado.', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      // 1. Insert Core Clinic Record
      const { data: clinic, error: clinicError } = await supabaseClient.from('clinics').insert({
        host_id: user.id,
        name: clinicData.name,
        description: clinicData.description,
        type: clinicData.type,
        status: 'published',
        address_street: clinicData.address_street,
        address_city: clinicData.address_city,
        address_province: clinicData.address_province,
        address_sector: clinicData.address_sector,
        latitude: clinicData.latitude,
        longitude: clinicData.longitude,
        price_per_hour: parseFloat(clinicData.price_per_hour),
        min_hours_booking: parseInt(clinicData.min_hours_booking, 10),
        number_of_cubicles: parseInt(clinicData.number_of_cubicles, 10),
      }).select().single();

      if (clinicError) throw new Error(`Error al crear clínica: ${clinicError.message}`);

      // 2. Insert Policies with robust error handling and NULL policy_type
      if (clinicData.policies_html) {
        const plainTextPolicies = clinicData.policies_html.replace(/<[^>]*>?/gm, '').trim();
        if (plainTextPolicies) {
          const { error: policyError } = await supabaseClient.from('clinic_policies').insert({
            clinic_id: clinic.id,
            policy_type: null, // Explicitly NULL to bypass constraints
            policy_text: plainTextPolicies,
            policies_html: clinicData.policies_html,
            policies_text: plainTextPolicies,
            policies_formatted: true
          });
          if (policyError) {
              console.error("Database error saving policies:", policyError);
              throw new Error(`Error al guardar políticas: ${policyError.message}`);
          }
        }
      }

      // 3. Insert Photos
      if (clinicData.photos && clinicData.photos.length > 0) {
        const photosToInsert = clinicData.photos.map((url, index) => ({
          clinic_id: clinic.id,
          photo_url: url,
          is_cover: index === 0,
          display_order: index
        }));
        const { error: photosError } = await supabaseClient.from('clinic_photos').insert(photosToInsert);
        if (photosError) throw new Error(`Error al guardar fotos: ${photosError.message}`);
      }

      // 4. Insert Services
      if (clinicData.selectedServices && clinicData.selectedServices.length > 0) {
         const { data: allServices } = await supabaseClient.from('services').select('*');
         const servicesToInsert = clinicData.selectedServices.map(serviceId => {
            const sDef = (allServices || []).find(s => s.id === serviceId);
            return {
                clinic_id: clinic.id,
                service_id: serviceId,
                service_name: sDef ? sDef.name : 'Servicio',
                service_icon: sDef ? sDef.icon_url : ''
            };
         });
         const { error: servicesError } = await supabaseClient.from('clinic_services').insert(servicesToInsert);
         if (servicesError) throw new Error(`Error al guardar servicios: ${servicesError.message}`);
      }

      toast({ title: '¡Éxito!', description: 'Clínica y políticas publicadas correctamente.' });
      resetClinicData();
      navigate('/clinic-dashboard');
    } catch (error) {
      console.error("Publish error:", error);
      toast({ title: 'Error al publicar', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <PublishClinicContext.Provider value={{ clinicData, updateClinicData, resetClinicData, publishClinic, loading }}>
      {children}
    </PublishClinicContext.Provider>
  );
};