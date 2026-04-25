import React, { useState } from 'react';
import { supabaseClient } from '@/config/supabaseConfig';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { MoreHorizontal, Edit, Trash2, UserX, KeyRound, FileCheck2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import EditUserDialog from './EditUserDialog';
import { useNavigate } from 'react-router-dom';

const UserActions = ({ user, onActionComplete }) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSuspending, setIsSuspending] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSuspendConfirm, setShowSuspendConfirm] = useState(false);

  const handlePasswordReset = async () => {
    setIsResettingPassword(true);
    try {
      let userEmail = user.email;
      if (!userEmail) {
        const { data, error: functionError } = await supabaseClient.functions.invoke('admin-user-actions', {
          body: { action: 'getUser', userId: user.id },
        });

        if (functionError || !data?.data?.user?.email) {
          throw new Error("No se pudo obtener el email del usuario.");
        }
        userEmail = data.data.user.email;
      }

      if (!userEmail) {
        throw new Error("El usuario no tiene un correo electrónico registrado.");
      }

      const { error } = await supabaseClient.auth.resetPasswordForEmail(userEmail, {
        redirectTo: `${window.location.origin}/update-password`,
      });
      if (error) throw error;
      toast({
        title: 'Enlace de restablecimiento enviado',
        description: `Se ha enviado un enlace para restablecer la contraseña a ${userEmail}.`,
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error al enviar el enlace',
        description: error.message,
      });
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleSuspend = async () => {
    setIsSuspending(true);
    try {
      const { error } = await supabaseClient.functions.invoke('admin-user-actions', {
        body: { action: 'suspend', userId: user.id },
      });
      if (error) throw error;
      toast({
        title: 'Usuario suspendido',
        description: `${user.full_name || user.email} ha sido suspendido temporalmente.`,
      });
      onActionComplete();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error al suspender',
        description: error.message,
      });
    } finally {
      setIsSuspending(false);
      setShowSuspendConfirm(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      // First, delete from profiles table due to RLS
      const { error: profileError } = await supabaseClient.from('profiles').delete().eq('id', user.id);
      if (profileError) throw profileError;

      // Then, delete from auth.users
      const { error: authError } = await supabaseClient.functions.invoke('admin-user-actions', {
        body: { action: 'delete', userId: user.id },
      });
      if (authError) {
        // Re-insert profile if auth deletion fails? Or handle differently.
        // For now, we just log the error.
        console.error("Auth user deletion failed, but profile was deleted:", authError);
        throw new Error("Error en la eliminación del usuario de autenticación.");
      }

      toast({
        title: 'Usuario eliminado',
        description: `${user.full_name || user.email} ha sido eliminado permanentemente.`,
      });
      onActionComplete();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error al eliminar',
        description: error.message,
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const canValidateDocuments = user.role === 'dentist' && 
    (user.documentation_status === 'pending_review' || user.documentation_status === 'not_submitted');

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Abrir menú</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Acciones</DropdownMenuLabel>
          {canValidateDocuments && (
            <DropdownMenuItem onClick={() => navigate(`/admin/users/${user.id}/documents`)}>
              <FileCheck2 className="mr-2 h-4 w-4 text-blue-500" />
              <span>Validar Documentos</span>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
            <Edit className="mr-2 h-4 w-4" />
            <span>Editar</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handlePasswordReset} disabled={isResettingPassword}>
            <KeyRound className="mr-2 h-4 w-4" />
            <span>{isResettingPassword ? 'Enviando...' : 'Restablecer Contraseña'}</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowSuspendConfirm(true)}>
            <UserX className="mr-2 h-4 w-4" />
            <span>Suspender</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-red-600 focus:text-red-600 focus:bg-red-50"
            onClick={() => setShowDeleteConfirm(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            <span>Eliminar</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditUserDialog
        user={user}
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onUserUpdated={onActionComplete}
      />

      <AlertDialog open={showSuspendConfirm} onOpenChange={setShowSuspendConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro de suspender a este usuario?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción suspenderá temporalmente la cuenta del usuario, impidiendo su acceso. Podrás revertir esta acción más tarde.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleSuspend} disabled={isSuspending}>
              {isSuspending ? 'Suspendiendo...' : 'Sí, suspender'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción es irreversible. Se eliminará permanentemente el perfil del usuario y todos sus datos asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Eliminando...' : 'Sí, eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default UserActions;