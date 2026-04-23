import React from 'react';
import PhotoCarouselContainer from '../booking/carousel/PhotoCarouselContainer';

const MOCK_PHOTOS = [
  { id: 1, photo_url: 'https://images.unsplash.com/photo-1616391182219-e080b4d1043a?q=80&w=1200&auto=format&fit=crop' },
  { id: 2, photo_url: 'https://images.unsplash.com/photo-1629909613638-0e4a1fad8f81?q=80&w=1200&auto=format&fit=crop' },
  { id: 3, photo_url: 'https://images.unsplash.com/photo-1629909615957-be38d48fbbe6?q=80&w=1200&auto=format&fit=crop' },
  { id: 4, photo_url: 'https://images.unsplash.com/photo-1643660527070-03ed14b41677?q=80&w=1200&auto=format&fit=crop' },
  { id: 5, photo_url: 'https://images.unsplash.com/photo-1698892472793-c8e24cfbb2bf?q=80&w=1200&auto=format&fit=crop' },
  { id: 6, photo_url: 'https://images.unsplash.com/photo-1666056445151-57949bacdd60?q=80&w=1200&auto=format&fit=crop' },
  { id: 7, photo_url: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?q=80&w=1200&auto=format&fit=crop' },
  { id: 8, photo_url: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=1200&auto=format&fit=crop' },
];

export const PhotoCarouselExample = () => {
  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-12">
      <div>
        <h2 className="text-2xl font-bold mb-4">Ejemplo de Carrusel (Tamaño Completo)</h2>
        <p className="text-muted-foreground mb-6">Este es el componente de carrusel por defecto, ideal para la página de detalles de la clínica.</p>
        <PhotoCarouselContainer photos={MOCK_PHOTOS} />
      </div>

      <div className="max-w-3xl">
        <h2 className="text-2xl font-bold mb-4">Ejemplo de Carrusel (Contenedor Restringido)</h2>
        <p className="text-muted-foreground mb-6">El carrusel se adapta automáticamente al ancho de su contenedor padre manteniendo la proporción.</p>
        <PhotoCarouselContainer photos={MOCK_PHOTOS.slice(0, 4)} />
      </div>
      
      <div>
        <h2 className="text-2xl font-bold mb-4">Ejemplo Vacío</h2>
        <p className="text-muted-foreground mb-6">Manejo seguro cuando no hay fotos disponibles.</p>
        <PhotoCarouselContainer photos={[]} />
      </div>
    </div>
  );
};

export default PhotoCarouselExample;