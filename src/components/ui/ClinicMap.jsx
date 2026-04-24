import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import { FiMapPin, FiNavigation, FiLoader, FiAlertTriangle } from 'react-icons/fi';
import { cn } from '@/lib/utils';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import { useClinicMapData } from '@/hooks/useClinicMapData';
import { Button } from '@/components/ui/button';

// Fix for default marker icons in Leaflet with Webpack/Vite
try {
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  });
} catch (e) {
  console.warn("Leaflet icon configuration warning:", e);
}

const formatPrice = (price) => {
  return new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency: 'DOP',
    minimumFractionDigits: 2
  }).format(price || 0);
};

const CustomMarker = ({ clinic, variant = 'exact' }) => {
  const priceDisplay = formatPrice(clinic.price_per_hour);
  
  if (variant === 'exact') {
      const iconHtml = `
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 cursor-pointer group">
          <div class="bg-secondary text-white border-2 border-primary shadow-xl rounded-full px-4 py-1.5 text-sm font-bold whitespace-nowrap transition-all duration-200 ease-in-out group-hover:scale-110 flex items-center justify-center hover:bg-secondary/90 hover:z-50">
            ${priceDisplay}/h
          </div>
          <div class="absolute top-full left-1/2 -translate-x-1/2 -mt-[2px] w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-primary drop-shadow-sm"></div>
        </div>
      `;

      let customIcon;
      try {
        customIcon = L.divIcon({
          html: iconHtml,
          className: 'custom-leaflet-marker bg-transparent border-0',
          iconSize: [0, 0],
          iconAnchor: [0, 0],
          popupAnchor: [0, -24]
        });
      } catch (e) {
        customIcon = new L.Icon.Default();
      }

      return (
        <Marker position={[clinic.latitude, clinic.longitude]} icon={customIcon} zIndexOffset={1000}>
          <Popup minWidth={220}>
            <div className="w-52">
              <h3 className="font-bold text-sm text-primary mb-0.5 truncate flex items-center gap-1.5">
                <FiMapPin className="w-3.5 h-3.5" />
                {clinic.name}
              </h3>
              <p className="text-xs text-muted-foreground mb-1.5 truncate">
                {clinic.address_street}, {clinic.address_sector}
              </p>
              <div className="text-xs font-medium text-muted-foreground mb-2">
                {clinic.number_of_cubicles || 1} Cubículo(s)
              </div>
              <div className="flex items-center justify-between mt-2">
                <p className="text-sm font-semibold text-secondary">
                  {priceDisplay} <span className="text-xs font-normal text-muted-foreground">/ hora</span>
                </p>
                <a 
                  href={`https://www.google.com/maps/dir/?api=1&destination=${clinic.latitude},${clinic.longitude}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-1.5 bg-muted rounded-full hover:bg-muted-foreground/10 transition-colors"
                  title="Cómo llegar"
                >
                  <FiNavigation className="w-3.5 h-3.5 text-primary" />
                </a>
              </div>
            </div>
          </Popup>
        </Marker>
      );
  }

  return (
    <Circle 
        center={[clinic.latitude, clinic.longitude]} 
        radius={800}
        pathOptions={{ 
            color: 'hsl(var(--primary))',
            fillColor: '#ef4444',
            fillOpacity: 0.15, 
            weight: 2,
            dashArray: '5, 10'
        }}
    >
        <Popup minWidth={200}>
            <div className="w-48 text-center p-2">
                <div className="flex justify-center mb-2">
                    <div className="p-2 bg-red-50 rounded-full">
                        <FiMapPin className="w-5 h-5 text-red-500" />
                    </div>
                </div>
                <h3 className="font-bold text-sm mb-1">Zona Aproximada</h3>
                <p className="text-xs text-muted-foreground mb-2">
                    Esta es la ubicación general. La dirección exacta se revelará al confirmar tu reserva.
                </p>
                <div className="text-xs font-bold text-red-600 bg-red-50 py-1 rounded">
                   Desde {priceDisplay}/h
                </div>
            </div>
        </Popup>
    </Circle>
  );
};

const MapUpdater = ({ clinics, variant }) => {
  const map = useMap();

  useEffect(() => {
    if (!map || !map._loaded) return;

    if (clinics && clinics.length > 0) {
      const validClinics = clinics.filter(c => 
        c.latitude != null && c.longitude != null && 
        !isNaN(c.latitude) && !isNaN(c.longitude)
      );
      
      if (validClinics.length === 0) return;

      const bounds = L.latLngBounds(validClinics.map(clinic => [clinic.latitude, clinic.longitude]));
      
      if (bounds.isValid()) {
        if (validClinics.length === 1) {
            const zoomLevel = variant === 'approximate' ? 14 : 15;
            map.setView(bounds.getCenter(), zoomLevel, { animate: true });
        } else {
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: variant === 'approximate' ? 13 : 15, animate: true });
        }
      }
    } else {
      map.setView([18.7357, -70.1627], 8, { animate: true });
    }
  }, [clinics, map, variant]);

  return null;
};

const ThemedTileLayer = () => {
  const tileUrl = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
  return (
    <TileLayer
      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
      url={tileUrl}
    />
  );
};

const ClinicMap = ({ clinics: propClinics, isBehindModal = false, variant = 'exact', fetchDynamically = false }) => {
  const { clinics: dynamicClinics, loading, error, refetch } = useClinicMapData();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Use dynamic data if fetchDynamically is true, otherwise use props
  const mapClinics = fetchDynamically ? dynamicClinics : (propClinics || []);
  const showLoading = fetchDynamically ? loading : !isReady;
  const showError = fetchDynamically ? error : null;

  if (showLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[300px] w-full bg-muted/10 rounded-lg">
        <FiLoader className="w-8 h-8 animate-spin text-muted-foreground/50 mb-2" />
        <span className="text-sm text-muted-foreground">Cargando mapa...</span>
      </div>
    );
  }

  if (showError) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[300px] w-full bg-destructive/5 rounded-lg border border-destructive/20 p-6 text-center">
        <FiAlertTriangle className="w-8 h-8 text-destructive mb-2" />
        <p className="text-sm text-destructive font-medium mb-4">{showError}</p>
        <Button variant="outline" size="sm" onClick={refetch}>Reintentar</Button>
      </div>
    );
  }

  const validClinics = mapClinics.filter(clinic => clinic.latitude && clinic.longitude);

  return (
    <ErrorBoundary fallback={
      <div className="flex flex-col items-center justify-center h-full min-h-[300px] w-full bg-muted/30 border border-dashed rounded-lg p-6 text-center text-muted-foreground">
        <FiAlertTriangle className="w-8 h-8 mb-2 text-amber-500 opacity-80" />
        <p className="font-medium text-foreground">El mapa no pudo cargarse</p>
      </div>
    }>
      <div className={cn(
        "relative w-full h-full min-h-[300px] overflow-hidden rounded-lg", 
        isBehindModal ? "z-0" : "z-10"
      )}>
        <MapContainer
            center={[18.7357, -70.1627]}
            zoom={8}
            scrollWheelZoom={true}
            style={{ height: '100%', width: '100%', position: 'absolute', inset: 0 }}
            className="w-full h-full"
        >
          <ThemedTileLayer />
          {validClinics.map((clinic) => (
            <CustomMarker key={clinic.id} clinic={clinic} variant={variant} />
          ))}
          <MapUpdater clinics={validClinics} variant={variant} />
        </MapContainer>
      </div>
    </ErrorBoundary>
  );
};

export default ClinicMap;