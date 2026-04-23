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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { Loader2, PlusCircle } from 'lucide-react';

const AddPaymentMethodDialog = ({ open, onOpenChange, userId, onMethodAdded }) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [cardType, setCardType] = useState('');
  const [last4, setLast4] = useState('');
  const [expiryMonth, setExpiryMonth] = useState('');
  const [expiryYear, setExpiryYear] = useState('');

  const resetForm = () => {
    setCardType('');
    setLast4('');
    setExpiryMonth('');
    setExpiryYear('');
  };

  const handleOpenChange = (isOpen) => {
    if (!isOpen) {
      resetForm();
    }
    onOpenChange(isOpen);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!cardType || !last4 || !expiryMonth || !expiryYear) {
      toast({
        variant: 'destructive',
        title: 'Campos incompletos',
        description: 'Por favor, completa todos los campos.',
      });
      return;
    }
    setIsLoading(true);

    try {
      // In a real scenario, you would get a token from a payment gateway (e.g., Stripe)
      // and save that token instead of card details.
      // For this simulation, we'll generate a fake token.
      const fakeGatewayToken = `tok_sim_${Date.now()}`;

      const { data, error } = await supabase
        .from('user_payment_methods')
        .insert({
          user_id: userId,
          card_type: cardType,
          last4: last4,
          expiry_month: parseInt(expiryMonth),
          expiry_year: parseInt(expiryYear),
          gateway_token: fakeGatewayToken,
          is_default: false, // Or logic to set as default if it's the first one
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: '¡Método de pago añadido!',
        description: 'Tu nuevo método de pago se ha guardado correctamente.',
      });
      onMethodAdded(data);
      handleOpenChange(false);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error al guardar',
        description: 'No se pudo añadir el método de pago. ' + error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 15 }, (_, i) => currentYear + i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px] border border-border bg-card rounded-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PlusCircle className="h-6 w-6 text-primary" />
              Añadir Método de Pago
            </DialogTitle>
            <DialogDescription>
              Ingresa los detalles de tu tarjeta. Esta información se guarda de forma segura.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="cardType">Tipo de Tarjeta</Label>
              <Select onValueChange={setCardType} value={cardType} required>
                <SelectTrigger id="cardType" className="rounded-md">
                  <SelectValue placeholder="Selecciona el tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="visa">Visa</SelectItem>
                  <SelectItem value="mastercard">Mastercard</SelectItem>
                  <SelectItem value="amex">American Express</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="last4">Últimos 4 dígitos</Label>
              <Input
                id="last4"
                value={last4}
                onChange={(e) => setLast4(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="1234"
                maxLength="4"
                pattern="\d{4}"
                required
                className="rounded-md"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expiryMonth">Mes Exp.</Label>
                <Select onValueChange={setExpiryMonth} value={expiryMonth} required>
                  <SelectTrigger id="expiryMonth" className="rounded-md">
                    <SelectValue placeholder="Mes" />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map(month => (
                      <SelectItem key={month} value={String(month).padStart(2, '0')}>
                        {String(month).padStart(2, '0')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiryYear">Año Exp.</Label>
                <Select onValueChange={setExpiryYear} value={expiryYear} required>
                  <SelectTrigger id="expiryYear" className="rounded-md">
                    <SelectValue placeholder="Año" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map(year => (
                      <SelectItem key={year} value={String(year)}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={isLoading} className="rounded-md">
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} className="rounded-md">
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Añadir Tarjeta
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddPaymentMethodDialog;