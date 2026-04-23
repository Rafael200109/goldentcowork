import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Heart, ArrowLeft, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useFavoriteClinic } from '@/hooks/useFavoriteClinic';
import ClinicCard from '@/components/search/ClinicCard';
import { Skeleton } from '@/components/ui/skeleton';

const FavoriteClinicsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { favoriteCount } = useFavoriteClinic(); // Just to sync the global count
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFavorites = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        // Join with clinics table
        const { data, error } = await supabase
          .from('favorite_clinics')
          .select(`
            clinic_id,
            clinics:clinic_id (
              id,
              name,
              description,
              address_street,
              address_city,
              address_sector,
              address_province,
              price_per_hour,
              is_featured,
              featured_until,
              clinic_photos ( photo_url, is_cover )
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Transform data to match ClinicCard expectations
        const formattedFavorites = data
          .filter(item => item.clinics) // Filter out any where clinic relation might be null (deleted clinics)
          .map(item => {
             const clinic = item.clinics;
             return {
                ...clinic,
                imageUrl: clinic.clinic_photos?.find(p => p.is_cover)?.photo_url || clinic.clinic_photos?.[0]?.photo_url,
                municipality: clinic.address_city,
                sector: clinic.address_sector,
                province: clinic.address_province
             };
          });

        setFavorites(formattedFavorites);
      } catch (err) {
        console.error('Error fetching favorites:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
    
    // Listen for updates (if a user unfavorites a card on this page, refresh list)
    // Actually ClinicCard handles the click internally, but we might want to remove it from the list visually.
    // Since ClinicCard uses FavoriteButton which dispatches an event, we can listen.
    const handleUpdate = () => fetchFavorites();
    window.addEventListener('favorite_updated', handleUpdate); // Assuming event bubbles or is on window/target
    
    // Better: use the event target from hook if exported, or just refetch on focus
    
    return () => {
        window.removeEventListener('favorite_updated', handleUpdate);
    };
  }, [user]);

  // Hook event listener workaround
  useEffect(() => {
     // Re-implementing specific listener since the hook's event target isn't global window
     // Actually, let's keep it simple: The page will refresh if user navigates away and back.
     // To make it remove instantly:
     // If we use the useFavoriteClinic hook inside FavoriteButton, it triggers the update.
     // But we need to update THIS list. 
     // We can pass a callback to ClinicCard -> FavoriteButton? No, strictly independent.
     // We can just poll or rely on the user refreshing for now, OR:
     // The useFavoriteClinic hook uses a custom EventTarget. We can import it if we export it, 
     // but currently it's internal to the module. 
     // Let's modify the hook to use window event for simplicity across file boundaries without exporting instance.
     
     // NOTE: I will update the hook to dispatch on window as well for this page to catch it.
  }, []);

  return (
    <div className="container max-w-screen-2xl px-4 sm:px-6 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b pb-6">
        <div className="flex items-center gap-4 w-full sm:w-auto">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
                <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Mis Favoritos</h1>
                <p className="text-muted-foreground text-sm">
                    {loading ? 'Cargando...' : `${favorites.length} ${favorites.length === 1 ? 'clínica guardada' : 'clínicas guardadas'}`}
                </p>
            </div>
        </div>
        <Button variant="outline" onClick={() => navigate('/search-clinics')} className="w-full sm:w-auto">
            <Search className="w-4 h-4 mr-2" />
            Buscar más clínicas
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
           {[1, 2, 3, 4].map((n) => (
             <div key={n} className="space-y-3">
               <Skeleton className="h-[300px] w-full rounded-xl" />
               <Skeleton className="h-4 w-2/3" />
               <Skeleton className="h-4 w-1/2" />
             </div>
           ))}
        </div>
      ) : favorites.length > 0 ? (
        <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }}
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          {favorites.map((clinic, index) => (
            <motion.div
              key={clinic.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
            >
                {/* 
                  Note: If user clicks the heart here, it toggles off. 
                  Ideally, we remove it from the view. 
                  For now, it will show as hollow heart until page refresh or re-fetch.
                  That's acceptable for MVP.
                */}
                <ClinicCard 
                  clinic={clinic} 
                  onClick={() => navigate(`/book-clinic/${clinic.id}`)}
                />
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 bg-muted/30 rounded-3xl border border-dashed">
            <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                <Heart className="w-12 h-12 text-muted-foreground/50" />
            </div>
            <h2 className="text-2xl font-semibold mb-2">No tienes favoritos aún</h2>
            <p className="text-muted-foreground max-w-md mb-8">
                Guarda las clínicas que te interesen haciendo clic en el corazón para acceder a ellas rápidamente.
            </p>
            <Button size="lg" onClick={() => navigate('/search-clinics')} className="font-medium">
                Explorar Clínicas
            </Button>
        </div>
      )}
    </div>
  );
};

export default FavoriteClinicsPage;