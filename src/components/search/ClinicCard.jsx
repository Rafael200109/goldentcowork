import React, { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FiStar, FiMapPin, FiGrid } from 'react-icons/fi';
import FavoriteButton from '@/components/ui/FavoriteButton';
import LazyImage from '@/components/ui/LazyImage';

const formatPrice = (price) => {
  return new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency: 'DOP',
    minimumFractionDigits: 0
  }).format(price || 0);
};

const ClinicCard = memo(({ clinic, onClick, priority = false }) => {
  const defaultImageUrl = "https://images.unsplash.com/photo-1579069780919-d3947e04e316?q=80&w=600&auto=format&fit=crop";
  
  // 1. Try to get explicit cover
  // 2. Try imageUrl passed from parent (SearchClinics)
  // 3. Try the first image in clinic_photos
  const coverPhoto = 
    clinic.clinic_photos?.find(p => p.is_cover === true)?.photo_url || 
    clinic.imageUrl || 
    clinic.clinic_photos?.[0]?.photo_url || 
    defaultImageUrl;
    
  return (
    <div className="group relative h-full w-full" onClick={onClick}>
      <Card className="h-full w-full overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer border-transparent hover:border-primary/20 bg-card flex flex-col">
        {/* FIX: Changed bg-muted to bg-gray-100 dark:bg-gray-800 to prevent black boxes */}
        <div className="relative w-full aspect-video overflow-hidden bg-gray-100 dark:bg-gray-800 m-0 p-0">
          <LazyImage
            src={coverPhoto}
            alt={clinic.name || 'Clínica dental'}
            priority={priority}
            context="card"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            fallbackSrc={defaultImageUrl}
          />
          
          <div className="absolute top-2 left-2 right-2 flex justify-between items-start z-10">
            <div className="flex flex-col gap-1.5">
               {clinic.is_featured && (
                <div className="bg-background/90 backdrop-blur-md p-1.5 rounded-full shadow-sm border border-border/50 inline-flex">
                   <FiStar className="w-4 h-4 text-amber-500 fill-amber-500" />
                </div>
               )}
               <div className="bg-background/90 backdrop-blur-md px-2 py-1 rounded-md shadow-sm border border-border/50 text-xs font-semibold flex items-center text-foreground w-fit">
                   <FiGrid className="w-3 h-3 mr-1" />
                   {clinic.number_of_cubicles || 1} {clinic.number_of_cubicles === 1 ? 'Cubículo' : 'Cubículos'}
               </div>
            </div>
            <FavoriteButton clinicId={clinic.id} size="sm" />
          </div>
           
           <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/70 to-transparent flex items-end justify-center pb-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
              <Button 
                size="sm"
                className="w-4/5 text-sm bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg pointer-events-auto"
                onClick={(e) => {
                  e.stopPropagation();
                  onClick && onClick();
                }}
              >
                Ver Disponibilidad
              </Button>
          </div>
        </div>
        <CardContent className="pt-3 pb-3 flex-grow flex flex-col">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-base truncate text-foreground flex-1">{clinic.name}</h3>
            {clinic.rating && (
                <div className="flex items-center text-xs font-bold text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded">
                    <FiStar className="w-3 h-3 fill-current mr-1" />
                    {clinic.rating}
                </div>
            )}
          </div>
          <p className="text-sm text-muted-foreground truncate flex items-center gap-1">
            <FiMapPin className="w-3 h-3" />
            {clinic.sector}, {clinic.municipality || clinic.address_city}
          </p>
          <div className="flex items-center justify-between mt-auto pt-2">
            <div className="flex items-center gap-1.5">
               <p className="text-sm text-foreground">
                 <span className="font-bold text-[hsl(var(--booking-price-green-light))]">{formatPrice(clinic.price_per_hour)}</span> <span className="text-muted-foreground">/ hora</span>
               </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

ClinicCard.displayName = 'ClinicCard';

export default ClinicCard;