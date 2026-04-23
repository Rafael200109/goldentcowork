import React from 'react';
import { X, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';

const ChatImagePreview = ({ file, isOpen, onClose, onSend }) => {
  if (!file) return null;

  const previewUrl = URL.createObjectURL(file);
  const size = (file.size / 1024 / 1024).toFixed(2); // MB

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md p-6">
         <div className="flex flex-col gap-4">
             <div className="flex justify-between items-center">
                 <h3 className="font-semibold text-lg">Vista previa</h3>
                 <Button variant="ghost" size="icon" onClick={onClose}>
                     <X className="w-4 h-4" />
                 </Button>
             </div>
             
             <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted flex items-center justify-center border">
                <img src={previewUrl} alt="Preview" className="max-w-full max-h-[300px] object-contain" />
             </div>
             
             <div className="flex items-center justify-between text-sm text-muted-foreground">
                 <span className="truncate max-w-[200px]">{file.name}</span>
                 <span>{size} MB</span>
             </div>

             <div className="flex justify-end gap-2 pt-2">
                 <Button variant="outline" onClick={onClose}>Cancelar</Button>
                 <Button onClick={onSend}>
                     <Send className="w-4 h-4 mr-2" />
                     Enviar
                 </Button>
             </div>
         </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChatImagePreview;