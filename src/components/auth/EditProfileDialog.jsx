import React, { useState, useEffect } from 'react';
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
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { Loader2 } from 'lucide-react';

const EditProfileDialog = ({ open, onOpenChange, profileData, onProfileUpdate }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (profileData) {
      setFullName(profileData.full_name || '');
      setPhone(profileData.phone || '');
    }
  }, [profileData, open]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!user) return;
    setIsLoading(true);

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        phone: phone,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    setIsLoading(false);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error al actualizar',
        description: 'No se pudo guardar tu información. ' + error.message,
      });
    } else {
      toast({
        title: '¡Perfil actualizado!',
        description: 'Tu información ha sido guardada exitosamente.',
      });
      if (onProfileUpdate) {
        onProfileUpdate();
      }
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] border border-border bg-card rounded-lg">
        <form onSubmit={handleUpdateProfile}>
          <DialogHeader>
            <DialogTitle>Editar Perfil</DialogTitle>
            <DialogDescription>
              Realiza cambios en tu perfil aquí. Haz clic en guardar cuando termines.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="fullName" className="text-right">
                Nombre
              </Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="col-span-3 rounded-md"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right">
                Teléfono
              </Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="col-span-3 rounded-md"
              />
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Correo
              </Label>
              <Input
                id="email"
                value={user?.email || ''}
                className="col-span-3 rounded-md"
                disabled
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading} className="rounded-md">
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} className="rounded-md">
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Guardar cambios
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditProfileDialog;