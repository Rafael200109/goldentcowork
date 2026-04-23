import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PREDEFINED_SERVICES } from '@/lib/clinicServices';
import { Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const ServicesSelector = ({ selectedServices = [], onChange }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleToggle = (service) => {
    const isSelected = selectedServices.some(s => s.icon === service.icon);
    
    if (isSelected) {
      onChange(selectedServices.filter(s => s.icon !== service.icon));
    } else {
      onChange([...selectedServices, { 
        service_name: service.name, 
        service_icon: service.icon 
      }]);
    }
  };

  const filteredServices = PREDEFINED_SERVICES.filter(service =>
    service.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4 w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar servicios (ej: wifi, estacionamiento...)"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      <ScrollArea className="h-[400px] pr-4 rounded-md border p-4 bg-muted/10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredServices.map((service) => {
            const isSelected = selectedServices.some(s => s.icon === service.icon);
            const Icon = service.lucideIcon;

            return (
              <motion.div
                key={service.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={cn(
                  "flex items-start space-x-3 p-3 rounded-lg border transition-all cursor-pointer hover:bg-accent/50",
                  isSelected ? "border-primary bg-primary/5 shadow-sm" : "border-transparent bg-background"
                )}
                onClick={() => handleToggle(service)}
              >
                <Checkbox
                  id={`service-${service.id}`}
                  checked={isSelected}
                  onCheckedChange={() => handleToggle(service)}
                  className="mt-1"
                />
                <div className="grid gap-1.5 leading-none w-full">
                  <Label
                    htmlFor={`service-${service.id}`}
                    className="flex items-center gap-2 font-medium cursor-pointer text-base"
                  >
                    <Icon className="w-4 h-4 text-muted-foreground" />
                    {service.name}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {service.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
          {filteredServices.length === 0 && (
            <p className="col-span-2 text-center text-muted-foreground py-8">
              No se encontraron servicios con "{searchTerm}"
            </p>
          )}
        </div>
      </ScrollArea>
      
      <div className="flex items-center justify-between text-sm text-muted-foreground px-1">
        <span>{selectedServices.length} servicios seleccionados</span>
        {selectedServices.length > 0 && (
          <button 
            onClick={() => onChange([])}
            className="text-destructive hover:underline text-xs"
          >
            Limpiar selección
          </button>
        )}
      </div>
    </div>
  );
};

export default ServicesSelector;