import React, { useState, useEffect, useCallback } from 'react';
    import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
    import { Button } from '@/components/ui/button';
    import { Input } from '@/components/ui/input';
    import { Label } from '@/components/ui/label';
    import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
    import { supabaseClient } from '@/config/supabaseConfig';
    import { useToast } from '@/components/ui/use-toast';
    import { Loader2, Banknote, Save } from 'lucide-react';

    const HostPayoutAccount = ({ user }) => {
      const { toast } = useToast();
      const [loading, setLoading] = useState(true);
      const [saving, setSaving] = useState(false);
      const [account, setAccount] = useState(null);
      const [formData, setFormData] = useState({
        bank_name: '',
        account_holder_name: '',
        account_number: '',
        account_type: '',
        document_type: 'rnc',
        document_number: '',
      });

      const fetchPayoutAccount = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
          const { data, error } = await supabase
            .from('host_payout_accounts')
            .select('*')
            .eq('host_id', user.id)
            .single();

          if (error && error.code !== 'PGRST116') { // PGRST116: "exact one row expected"
            throw error;
          }

          if (data) {
            setAccount(data);
            setFormData({
              bank_name: data.bank_name || '',
              account_holder_name: data.account_holder_name || '',
              account_number: data.account_number || '',
              account_type: data.account_type || '',
              document_type: data.document_type || 'rnc',
              document_number: data.document_number || '',
            });
          }
        } catch (error) {
          toast({
            variant: 'destructive',
            title: 'Error al cargar la cuenta de pago',
            description: error.message,
          });
        } finally {
          setLoading(false);
        }
      }, [user, toast]);

      useEffect(() => {
        fetchPayoutAccount();
      }, [fetchPayoutAccount]);

      const handleInputChange = (e) => {
        const { id, value } = e.target;
        setFormData((prev) => ({ ...prev, [id]: value }));
      };

      const handleSelectChange = (id, value) => {
        setFormData((prev) => ({ ...prev, [id]: value }));
      };

      const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        const payload = {
          ...formData,
          host_id: user.id,
          updated_at: new Date().toISOString(),
        };

        try {
          let error;
          if (account) {
            // Update existing account
            const { error: updateError } = await supabase
              .from('host_payout_accounts')
              .update(payload)
              .eq('id', account.id);
            error = updateError;
          } else {
            // Insert new account
            const { error: insertError } = await supabase
              .from('host_payout_accounts')
              .insert(payload);
            error = insertError;
          }

          if (error) throw error;

          toast({
            title: '¡Cuenta guardada!',
            description: 'Tu información de pago ha sido guardada exitosamente.',
          });
          fetchPayoutAccount(); // Refresh data
        } catch (error) {
          toast({
            variant: 'destructive',
            title: 'Error al guardar',
            description: 'No se pudo guardar tu información de pago. ' + error.message,
          });
        } finally {
          setSaving(false);
        }
      };

      if (loading) {
        return (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        );
      }

      return (
        <Card className="border border-border bg-card rounded-lg">
          <CardHeader>
            <CardTitle className="flex items-center"><Banknote className="mr-2 text-primary"/> Cuenta para Pagos</CardTitle>
            <CardDescription>
              Configura la cuenta bancaria donde recibirás los pagos de tus reservas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="bank_name">Entidad Bancaria</Label>
                  <Input id="bank_name" value={formData.bank_name} onChange={handleInputChange} placeholder="Ej: Banco Popular Dominicano" required className="rounded-md" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="account_holder_name">Nombre del Titular</Label>
                  <Input id="account_holder_name" value={formData.account_holder_name} onChange={handleInputChange} placeholder="Nombre completo como aparece en la cuenta" required className="rounded-md" />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="account_number">Número de Cuenta</Label>
                  <Input id="account_number" value={formData.account_number} onChange={handleInputChange} placeholder="Número de cuenta bancaria" required className="rounded-md" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="account_type">Tipo de Cuenta</Label>
                  <Select onValueChange={(value) => handleSelectChange('account_type', value)} value={formData.account_type} required>
                    <SelectTrigger id="account_type" className="rounded-md">
                      <SelectValue placeholder="Selecciona un tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ahorros">Ahorros</SelectItem>
                      <SelectItem value="corriente">Corriente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="document_type">Tipo de Documento</Label>
                  <Select onValueChange={(value) => handleSelectChange('document_type', value)} value={formData.document_type} required>
                    <SelectTrigger id="document_type" className="rounded-md">
                      <SelectValue placeholder="Selecciona un tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rnc">RNC</SelectItem>
                      <SelectItem value="cedula">Cédula</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="document_number">Número de Documento</Label>
                  <Input id="document_number" value={formData.document_number} onChange={handleInputChange} placeholder="Número de RNC o Cédula" required className="rounded-md" />
                </div>
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={saving} className="rounded-md">
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  {account ? 'Actualizar Cuenta' : 'Guardar Cuenta'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      );
    };

    export default HostPayoutAccount;