import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Building, User, MapPin, DollarSign, Clock } from 'lucide-react';
import ClinicValidationActions from './ClinicValidationActions';

const ClinicValidationCard = ({ clinic, onActionComplete }) => {
  const coverPhoto = clinic.photos?.find(p => p.is_cover)?.photo_url || clinic.photos?.[0]?.photo_url;

  return (
    <motion.div whileHover={{ y: -5 }} className="h-full">
      <Card className="flex flex-col h-full overflow-hidden glassmorphism">
        <CardHeader>
          <div className="flex items-start gap-4">
             <div className="p-3 bg-primary/10 rounded-lg">
                <Building className="w-6 h-6 text-primary" />
            </div>
            <div>
            <CardTitle className="text-xl">{clinic.name}</CardTitle>
            <CardDescription className="flex items-center text-xs">
              <User className="w-3 h-3 mr-1.5" />
              Anfitrión: {clinic.host?.full_name || 'N/A'}
            </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-grow space-y-4">
            {coverPhoto && (
                <div className="aspect-video rounded-lg overflow-hidden border">
                    <img src={coverPhoto} alt={`Foto de ${clinic.name}`} className="w-full h-full object-cover" />
                </div>
            )}
          
          <div className="text-sm text-muted-foreground space-y-2">
            <div className="flex items-start">
              <MapPin className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
              <span>{`${clinic.address_street}, ${clinic.address_sector}, ${clinic.address_city}`}</span>
            </div>
             <div className="flex items-center">
              <DollarSign className="w-4 h-4 mr-2" />
              <span>${clinic.price_per_hour}/hora</span>
            </div>
             <div className="flex items-center">
              <Clock className="w-4 h-4 mr-2" />
              <span>Mínimo {clinic.min_hours_booking} horas</span>
            </div>
          </div>
          <p className="text-sm text-foreground/80 line-clamp-3">
            {clinic.description}
          </p>
        </CardContent>
        <CardFooter>
          <ClinicValidationActions clinicId={clinic.id} onActionComplete={onActionComplete} />
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export default ClinicValidationCard;