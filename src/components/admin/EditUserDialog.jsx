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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { Loader2 } from 'lucide-react';

const EditUserDialog = ({ user, isOpen, onOpenChange, onUserUpdated }) => {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    role: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        email: user.email || '',
        role: user.role || 'dentist',
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleRoleChange = (value) => {
    setFormData((prev) => ({ ...prev, role: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    setIsSaving(true);

    try {
      // 1. Update non-sensitive profile data in 'profiles' table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          role: formData.role,
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // 2. If email is changed, call the admin edge function to update it in auth.users and profiles
      if (formData.email !== user.email) {
        const { error: functionError } = await supabase.functions.invoke('admin-user-actions', {
          body: {
            action: 'update',
            userId: user.id,
            updates: { email: formData.email },
          },
        });
        if (functionError) {
            const errorBody = await functionError.context.json();
            throw new Error(errorBody.error || 'Edge function returned an error.');
        }
      }

      toast({
        title: 'Usuario actualizado',
        description: 'La información del usuario ha sido actualizada exitosamente.',
      });
      onUserUpdated();
      onOpenChange(false);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error al actualizar',
        description: error.message || 'No se pudo actualizar el usuario.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
            <DialogDescription>
              Realiza cambios en el perfil del usuario. Haz clic en guardar cuando termines.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="full_name" className="text-right">
                Nombre
              </Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={handleChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">
                Rol
              </Label>
              <Select value={formData.role} onValueChange={handleRoleChange}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecciona un rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dentist">Dentista</SelectItem>
                  <SelectItem value="clinic_host">Anfitrión</SelectItem>
                  <SelectItem value="accountant">Contable</SelectItem>
                  <SelectItem value="support">Soporte</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Guardar Cambios'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditUserDialog;