import React from 'react';
import { FileText, MapPin, Download, ExternalLink, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import LazyImage from '@/components/ui/LazyImage';

const formatFileSize = (bytes) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const ChatAttachmentMessage = ({ message, isOwn }) => {
  const { 
    content_type, 
    attachment_url, 
    attachment_name, 
    attachment_size,
    location_latitude,
    location_longitude,
    location_clinic_name,
    content 
  } = message;

  if (content_type === 'image') {
    // If we stored the thumbnail URL in attachment_name as a hack (see BookingChatWindow), use it.
    // Otherwise fallback to attachment_url
    const isThumbUrl = attachment_name && attachment_name.includes('http');
    const thumbnailUrl = isThumbUrl ? attachment_name : attachment_url;

    return (
      <div className="mt-1 mb-1 relative group">
        <Dialog>
          <DialogTrigger asChild>
            <div className="relative cursor-pointer overflow-hidden rounded-md border border-border/50">
               {/* Use LazyImage for the thumbnail in chat */}
               <LazyImage 
                  src={thumbnailUrl} 
                  alt="Adjunto"
                  className="max-w-full w-[200px] h-[200px] object-cover bg-muted"
                  aspectRatio="aspect-square"
               />
               <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                  <Maximize2 className="text-white opacity-0 group-hover:opacity-100 w-6 h-6 drop-shadow-md" />
               </div>
            </div>
          </DialogTrigger>
          <DialogContent className="max-w-4xl p-0 overflow-hidden bg-transparent border-none shadow-none flex justify-center items-center">
             <div className="relative">
                <img 
                    src={attachment_url} 
                    alt="Vista completa" 
                    className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl bg-black/80"
                />
                <Button 
                    className="absolute bottom-4 right-4" 
                    variant="secondary" 
                    size="sm"
                    onClick={() => window.open(attachment_url, '_blank')}
                >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Abrir original
                </Button>
             </div>
          </DialogContent>
        </Dialog>
        {content && <p className="mt-2 text-sm">{content}</p>}
      </div>
    );
  }

  if (content_type === 'file') {
    return (
      <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50 border border-border/50 max-w-[280px]">
        <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
          <FileText className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate" title={attachment_name}>
            {attachment_name || 'Archivo adjunto'}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatFileSize(attachment_size)}
          </p>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" asChild>
          <a href={attachment_url} download target="_blank" rel="noreferrer">
            <Download className="h-4 w-4" />
          </a>
        </Button>
      </div>
    );
  }

  if (content_type === 'location') {
    const mapUrl = `https://www.google.com/maps/search/?api=1&query=${location_latitude},${location_longitude}`;
    
    return (
      <div className="flex flex-col gap-2 max-w-[280px]">
        <div className="flex items-center gap-2 font-medium text-sm">
          <MapPin className="h-4 w-4 text-red-500" />
          <span className="truncate">Ubicación compartida</span>
        </div>
        <p className="text-xs opacity-90 truncate">{location_clinic_name || 'Ubicación'}</p>
        
        <a 
          href={mapUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="block mt-1 relative rounded-lg overflow-hidden border border-border/50 group"
        >
          <div className="bg-muted h-[100px] w-full flex items-center justify-center group-hover:bg-muted/80 transition-colors">
              <span className="flex items-center gap-2 text-xs font-medium">
                  <ExternalLink className="w-3 h-3" />
                  Ver en Google Maps
              </span>
          </div>
        </a>
      </div>
    );
  }

  return <p>{content}</p>;
};

export default ChatAttachmentMessage;