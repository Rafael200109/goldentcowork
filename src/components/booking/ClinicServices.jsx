import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { getServiceIcon } from '@/lib/clinicServices';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronUp } from 'lucide-react';

const ServiceItem = ({ service }) => {
  const IconComponent = getServiceIcon(service.service_icon);
  
  return (
    <div className="flex items-center gap-6 group py-2"> {/* Increased gap, added group for hover, removed card background specific classes */}
      <div className="flex-shrink-0">
        <IconComponent className="w-12 h-12 text-foreground/70 group-hover:text-primary transition-colors duration-200" strokeWidth={1.5} /> {/* Increased icon size to 48px */}
      </div>
      <div className="flex flex-col">
        <span className="text-lg font-medium text-foreground/90">{service.service_name}</span> {/* Increased font size to text-lg */}
      </div>
    </div>
  );
};

const ClinicServices = ({ services = [] }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const INITIAL_COUNT = 10;
  
  if (!services || services.length === 0) return null;

  const displayedServices = isExpanded ? services : services.slice(0, INITIAL_COUNT);
  const remainingCount = services.length - INITIAL_COUNT;

  return (
    <div className="py-8 px-6 border-t border-border/60"> {/* Added px-6 padding */}
      <h3 className="text-2xl font-semibold mb-6 text-foreground">Lo que este lugar ofrece</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8"> {/* Changed to gap-8 */}
        <AnimatePresence initial={false} mode='wait'>
          {displayedServices.map((service) => (
            <motion.div
              key={service.id || service.service_name}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <ServiceItem service={service} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {services.length > INITIAL_COUNT && (
        <div className="mt-6">
          <Button
            variant="outline"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-base font-medium border-foreground/20 hover:border-foreground transition-all px-6 py-3 hover:scale-105" // Increased padding and added hover effect
          >
            {isExpanded ? (
              <>
                Mostrar menos <ChevronUp className="ml-2 w-4 h-4" />
              </>
            ) : (
              <>
                Mostrar los {remainingCount} servicios restantes <ChevronDown className="ml-2 w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export default ClinicServices;