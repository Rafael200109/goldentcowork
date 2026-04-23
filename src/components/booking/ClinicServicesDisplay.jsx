import React, { useState, useEffect, memo } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { Outdent as Tooth, Sparkles, Zap, Smile, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const INITIAL_VISIBLE_COUNT = 6;

const ClinicServicesDisplay = memo(({ clinicId }) => {
  const [allServices, setAllServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const fetchClinicServices = async () => {
      if (!clinicId) return;
      try {
        const { data, error } = await supabase
          .from('clinic_services')
          .select('id, service_name, service_icon')
          .eq('clinic_id', clinicId);

        if (error) throw error;
        setAllServices(data || []);
      } catch (err) {
        console.error("Error loading clinic services:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchClinicServices();
  }, [clinicId]);

  if (loading || allServices.length === 0) return null;

  const getDentalIcon = (serviceName) => {
    const name = serviceName.toLowerCase();
    if (name.includes('blanqueamiento') || name.includes('cosmética') || name.includes('estética')) return <Sparkles className="w-full h-full" />;
    if (name.includes('emergencia') || name.includes('rápido') || name.includes('urgencia')) return <Zap className="w-full h-full" />;
    if (name.includes('limpieza') || name.includes('preventivo')) return <Smile className="w-full h-full" />;
    return <Tooth className="w-full h-full" />;
  };

  const displayedServices = isExpanded ? allServices : allServices.slice(0, INITIAL_VISIBLE_COUNT);

  const ServiceItem = ({ item }) => (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      className="flex items-center gap-4 py-2 group"
    >
      <div className="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
        {item.service_icon && item.service_icon.startsWith('http') ? (
          <img 
            src={item.service_icon} 
            alt={item.service_name}
            loading="lazy"
            className="w-full h-full object-contain opacity-80 group-hover:opacity-100 transition-opacity"
          />
        ) : getDentalIcon(item.service_name)}
      </div>
      <span className="text-sm md:text-base text-foreground/90 font-light group-hover:text-foreground transition-colors line-clamp-1">
        {item.service_name}
      </span>
    </motion.div>
  );

  return (
    <div className="py-6 border-t border-border">
      <h3 className="text-xl md:text-2xl font-semibold mb-6">Lo que este lugar ofrece</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2">
        <AnimatePresence mode='popLayout'>
          {displayedServices.map((item, idx) => (
            <ServiceItem key={item.id || `service-${idx}`} item={item} />
          ))}
        </AnimatePresence>
      </div>
      {allServices.length > INITIAL_VISIBLE_COUNT && (
        <div className="mt-8">
          <Button 
            variant="outline" 
            onClick={() => setIsExpanded(!isExpanded)}
            className="min-w-[200px] border-foreground/10 hover:bg-muted/50 transition-all text-base"
          >
            {isExpanded ? (
               <>Mostrar menos <ChevronUp className="ml-2 w-4 h-4" /></>
            ) : (
               <>Mostrar los {allServices.length} servicios <ChevronDown className="ml-2 w-4 h-4" /></>
            )}
          </Button>
        </div>
      )}
    </div>
  );
});

ClinicServicesDisplay.displayName = 'ClinicServicesDisplay';

export default ClinicServicesDisplay;