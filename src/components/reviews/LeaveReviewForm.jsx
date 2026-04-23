import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Star, Loader2 } from 'lucide-react';

const LeaveReviewForm = ({ clinic, isOpen, onClose, onReviewSubmitted }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({
        variant: 'destructive',
        title: 'Calificación requerida',
        description: 'Por favor, selecciona al menos una estrella.',
      });
      return;
    }
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('reviews').insert({
        clinic_id: clinic.id,
        dentist_id: user.id,
        rating,
        comment,
      });

      if (error) throw error;

      toast({
        title: '¡Reseña enviada!',
        description: 'Gracias por compartir tu experiencia.',
      });
      onReviewSubmitted();
      onClose();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error al enviar la reseña',
        description: error.code === '23505' ? 'Ya has dejado una reseña para esta clínica.' : error.message,
      });
    } finally {
      setIsSubmitting(false);
      setRating(0);
      setComment('');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dejar una reseña para {clinic?.name}</DialogTitle>
          <DialogDescription>
            Tu opinión es importante para nuestra comunidad.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Calificación</Label>
            <div className="flex items-center space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`cursor-pointer transition-colors ${
                    (hoverRating || rating) >= star
                      ? 'text-yellow-400 fill-yellow-400'
                      : 'text-gray-300 dark:text-gray-600'
                  }`}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                />
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="comment">Comentario (Opcional)</Label>
            <Textarea
              id="comment"
              placeholder="Describe tu experiencia..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || rating === 0}>
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Enviar Reseña
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LeaveReviewForm;