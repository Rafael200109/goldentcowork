import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LogIn } from 'lucide-react';

const LoginPromptModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = () => {
    // Pass current location state to redirect back after login
    navigate('/login', { state: { from: location } });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LogIn className="w-5 h-5 text-primary" />
            Inicia sesión para continuar
          </DialogTitle>
          <DialogDescription className="pt-2">
            Necesitas iniciar sesión para guardar tus clínicas favoritas y acceder a ellas desde cualquier dispositivo.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
            Cancelar
          </Button>
          <Button onClick={handleLogin} className="w-full sm:w-auto">
            Iniciar Sesión
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LoginPromptModal;