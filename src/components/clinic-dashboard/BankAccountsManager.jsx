import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Landmark, PlusCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useHostBankAccount } from '@/hooks/useHostBankAccount';
import HostBankAccountDisplay from '@/components/auth/HostBankAccountDisplay';
import HostBankAccountModal from '@/components/auth/HostBankAccountModal';
import { useToast } from '@/components/ui/use-toast';

const BankAccountsManager = () => {
  const { account, loading, fetchAccount, deleteAccount } = useHostBankAccount();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const loadData = async () => {
      await fetchAccount();
      setIsInitialLoad(false);
    };
    loadData();
  }, [fetchAccount]);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteAccount();
      toast({
        title: 'Cuenta eliminada',
        description: 'La cuenta bancaria ha sido removida de tu perfil.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo eliminar la cuenta.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (isInitialLoad) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Cuentas Bancarias</h2>
          <p className="text-muted-foreground">Gestiona la cuenta donde recibirás tus pagos.</p>
        </div>
      </div>

      {account ? (
        <HostBankAccountDisplay 
          account={account} 
          onEdit={() => setIsModalOpen(true)} 
          onDelete={handleDelete}
          isDeleting={isDeleting || loading}
        />
      ) : (
        <Card className="border-dashed border-2 bg-muted/30">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Landmark className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No hay cuenta bancaria registrada</h3>
            <p className="text-muted-foreground max-w-sm mb-6">
              Para poder recibir pagos por las reservas de tus clínicas, debes registrar una cuenta bancaria.
            </p>
            <Button onClick={() => setIsModalOpen(true)} className="gap-2">
              <PlusCircle className="w-4 h-4" /> Añadir Cuenta Bancaria
            </Button>
          </CardContent>
        </Card>
      )}

      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div className="text-sm text-muted-foreground">
            <p className="font-semibold text-foreground mb-1">Información importante sobre pagos</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>Asegúrate de que la cuenta esté a nombre de la persona o entidad registrada.</li>
              <li>Los pagos se procesan los días 15 y 30 de cada mes.</li>
              <li>Mantén tu información bancaria actualizada para evitar demoras.</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <HostBankAccountModal 
        open={isModalOpen} 
        onOpenChange={setIsModalOpen} 
        account={account} 
        onSuccess={fetchAccount}
      />
    </div>
  );
};

export default BankAccountsManager;