import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabaseClient } from '@/config/supabaseConfig';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Edit, BarChart2, PlusCircle, Star, ImageOff, Clock } from 'lucide-react';
import FeatureClinicDialog from './FeatureClinicDialog';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const statusStyles = {
  published: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  draft: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
};

const statusTranslations = {
  published: 'Publicada',
  pending: 'Pendiente',
  rejected: 'Rechazada',
  draft: 'Borrador',
};

const MyClinics = () => {
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isFeatureDialogOpen, setIsFeatureDialogOpen] = useState(false);
  const [selectedClinic, setSelectedClinic] = useState(null);

  const fetchClinics = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('clinics')
        .select(`
          *,
          clinic_photos ( photo_url, is_cover )
        `)
        .eq('host_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClinics(data.map(c => {
        const photos = c.clinic_photos || [];
        const coverPhoto = photos.find(p => p.is_cover) || photos[0];
        
        // Calculate if feature is active based on dates
        const isFeaturedActive = c.is_featured && c.featured_until && new Date(c.featured_until) > new Date();

        return {
          ...c,
          cover_image_url: coverPhoto ? coverPhoto.photo_url : null,
          is_featured_active: isFeaturedActive,
        }
      }));
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error al cargar clínicas',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClinics();
  }, [user, toast]);

  const handleActionClick = (action) => {
     toast({
        title: "🚧 ¡Función en desarrollo!",
        description: `La funcionalidad de "${action}" se implementará próximamente.`,
      });
  }

  const handleFeatureClick = (clinic) => {
    if (clinic.status !== 'published') {
      toast({
        variant: 'destructive',
        title: 'Acción no permitida',
        description: 'Solo puedes destacar clínicas que ya han sido publicadas.',
      });
      return;
    }
    setSelectedClinic(clinic);
    setIsFeatureDialogOpen(true);
  };

  const handleEditClick = (clinicId) => {
    navigate(`/clinic-dashboard/edit/${clinicId}`);
  };

  const handleStatsClick = (clinicId) => {
    navigate(`/clinic-dashboard/statistics/${clinicId}`);
  };

  const onFeatureDialogClose = () => {
    setIsFeatureDialogOpen(false);
    setSelectedClinic(null);
    fetchClinics(); 
  };


  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <Card className="glassmorphism">
        <CardHeader>
          <CardTitle>Mis Clínicas</CardTitle>
          <CardDescription>Aquí puedes ver y gestionar todas tus clínicas publicadas.</CardDescription>
        </CardHeader>
        <CardContent>
          {clinics.length > 0 ? (
            <div className="space-y-4">
              {clinics.map((clinic) => (
                <Card key={clinic.id} className="overflow-hidden transition-shadow hover:shadow-lg bg-card/80 backdrop-blur-sm">
                  <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      {/* Robust Image Handling Container */}
                      <div className="relative w-24 h-16 flex-shrink-0 bg-muted rounded-md overflow-hidden">
                        {clinic.cover_image_url ? (
                            <img
                                src={clinic.cover_image_url}
                                alt={`Foto de ${clinic.name}`}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                }}
                            />
                        ) : null}
                        
                        <div 
                            className="absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground"
                            style={{ display: clinic.cover_image_url ? 'none' : 'flex' }}
                        >
                            <ImageOff className="w-6 h-6 opacity-50" />
                        </div>
                      </div>

                      <div className="flex-grow">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                          <p className="font-semibold text-lg text-primary">{clinic.name}</p>
                          {clinic.is_featured_active && (
                            <div className="flex items-center text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                <Star className="w-3 h-3 mr-1 fill-amber-500 text-amber-500" />
                                <span>Destacada hasta {format(new Date(clinic.featured_until), "d 'de' MMMM", { locale: es })}</span>
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{clinic.address_street}, {clinic.address_city}</p>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                        <div className={`text-xs font-medium px-3 py-1.5 rounded-md text-center ${statusStyles[clinic.status] || statusStyles.draft}`}>
                            {statusTranslations[clinic.status] || clinic.status}
                        </div>
                        <Button variant="outline" size="sm" onClick={() => handleFeatureClick(clinic)}>
                            <Star className="w-4 h-4 mr-2" /> {clinic.is_featured_active ? 'Extender Destacado' : 'Destacar'}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleEditClick(clinic.id)}>
                            <Edit className="w-4 h-4 mr-2" /> Editar
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleStatsClick(clinic.id)}>
                            <BarChart2 className="w-4 h-4 mr-2" /> Estadísticas
                        </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 border-2 border-dashed border-border/60 rounded-lg bg-background/30">
              <h3 className="text-lg font-semibold">No tienes clínicas publicadas</h3>
              <p className="text-muted-foreground mt-1 mb-4">¡Empieza publicando tu primer espacio!</p>
              <Button onClick={() => handleActionClick("Publicar Clínica")}>
                <PlusCircle className="w-4 h-4 mr-2" /> Publicar Clínica
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      {selectedClinic && (
        <FeatureClinicDialog
          clinic={selectedClinic}
          isOpen={isFeatureDialogOpen}
          onClose={onFeatureDialogClose}
        />
      )}
    </motion.div>
  );
};

export default MyClinics;