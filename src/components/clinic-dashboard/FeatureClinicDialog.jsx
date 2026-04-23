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
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { featurePlans, USD_TO_DOP_RATE } from '@/lib/featurePlans';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Loader2, Users, Calendar, DollarSign, Star } from 'lucide-react';

const FeatureClinicDialog = ({ clinic, isOpen, onClose }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedPlanId, setSelectedPlanId] = useState(featurePlans[0].id);
  const [isProcessing, setIsProcessing] = useState(false);

  const selectedPlan = featurePlans.find(p => p.id === selectedPlanId);

  const handleCardnetRequest = async () => {
    if (!selectedPlan || !user || !clinic) return;
    setIsProcessing(true);

    try {
      await supabase.from('featured_purchases').insert({
        clinic_id: clinic.id,
        host_id: user.id,
        plan_name: selectedPlan.name,
        plan_duration_days: selectedPlan.durationDays,
        amount_paid: selectedPlan.priceUSD,
        currency: 'USD',
        payment_gateway: 'Cardnet',
        status: 'pending_manual_payment',
      });

      toast({
        title: 'Solicitud de Destaque Enviada',
        description: 'Un administrador se pondrá en contacto contigo para completar el pago a través de Cardnet.',
        duration: 10000,
      });
      onClose();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error al procesar la solicitud',
        description: error.message,
      });
    } finally {
      setIsProcessing(false);
    }
  };


  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isProcessing && onClose(open)}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center">
            <Star className="w-6 h-6 mr-2 text-yellow-400" /> Destacar Clínica: {clinic?.name}
          </DialogTitle>
          <DialogDescription>
            Elige un plan para aumentar la visibilidad de tu clínica en nuestra página de inicio.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <RadioGroup value={selectedPlanId} onValueChange={setSelectedPlanId} disabled={isProcessing}>
            <div className="space-y-3">
              {featurePlans.map((plan) => (
                <Label
                  key={plan.id}
                  htmlFor={plan.id}
                  className={`flex flex-col sm:flex-row items-start sm:items-center justify-between rounded-lg border p-4 transition-all cursor-pointer ${selectedPlanId === plan.id ? 'border-primary ring-2 ring-primary' : 'border-border'} ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center mb-2 sm:mb-0">
                    <RadioGroupItem value={plan.id} id={plan.id} className="mr-4" />
                    <div>
                      <p className="font-bold text-lg text-primary">${plan.priceUSD.toFixed(2)} USD</p>
                      <div className="text-sm text-muted-foreground flex items-center mt-1">
                        <Users className="w-4 h-4 mr-2" /> Alcance: {plan.reach}
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center">
                        <Calendar className="w-4 h-4 mr-2" /> {plan.durationDays} días de campaña
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground sm:text-right max-w-xs pl-8 sm:pl-0">{plan.description}</p>
                </Label>
              ))}
            </div>
          </RadioGroup>
        </div>

        <DialogFooter>
            <div className="w-full mt-4">
              <div className="text-center p-4 border rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">
                  Un administrador te contactará con un link de pago de Cardnet. La activación será manual tras confirmar el pago.
                </p>
              </div>
              <Button
                className="w-full mt-4"
                onClick={handleCardnetRequest}
                disabled={isProcessing}
              >
                {isProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <DollarSign className="w-4 h-4 mr-2" />}
                Solicitar Pago por RD${(selectedPlan.priceUSD * USD_TO_DOP_RATE).toFixed(2)}
              </Button>
            </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FeatureClinicDialog;