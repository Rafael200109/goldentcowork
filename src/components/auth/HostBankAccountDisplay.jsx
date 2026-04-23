import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Landmark, CreditCard, Hash, User, Edit, Trash2, ShieldCheck, Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const HostBankAccountDisplay = ({ account, onEdit, onDelete, isDeleting }) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!account) return null;

  const maskedAccount = `****${account.account_number.slice(-4)}`;
  const accountTypeLabel = account.account_type === 'checking' ? 'Corriente' : 'Ahorros';

  const handleDelete = () => {
    setShowDeleteConfirm(false);
    onDelete();
  };

  return (
    <>
      <Card className="border-border shadow-sm overflow-hidden group">
        <div className="bg-muted/30 px-4 py-3 border-b flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Landmark className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">{account.bank_name}</h3>
          </div>
          <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" /> Registrada
          </Badge>
        </div>
        <CardContent className="p-0">
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x border-b">
            <div className="p-4 flex items-start gap-3">
              <User className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Titular</p>
                <p className="font-medium text-foreground">{account.account_holder_name}</p>
                {account.document_number && (
                  <p className="text-sm text-muted-foreground mt-0.5 uppercase">
                    {account.document_type}: {account.document_number}
                  </p>
                )}
              </div>
            </div>
            <div className="p-4 flex items-start gap-3">
              <Hash className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Cuenta</p>
                <p className="font-mono font-medium text-foreground text-lg">{maskedAccount}</p>
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                  <CreditCard className="w-3.5 h-3.5" /> {accountTypeLabel}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-muted/10 p-3 px-4 flex flex-col sm:flex-row justify-between items-center gap-3">
            <p className="text-xs text-muted-foreground">
              Añadida el {format(new Date(account.created_at || new Date()), "d 'de' MMMM, yyyy", { locale: es })}
            </p>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button variant="outline" size="sm" onClick={onEdit} className="flex-1 sm:flex-none">
                <Edit className="w-4 h-4 mr-2" /> Editar
              </Button>
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={() => setShowDeleteConfirm(true)} 
                disabled={isDeleting}
                className="flex-1 sm:flex-none"
              >
                {isDeleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                Eliminar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar cuenta bancaria?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se requerirá que añadas una nueva cuenta para poder procesar tus pagos y retiros pendientes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={isDeleting}>
              {isDeleting ? 'Eliminando...' : 'Sí, eliminar cuenta'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default HostBankAccountDisplay;