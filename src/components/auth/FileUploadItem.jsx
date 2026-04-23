import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X } from 'lucide-react';

const FileUploadItem = ({ id, label, onFileChange, fileName, onClear }) => (
  <div className="space-y-2">
    <Label htmlFor={id} className="text-sm font-medium">
      {label}
    </Label>
    {fileName ? (
      <div className="flex items-center justify-between p-2 rounded-md bg-background border">
        <p className="text-sm text-green-600 dark:text-green-400 truncate pr-2">{fileName}</p>
        <Button variant="ghost" size="icon" onClick={onClear} className="h-6 w-6 text-muted-foreground hover:text-destructive">
          <X className="h-4 w-4" />
        </Button>
      </div>
    ) : (
      <Input 
        id={id} 
        type="file" 
        accept=".pdf,image/*" 
        onChange={onFileChange} 
        className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
      />
    )}
  </div>
);

export default FileUploadItem;