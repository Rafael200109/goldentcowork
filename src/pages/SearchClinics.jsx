import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Map as MapIcon, List, SlidersHorizontal, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from "@/components/ui/use-toast.js";
import { provinces as allProvincesList, getMunicipalitiesForProvince, getSectorsForMunicipality } from '@/lib/locations.js';
import ClinicMap from '@/components/ui/ClinicMap.jsx';
import ClinicFilters from '@/components/search/ClinicFilters.jsx';
import ClinicList from '@/components/search/ClinicList.jsx';
import { format } from "date-fns";
import { formatInTimeZone } from 'date-fns-tz';
import { useCachedClinics } from '@/hooks/useCachedClinics';
import ErrorBoundary from '@/components/ui/ErrorBoundary';

const ALL_PROVINCES_VALUE = "all-provinces";
const ALL_MUNICIPIOS_VALUE = "all-municipios";
const ALL_SECTORS_VALUE = "all-sectors";

export const SearchClinics = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProvince, setSelectedProvince] = useState(ALL_PROVINCES_VALUE);
  const [selectedMunicipio, setSelectedMunicipio] = useState(ALL_MUNICIPIOS_VALUE);
  const [selectedSector, setSelectedSector] = useState(ALL_SECTORS_VALUE);
  const [priceSort, setPriceSort] = useState('default');
  const [availabilityDate, setAvailabilityDate] = useState(null);
  
  const [municipiosForSelectedProvince, setMunicipiosForSelectedProvince] = useState([]);
  const [sectorsForSelectedMunicipio, setSectorsForSelectedMunicipio] = useState([]);
  
  const [viewMode, setViewMode] = useState('split_map_top'); 
  const [showFilters, setShowFilters] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  const { clinics: allClinicsData, loading: isLoading, fetchClinics } = useCachedClinics();

  const allProvincesMemo = useMemo(() => allProvincesList, []);

  // Format clinics mapping logic from cached raw data
  const allClinics = useMemo(() => {
    if (!allClinicsData || allClinicsData.length === 0) return [];
    
    const formatted = allClinicsData.map(clinic => {
      // Find the cover photo safely
      const coverPhotoObj = clinic.clinic_photos && clinic.clinic_photos.length > 0
          ? (clinic.clinic_photos.find(p => p.is_cover === true) || clinic.clinic_photos[0])
          : null;
      
      const isFeaturedValid = clinic.is_featured && clinic.featured_until && new Date(clinic.featured_until) > new Date();

      return {
        id: clinic.id,
        name: clinic.name,
        address: `${clinic.address_street || ''}, ${clinic.address_sector || ''}, ${clinic.address_city || ''}`.replace(/^, | , | $/g, ''),
        province: clinic.address_province,
        municipality: clinic.address_city,
        sector: clinic.address_sector,
        latitude: clinic.latitude ? Number(clinic.latitude) : null,
        longitude: clinic.longitude ? Number(clinic.longitude) : null,
        description: clinic.description,
        imageUrl: coverPhotoObj ? coverPhotoObj.photo_url : null,
        clinic_photos: clinic.clinic_photos || [], 
        price_per_hour: clinic.price_per_hour || 0,
        min_hours_booking: clinic.min_hours_booking || 4,
        is_featured: isFeaturedValid,
        featured_until: clinic.featured_until,
        bookings: clinic.bookings ? clinic.bookings.filter(b => b.status === 'confirmed') : [],
      };
    });

    formatted.sort((a, b) => {
      if (a.is_featured && !b.is_featured) return -1;
      if (!a.is_featured && b.is_featured) return 1;
      return 0;
    });

    return formatted;
  }, [allClinicsData]);

  useEffect(() => {
    fetchClinics();
  }, [fetchClinics]);

  useEffect(() => {
    if (selectedProvince && selectedProvince !== ALL_PROVINCES_VALUE) {
      setMunicipiosForSelectedProvince(getMunicipalitiesForProvince(selectedProvince));
    } else {
      setMunicipiosForSelectedProvince([]);
    }
    setSelectedMunicipio(ALL_MUNICIPIOS_VALUE);
    setSelectedSector(ALL_SECTORS_VALUE); 
  }, [selectedProvince]);

  useEffect(() => {
    if (selectedMunicipio && selectedMunicipio !== ALL_MUNICIPIOS_VALUE && selectedProvince !== ALL_PROVINCES_VALUE) {
      setSectorsForSelectedMunicipio(getSectorsForMunicipality(selectedProvince, selectedMunicipio));
    } else {
      setSectorsForSelectedMunicipio([]);
    }
    setSelectedSector(ALL_SECTORS_VALUE);
  }, [selectedMunicipio, selectedProvince]);

  const filteredClinics = useMemo(() => {
    if (isLoading || allClinics.length === 0) return [];

    let results = [...allClinics];

    if (searchTerm.trim()) {
      results = results.filter(clinic =>
        (clinic.name && clinic.name.toLowerCase().includes(searchTerm.toLowerCase().trim())) ||
        (clinic.description && clinic.description.toLowerCase().includes(searchTerm.toLowerCase().trim()))
      );
    }

    if (selectedProvince && selectedProvince !== ALL_PROVINCES_VALUE) {
      results = results.filter(clinic => clinic.province === selectedProvince);
    }
    
    if (selectedMunicipio && selectedMunicipio !== ALL_MUNICIPIOS_VALUE) {
      results = results.filter(clinic => clinic.municipality === selectedMunicipio);
    }

    if (selectedSector && selectedSector !== ALL_SECTORS_VALUE) {
      results = results.filter(clinic => clinic.sector === selectedSector);
    }
    
    if (availabilityDate) {
      const selectedDateStr = format(availabilityDate, 'yyyy-MM-dd');
      const timeZone = 'America/Santo_Domingo';
      results = results.filter(clinic => {
        return !clinic.bookings.some(booking => {
          if (!booking.start_time) return false;
          try {
            const bookingDateStr = formatInTimeZone(new Date(booking.start_time), timeZone, 'yyyy-MM-dd');
            return bookingDateStr === selectedDateStr;
          } catch (e) {
            return false;
          }
        });
      });
    }

    if (priceSort === 'asc') {
      results.sort((a, b) => a.price_per_hour - b.price_per_hour);
    } else if (priceSort === 'desc') {
      results.sort((a, b) => b.price_per_hour - a.price_per_hour);
    }
    
    return results;
  }, [searchTerm, selectedProvince, selectedMunicipio, selectedSector, priceSort, availabilityDate, allClinics, isLoading]);

  const handleViewAvailability = (clinicId) => {
    navigate(`/book-clinic/${clinicId}`);
  };
  
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedProvince(ALL_PROVINCES_VALUE);
    setSelectedMunicipio(ALL_MUNICIPIOS_VALUE);
    setSelectedSector(ALL_SECTORS_VALUE);
    setPriceSort('default');
    setAvailabilityDate(null);
    toast({ title: "Filtros Limpiados", description: "Mostrando todas las clínicas." });
  };

  const displayMap = viewMode === 'split_map_top';
  const displayList = viewMode === 'list' || viewMode === 'split_map_top';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6 container max-w-screen-2xl px-4 sm:px-6 pb-20"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-2 gap-4">
        <Button onClick={() => navigate(-1)} variant="outline" size="sm" className="flex items-center shrink-0">
          <ArrowLeft className="w-4 h-4 mr-2" /> Volver
        </Button>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center flex-grow gradient-text">
          Buscar Clínicas
        </h1>
        <div className="flex items-center gap-2 self-end sm:self-auto bg-muted/50 p-1 rounded-lg">
          <Button size="icon" variant={showFilters ? "secondary" : "ghost"} onClick={() => setShowFilters(!showFilters)} className="rounded-md transition-colors" title="Filtros">
            <SlidersHorizontal className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
          <div className="w-px h-6 bg-border mx-1"></div>
          <Button size="icon" variant={viewMode === 'split_map_top' ? "secondary" : "ghost"} onClick={() => setViewMode('split_map_top')} className="rounded-md transition-colors" title="Ver Mapa y Lista">
            <MapIcon className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
          <Button size="icon" variant={viewMode === 'list' ? "secondary" : "ghost"} onClick={() => setViewMode('list')} className="rounded-md transition-colors" title="Ver Solo Lista">
            <List className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
        </div>
      </div>
      <p className="text-center text-muted-foreground mb-6">
        Encuentra el espacio dental perfecto para tus necesidades.
      </p>

      {showFilters && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
          <ClinicFilters
            searchTerm={searchTerm} setSearchTerm={setSearchTerm}
            selectedProvince={selectedProvince} setSelectedProvince={setSelectedProvince} allProvinces={allProvincesMemo}
            selectedMunicipio={selectedMunicipio} setSelectedMunicipio={setSelectedMunicipio} municipiosForSelectedProvince={municipiosForSelectedProvince}
            selectedSector={selectedSector} setSelectedSector={setSelectedSector} sectorsForSelectedMunicipio={sectorsForSelectedMunicipio}
            priceSort={priceSort} setPriceSort={setPriceSort}
            availabilityDate={availabilityDate} setAvailabilityDate={setAvailabilityDate}
            clearFilters={clearFilters}
          />
        </motion.div>
      )}

      <div className="flex flex-col gap-6 w-full">
        {displayMap && !isLoading && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="w-full h-[350px] sm:h-[450px] border-2 border-muted rounded-xl shadow-sm overflow-hidden bg-background relative z-0"
          >
            <ErrorBoundary fallback={
              <div className="flex flex-col items-center justify-center h-full w-full text-center p-6 bg-muted/20">
                <AlertCircle className="w-10 h-10 text-destructive mb-3" />
                <p className="font-semibold text-foreground">El mapa no pudo cargar correctamente.</p>
                <p className="text-sm text-muted-foreground mt-1">Por favor, continúa utilizando la vista de lista o recarga la página.</p>
              </div>
            }>
              <ClinicMap clinics={filteredClinics} variant="approximate" />
            </ErrorBoundary>
          </motion.div>
        )}

        {displayList && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full relative z-10">
            <ClinicList clinics={filteredClinics} isLoading={isLoading} handleViewAvailability={handleViewAvailability} clearFilters={clearFilters} />
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};