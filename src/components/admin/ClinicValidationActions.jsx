import React, { useState } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Check, X } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const ClinicValidationActions = ({ clinicId, onActionComplete }) => {
  const [loadingAction, setLoadingAction] = useState(null);
  const { toast } = useToast();

  const handleUpdateStatus = async (status) => {
    setLoadingAction(status);
    try {
      const { error } = await supabase
        .from('clinics')
        .update({ status })
        .eq('id', clinicId);

      if (error) throw error;

      toast({
        title: `Clínica ${status === 'published' ? 'Aprobada' : 'Rechazada'}`,
        description: `La clínica ha sido ${status === 'published' ? 'publicada' : 'rechazada'} exitosamente.`,
      });
      onActionComplete();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error en la acción',
        description: error.message,
      });
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="w-full flex gap-2">
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="outline"
            className="w-full text-red-500 border-red-500 hover:bg-red-50 hover:text-red-600"
            disabled={!!loadingAction}
          >
            <X className="mr-2 h-4 w-4" />
            Rechazar
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Seguro que quieres rechazar esta clínica?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción marcará la clínica como rechazada y no será visible para los usuarios. Esta acción no se puede deshacer fácilmente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => handleUpdateStatus('rejected')}
            >
              Sí, rechazar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Button
        className="w-full"
        onClick={() => handleUpdateStatus('published')}
        disabled={!!loadingAction}
        isLoading={loadingAction === 'published'}
      >
        <Check className="mr-2 h-4 w-4" />
        {loadingAction === 'published' ? 'Aprobando...' : 'Aprobar'}
      </Button>
    </div>
  );
};

export default ClinicValidationActions;