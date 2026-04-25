import React, { useState } from 'react';
import { supabaseClient } from '@/config/supabaseConfig';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
    MoreHorizontal, 
    Trash2, 
    Archive, 
    ArchiveRestore, 
    Eye
} from 'lucide-react';
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
import { useNavigate } from 'react-router-dom';

const ClinicManagementActions = ({ clinic, onActionComplete }) => {
    const { toast } = useToast();
    const navigate = useNavigate();
    
    // Alert Dialog State
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [actionToConfirm, setActionToConfirm] = useState(null); // { type: 'delete' | 'archive' | 'restore' }

    const handleAction = async () => {
        if (!actionToConfirm || !clinic) return;

        const { type } = actionToConfirm;
        let updateData = {};
        let successMessage = '';
        let isDelete = false;

        switch (type) {
            case 'archive':
                updateData = { status: 'archived' };
                successMessage = 'Clínica archivada exitosamente.';
                break;
            case 'restore':
                // Restaurar a 'published' si estaba archivada, o 'pending' si se prefiere revisión
                updateData = { status: 'published' }; 
                successMessage = 'Clínica restaurada exitosamente.';
                break;
            case 'delete':
                isDelete = true;
                successMessage = 'Clínica eliminada permanentemente.';
                break;
            default:
                return;
        }

        try {
            if (isDelete) {
                 const { error } = await supabaseClient.from('clinics').delete().eq('id', clinic.id);
                 if (error) throw error;
            } else {
                const { error } = await supabaseClient.from('clinics').update(updateData).eq('id', clinic.id);
                if (error) throw error;
            }

            toast({ title: 'Éxito', description: successMessage });
            
            // Notify parent to refresh list
            if (onActionComplete) {
                onActionComplete();
            }
        } catch (error) {
            console.error(`Error executing ${type}:`, error);
             toast({
                variant: 'destructive',
                title: 'Error',
                description: `No se pudo completar la acción: ${error.message}`,
            });
        } finally {
            setIsAlertOpen(false);
            setActionToConfirm(null);
        }
    };

    const openConfirmDialog = (type) => {
        setActionToConfirm({ type });
        setIsAlertOpen(true);
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-muted/50">
                        <span className="sr-only">Abrir menú</span>
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[160px]">
                    <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => navigator.clipboard.writeText(clinic.id)}>
                        Copiar ID
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate(`/clinic-dashboard/edit/${clinic.id}`)}>
                        <Eye className="mr-2 h-4 w-4" /> Ver detalles
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    
                    {clinic.status !== 'archived' ? (
                        <DropdownMenuItem onClick={() => openConfirmDialog('archive')} className="text-amber-600 dark:text-amber-400">
                            <Archive className="mr-2 h-4 w-4" /> Archivar
                        </DropdownMenuItem>
                    ) : (
                        <DropdownMenuItem onClick={() => openConfirmDialog('restore')} className="text-green-600 dark:text-green-400">
                            <ArchiveRestore className="mr-2 h-4 w-4" /> Restaurar
                        </DropdownMenuItem>
                    )}
                    
                    <DropdownMenuItem onClick={() => openConfirmDialog('delete')} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                        <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {actionToConfirm?.type === 'delete' 
                                ? "Esta acción es irreversible. Se eliminará permanentemente la clínica y todos sus datos asociados."
                                : "Esta acción cambiará la visibilidad de la clínica en la plataforma."
                            }
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={handleAction} 
                            className={actionToConfirm?.type === 'delete' ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground' : ''}
                        >
                            {actionToConfirm?.type === 'delete' ? 'Eliminar' : 'Continuar'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};

export default ClinicManagementActions;