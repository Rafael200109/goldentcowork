import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { supabaseClient } from '@/config/supabaseConfig';
import { Loader2, Plus, UserPlus } from 'lucide-react';

const CreateUserDialog = ({ onUserCreated }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'support'
  });

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleRoleChange = (value) => {
    setFormData(prev => ({ ...prev, role: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (formData.password.length < 6) {
        throw new Error('La contraseña debe tener al menos 6 caracteres');
      }

      const { data, error } = await supabaseClient.functions.invoke('admin-create-user', {
        body: formData
      });

      if (error) {
         // Try to parse detailed error if available
         try {
             const errorBody = JSON.parse(error.message); 
             throw new Error(errorBody.error || error.message);
         } catch(e) {
             throw new Error(error.message || 'Error al invocar la función de creación');
         }
      }

      if (data && data.error) {
          throw new Error(data.error);
      }

      toast({
        title: "Usuario creado exitosamente",
        description: `Se ha creado el usuario ${formData.fullName} con el rol de ${getRoleLabel(formData.role)}.`,
        variant: "success"
      });

      setIsOpen(false);
      setFormData({
        fullName: '',
        email: '',
        password: '',
        role: 'support'
      });
      
      if (onUserCreated) onUserCreated();

    } catch (error) {
      console.error('Error creating user:', error);
      toast({
        title: "Error al crear usuario",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleLabel = (role) => {
    switch(role) {
      case 'support': return 'Soporte';
      case 'accountant': return 'Contable';
      case 'admin': return 'Administrador';
      case 'dentist': return 'Odontólogo';
      case 'clinic_host': return 'Anfitrión';
      default: return role;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary/90 text-white">
          <UserPlus className="mr-2 h-4 w-4" />
          Crear Usuario
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Crear Nuevo Usuario</DialogTitle>
            <DialogDescription>
              Añade un nuevo usuario al sistema. La cuenta se activará inmediatamente.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-6 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="fullName" className="text-right">
                Nombre Completo
              </Label>
              <Input
                id="fullName"
                placeholder="Ej. Juan Pérez"
                value={formData.fullName}
                onChange={handleChange}
                className="col-span-3"
                required
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="juan@ejemplo.com"
                value={formData.email}
                onChange={handleChange}
                className="col-span-3"
                required
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password" className="text-right">
                Contraseña
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={formData.password}
                onChange={handleChange}
                className="col-span-3"
                required
                minLength={6}
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
                  <SelectItem value="support">Soporte</SelectItem>
                  <SelectItem value="accountant">Contable</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="dentist">Odontólogo</SelectItem>
                  <SelectItem value="clinic_host">Anfitrión</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creando...
                </>
              ) : (
                'Crear Usuario'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateUserDialog;