import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import ReviewStars from './ReviewStars';
import { Progress } from '@/components/ui/progress';
import { Loader2, Smile, Outdent as Tooth, MapPin, Tag, Heart, Star, ThumbsUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const ReviewStats = ({ clinicId }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!clinicId) return;
      
      try {
        const { data, error } = await supabase
          .from('clinic_reviews')
          .select('*')
          .eq('clinic_id', clinicId);

        if (error) throw error;

        if (!data || data.length === 0) {
          setStats(null);
          return;
        }

        const count = data.length;
        const sum = (key) => data.reduce((acc, curr) => acc + (curr[key] || 0), 0);
        
        const averages = {
          rating: sum('rating') / count,
          cleanliness: sum('cleanliness') / count,
          exactitude: sum('exactitude') / count,
          location: sum('location') / count,
          price: sum('price') / count,
          general_experience: sum('general_experience') / count,
          count
        };

        setStats(averages);
      } catch (err) {
        console.error("Error fetching review stats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [clinicId]);

  if (loading) return <div className="py-2 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  if (!stats) return null;

  const categories = [
    { label: 'Limpieza', value: stats.cleanliness, icon: <Smile className="w-4 h-4" /> },
    { label: 'Exactitud', value: stats.exactitude, icon: <Tooth className="w-4 h-4" /> },
    { label: 'Ubicación', value: stats.location, icon: <MapPin className="w-4 h-4" /> },
    { label: 'Precio', value: stats.price, icon: <Tag className="w-4 h-4" /> },
    { label: 'Experiencia', value: stats.general_experience, icon: <Heart className="w-4 h-4" /> },
  ];

  return (
    <Card className="border-none shadow-none bg-transparent">
      <CardContent className="p-0">
        <div className="flex flex-col md:flex-row gap-6 items-center md:items-start justify-center border-b pb-6 mb-6 border-border/50">
          
          {/* Main Rating */}
          <div className="flex flex-col items-center justify-center min-w-[180px]">
             <div className="text-5xl font-bold text-foreground mb-1 flex items-center">
                <Star className="w-8 h-8 mr-2 text-amber-500 fill-amber-500" />
                {stats.rating.toFixed(2)}
             </div>
             <ReviewStars value={stats.rating} size="lg" className="mb-1" />
             <div className="text-muted-foreground font-medium text-sm flex items-center gap-1">
               <ThumbsUp className="w-3 h-3" />
               Favorito entre dentistas
             </div>
             <div className="text-xs text-muted-foreground mt-0.5">
               {stats.count} {stats.count === 1 ? 'reseña' : 'reseñas'}
             </div>
          </div>

          {/* Breakdown Grid */}
          <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-3">
             {categories.map((cat) => (
               <div key={cat.label} className="flex items-center justify-between gap-3">
                 <div className="flex items-center gap-2 min-w-[90px]">
                    <span className="text-muted-foreground scale-90">{cat.icon}</span>
                    <span className="text-xs font-medium">{cat.label}</span>
                 </div>
                 <div className="flex items-center gap-3 flex-1">
                    <Progress value={(cat.value / 5) * 100} className="h-1.5 flex-1" />
                    <span className="text-xs font-bold w-6 text-right">{cat.value.toFixed(1)}</span>
                 </div>
               </div>
             ))}
          </div>

        </div>
      </CardContent>
    </Card>
  );
};

export default ReviewStats;