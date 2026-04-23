import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import PolicyForm from './PolicyForm';

const PolicyModal = ({ isOpen, onClose, policy, onSave, isLoading }) => {
    const isEditing = !!policy;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {isEditing ? 'Editar Política' : 'Añadir Nueva Política'}
                    </DialogTitle>
                </DialogHeader>
                <div className="py-4">
                    <PolicyForm 
                        initialData={policy} 
                        onSubmit={onSave} 
                        onCancel={onClose}
                        isLoading={isLoading}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default PolicyModal;