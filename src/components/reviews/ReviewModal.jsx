import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import ReviewStars from './ReviewStars';
import { Loader2, Send, Droplet, CheckCircle, MapPin, DollarSign, Heart } from 'lucide-react';

const ReviewModal = ({ isOpen, onClose, clinicId, userId, onReviewSubmitted }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [ratings, setRatings] = useState({
    cleanliness: 0,
    exactitude: 0,
    location: 0,
    price: 0,
    general_experience: 0
  });
  const [comment, setComment] = useState('');

  // Configuration for icons and colors per category
  const categoryConfig = {
    cleanliness: { icon: Droplet, color: 'text-blue-500', bg: 'bg-blue-50' },
    exactitude: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50' },
    location: { icon: MapPin, color: 'text-red-500', bg: 'bg-red-50' },
    price: { icon: DollarSign, color: 'text-yellow-500', bg: 'bg-yellow-50' },
    general_experience: { icon: Heart, color: 'text-purple-500', bg: 'bg-purple-50' },
  };

  useEffect(() => {
    setQuestions([
      { key: 'cleanliness', label: 'Limpieza' },
      { key: 'exactitude', label: 'Exactitud' },
      { key: 'location', label: 'Ubicación' },
      { key: 'price', label: 'Precio' },
      { key: 'general_experience', label: 'Experiencia General' },
    ]);
  }, []);

  const handleRatingChange = (key, value) => {
    setRatings(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    const missingRatings = Object.entries(ratings).filter(([_, val]) => val === 0);
    if (missingRatings.length > 0) {
      toast({
        variant: "destructive",
        title: "Calificación incompleta",
        description: "Por favor califica todas las categorías."
      });
      return;
    }

    setLoading(true);
    try {
      const values = Object.values(ratings);
      const overallRating = values.reduce((a, b) => a + b, 0) / values.length;

      const { error } = await supabase
        .from('clinic_reviews')
        .insert({
          clinic_id: clinicId,
          user_id: userId,
          rating: parseFloat(overallRating.toFixed(2)),
          cleanliness: ratings.cleanliness,
          exactitude: ratings.exactitude,
          location: ratings.location,
          price: ratings.price,
          general_experience: ratings.general_experience,
          comment: comment,
        });

      if (error) throw error;

      toast({
        title: "¡Reseña enviada!",
        description: "Gracias por compartir tu experiencia.",
      });

      if (onReviewSubmitted) onReviewSubmitted();
      onClose();
      setRatings({
        cleanliness: 0,
        exactitude: 0,
        location: 0,
        price: 0,
        general_experience: 0
      });
      setComment('');

    } catch (error) {
      console.error('Error submitting review:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo enviar la reseña. Inténtalo de nuevo."
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto p-0 gap-0 border-none shadow-2xl rounded-2xl bg-white">
        <DialogHeader className="px-8 pt-10 pb-4 flex flex-col items-center border-b bg-gradient-to-b from-white to-gray-50/50">
          <div className="bg-primary/10 p-4 rounded-full mb-4 shadow-inner ring-4 ring-white">
            <Send className="w-8 h-8 text-primary" />
          </div>
          <DialogTitle className="text-center text-3xl font-bold tracking-tight text-gray-900">
            ¿Cómo fue tu experiencia?
          </DialogTitle>
          <DialogDescription className="text-center text-base text-gray-500 mt-2 max-w-sm mx-auto">
            Tu opinión ayuda a otros odontólogos a elegir el mejor consultorio.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-8 space-y-6 bg-white">
          <div className="space-y-5">
            {questions.map((q) => {
              const config = categoryConfig[q.key] || { icon: CheckCircle, color: 'text-gray-500', bg: 'bg-gray-100' };
              const Icon = config.icon;

              return (
                <div 
                  key={q.key} 
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100 group"
                >
                  <label className="flex items-center gap-4 mb-3 sm:mb-0 cursor-pointer w-full sm:w-auto" onClick={() => {}}>
                    <div className={`p-2.5 rounded-full ${config.bg} transition-transform group-hover:scale-110 duration-300 shrink-0`}>
                      <Icon className={`w-6 h-6 ${config.color}`} />
                    </div>
                    <div>
                      <span className="block text-lg font-semibold text-gray-700">{q.label}</span>
                      {ratings[q.key] > 0 && (
                        <span className={`text-xs font-bold ${config.color} animate-in fade-in zoom-in duration-300`}>
                          {ratings[q.key]} / 5
                        </span>
                      )}
                    </div>
                  </label>
                  
                  <div className="flex justify-center sm:justify-end">
                    <ReviewStars 
                      value={ratings[q.key]} 
                      onChange={(val) => handleRatingChange(q.key, val)}
                      size="xl" 
                      interactive={true}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="space-y-3 pt-4 border-t border-dashed">
            <label className="text-base font-semibold text-gray-700 flex items-center gap-2">
              Comentario adicional <span className="text-gray-400 font-normal text-sm">(Opcional)</span>
            </label>
            <Textarea 
              placeholder="Comparte más detalles sobre las instalaciones, el equipo y el trato recibido..." 
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="resize-none min-h-[100px] rounded-lg border-2 border-input bg-gray-50/50 px-4 py-3 text-base shadow-sm transition-all focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:outline-none"
            />
          </div>
        </div>

        <DialogFooter className="px-8 pb-8 pt-4 bg-gray-50/50 sm:justify-between items-center border-t flex-col-reverse sm:flex-row gap-3">
           <Button 
            variant="ghost" 
            onClick={onClose} 
            disabled={loading}
            className="text-gray-500 hover:text-gray-700 hover:bg-gray-200/50 font-medium text-base px-6 h-12 w-full sm:w-auto"
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={loading} 
            className="w-full sm:w-auto h-12 px-8 text-base font-bold bg-gradient-to-r from-primary to-primary/90 hover:to-primary text-primary-foreground shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 rounded-full"
          >
            {loading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Send className="w-5 h-5 mr-2" />}
            Enviar Reseña
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReviewModal;