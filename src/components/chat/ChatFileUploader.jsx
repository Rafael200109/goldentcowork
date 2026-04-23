import React, { useRef } from 'react';
import { Paperclip, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const ChatFileUploader = ({ onFileSelect, disabled }) => {
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);

  const handleFileChange = (e, type) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file, type);
    }
    // Reset inputs
    e.target.value = null;
  };

  return (
    <div className="flex items-center gap-1">
      {/* Hidden Inputs */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={(e) => handleFileChange(e, 'file')}
        accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
      />
      <input
        type="file"
        ref={imageInputRef}
        className="hidden"
        onChange={(e) => handleFileChange(e, 'image')}
        accept="image/png,image/jpeg,image/jpg,image/webp"
      />

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => imageInputRef.current?.click()}
              disabled={disabled}
            >
              <ImageIcon className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Enviar imagen</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
            >
              <Paperclip className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Adjuntar archivo</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

export default ChatFileUploader;