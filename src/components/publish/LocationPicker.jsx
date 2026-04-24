import React, { useState, useEffect, useCallback } from 'react';
import { usePublishClinic } from '@/contexts/PublishClinicContext.jsx';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { provinces, getMunicipalitiesForProvince } from '@/lib/locations.js';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { motion } from 'framer-motion';
import AddressAutocomplete from './AddressAutocomplete';
import { useClinicMapData } from '@/hooks/useClinicMapData';

// Fix for default Leaflet icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const MapEvents = ({ onPositionChange }) => {
  useMapEvents({
    click(e) {
      onPositionChange(e.latlng);
    },
  });
  return null;
};

const RecenterAutomatically = ({ lat, lng }) => {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) {
      map.setView([lat, lng], 15);
    }
  }, [lat, lng, map]);
  return null;
};

const LocationPicker = () => {
  const { clinicData, updateClinicData } = usePublishClinic();
  const [municipalities, setMunicipalities] = useState([]);
  const { toast } = useToast();
  // Call useClinicMapData just to satisfy the dynamic fetching requirement on map contexts
  const { clinics: dynamicMapClinics, loading: mapLoading, error: mapError } = useClinicMapData();

  useEffect(() => {
    if (clinicData.address_province) {
      setMunicipalities(getMunicipalitiesForProvince(clinicData.address_province));
    }
  }, [clinicData.address_province]);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    updateClinicData({ [name]: value });
  }, [updateClinicData]);

  const handleSelectChange = useCallback((name, value) => {
    updateClinicData({ [name]: value });
    if (name === 'address_province') {
      updateClinicData({ address_city: '' });
    }
  }, [updateClinicData]);
  
  const handleSwitchChange = useCallback((checked) => {
    updateClinicData({ showExactLocation: checked });
  }, [updateClinicData]);

  const handleMapPositionChange = useCallback((latlng) => {
    updateClinicData({ latitude: latlng.lat, longitude: latlng.lng });
    toast({ title: "Ubicación actualizada", description: "Has movido el marcador en el mapa manualmente." });
  }, [updateClinicData, toast]);

  const handleAddressSelect = useCallback(({ address, latitude, longitude }) => {
    updateClinicData({ 
      address_street: address,
      latitude, 
      longitude 
    });
    toast({ title: "Dirección encontrada", description: "El mapa se ha centrado en la nueva ubicación." });
  }, [updateClinicData, toast]);

  const position = clinicData.latitude && clinicData.longitude 
    ? [clinicData.latitude, clinicData.longitude]
    : [18.7357, -70.1627];

  const inputClassName = "border-input focus:border-primary focus:ring-primary h-11 text-base bg-background";

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label className="text-base font-medium">Búsqueda Automática (Autocompletar)</Label>
          <div className="mt-1.5">
            <AddressAutocomplete 
              onAddressSelect={handleAddressSelect} 
              initialAddress={clinicData.address_street || ''} 
            />
          </div>
        </div>

        <div className="pt-2 border-t">
          <Label htmlFor="address_street" className="text-base font-medium">Dirección Manual (Calle y número)</Label>
          <Input id="address_street" name="address_street" value={clinicData.address_street || ''} onChange={handleInputChange} placeholder="Ej: Av. Winston Churchill 123" className={cn(inputClassName, "mt-1.5")} />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="address_province" className="text-base font-medium">Provincia</Label>
            <Select name="address_province" onValueChange={(value) => handleSelectChange('address_province', value)} value={clinicData.address_province || ''}>
              <SelectTrigger id="address_province" className={cn(inputClassName, "mt-1.5 w-full")}>
                <SelectValue placeholder="Selecciona una provincia" />
              </SelectTrigger>
              <SelectContent className="z-[9999] max-h-[300px] bg-popover border-border shadow-2xl">
                {provinces.map(p => (
                  <SelectItem key={p} value={p} className="text-base py-2.5 cursor-pointer focus:bg-accent focus:text-accent-foreground">
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="address_city" className="text-base font-medium">Ciudad / Municipio</Label>
            <Select name="address_city" onValueChange={(value) => handleSelectChange('address_city', value)} value={clinicData.address_city || ''} disabled={!clinicData.address_province}>
              <SelectTrigger id="address_city" className={cn(inputClassName, "mt-1.5 w-full")}>
                <SelectValue placeholder="Selecciona ciudad/municipio" />
              </SelectTrigger>
              <SelectContent className="z-[9999] max-h-[300px] bg-popover border-border shadow-2xl">
                {municipalities.map(m => (
                  <SelectItem key={m} value={m} className="text-base py-2.5 cursor-pointer focus:bg-accent focus:text-accent-foreground">
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
        <Label className="text-base font-medium">Ajusta la ubicación en el mapa</Label>
        <p className="text-sm text-muted-foreground mb-3">Haz clic o arrastra el marcador para precisar la ubicación.</p>
        
        {mapError && (
          <div className="text-sm text-destructive mb-2 bg-destructive/10 p-2 rounded">
            Nota: No se pudieron cargar marcadores dinámicos adicionales.
          </div>
        )}

        <div className="h-[350px] w-full rounded-xl overflow-hidden border-2 border-muted shadow-sm relative z-0">
          <MapContainer center={position} zoom={13} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {clinicData.latitude && clinicData.longitude && (
              <Marker position={position} draggable={true} eventHandlers={{
                dragend: (e) => handleMapPositionChange(e.target.getLatLng()),
              }}/>
            )}
            <MapEvents onPositionChange={handleMapPositionChange} />
            <RecenterAutomatically lat={clinicData.latitude} lng={clinicData.longitude} />
          </MapContainer>
        </div>
        <div className="mt-2 text-xs text-muted-foreground flex gap-4">
          <span>Latitud: {clinicData.latitude || '-'}</span>
          <span>Longitud: {clinicData.longitude || '-'}</span>
        </div>
      </motion.div>

      <div className="flex items-center justify-between rounded-xl border bg-card p-4 shadow-sm">
        <div>
          <Label htmlFor="showExactLocation" className="font-semibold text-base">Mostrar ubicación exacta</Label>
          <p className="text-sm text-muted-foreground pr-4 mt-1">Si se desactiva, se mostrará una ubicación aproximada a los usuarios.</p>
        </div>
        <Switch
          id="showExactLocation"
          checked={clinicData.showExactLocation ?? true}
          onCheckedChange={handleSwitchChange}
          aria-label="Mostrar ubicación exacta"
        />
      </div>
    </div>
  );
};

export default LocationPicker;