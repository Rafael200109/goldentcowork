import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Building, RotateCcw, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ClinicCard from './ClinicCard';

const ITEMS_PER_PAGE = 12;

const ClinicList = ({ clinics, isLoading, handleViewAvailability, clearFilters }) => {
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);

  const visibleClinics = useMemo(() => {
    return clinics.slice(0, visibleCount);
  }, [clinics, visibleCount]);

  const loadMore = () => {
    setVisibleCount(prev => prev + ITEMS_PER_PAGE);
  };

  if (isLoading && clinics.length === 0) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
        <Building className="w-20 h-20 sm:w-24 sm:h-24 mx-auto text-primary animate-pulse mb-6" />
        <h2 className="text-xl sm:text-2xl font-semibold mb-2">Cargando clínicas...</h2>
        <p className="text-muted-foreground text-sm sm:text-base">Por favor, espera un momento.</p>
      </motion.div>
    );
  }

  if (clinics.length === 0) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
        <Building className="w-20 h-20 sm:w-24 sm:h-24 mx-auto text-muted-foreground mb-6" />
        <h2 className="text-xl sm:text-2xl font-semibold mb-2">No se encontraron clínicas</h2>
        <p className="text-muted-foreground text-sm sm:text-base">
          Intenta ajustar tus términos de búsqueda o filtros. También puedes{' '}
          <Button variant="link" onClick={clearFilters} className="p-0 h-auto text-primary inline-flex items-center">
            <RotateCcw className="w-3 h-3 mr-1"/>limpiar los filtros
          </Button> para ver todas.
        </p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-8">
      {/* CAMBIO CLAVE AQUÍ: 
          1. grid-cols-1 (Celulares pequeños: 1 tarjeta)
          2. sm:grid-cols-2 (Celulares grandes/Tablets: 2 tarjetas)
          3. lg:grid-cols-3 (Desktop: 3 tarjetas)
          4. xl:grid-cols-4 (Monitores grandes: 4 tarjetas)
          Ajustamos el gap a 4 o 6 para que no haya tanto espacio desperdiciado.
      */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {visibleClinics.map((clinic, index) => (
          <motion.div
            key={clinic.id || index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: Math.min((index % ITEMS_PER_PAGE) * 0.05, 0.5) }}
            className="w-full flex justify-center" // Centra la tarjeta si el contenedor es más ancho
          >
            <ClinicCard 
              clinic={clinic} 
              onClick={() => handleViewAvailability(clinic.id)} 
              priority={index < 4} 
            />
          </motion.div>
        ))}
      </div>
      
      {visibleCount < clinics.length && (
        <div className="flex justify-center pt-6">
          <Button onClick={loadMore} variant="outline" size="lg" className="rounded-full px-8 shadow-sm">
            Cargar más <ChevronDown className="ml-2 w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default ClinicList;