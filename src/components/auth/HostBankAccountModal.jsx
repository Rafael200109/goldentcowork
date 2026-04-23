import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import HostBankAccountForm from './HostBankAccountForm';
import { useHostBankAccount } from '@/hooks/useHostBankAccount';
import { useToast } from '@/components/ui/use-toast';

const HostBankAccountModal = ({ open, onOpenChange, account, onSuccess }) => {
  const { saveAccount, loading } = useHostBankAccount();
  const { toast } = useToast();

  const handleSubmit = async (data) => {
    try {
      await saveAccount(data);
      toast({
        title: 'Cuenta guardada',
        description: 'La información bancaria ha sido actualizada exitosamente.',
      });
      if (onSuccess) onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error al guardar',
        description: error.message || 'No se pudo guardar la información de la cuenta.',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{account ? 'Editar Cuenta Bancaria' : 'Añadir Cuenta Bancaria'}</DialogTitle>
          <DialogDescription>
            Ingresa la información de tu cuenta para poder recibir los pagos por reservas.
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-4">
          <HostBankAccountForm 
            initialData={account} 
            onSubmit={handleSubmit} 
            onCancel={() => onOpenChange(false)}
            isLoading={loading}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default HostBankAccountModal;