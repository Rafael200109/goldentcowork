import React, { useState, useEffect, useRef } from 'react';
import { useBookingChat } from '@/contexts/BookingChatContext';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Loader2, MessageSquare } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import BookingChatMessage from './BookingChatMessage';
import ChatFileUploader from './ChatFileUploader';
import ChatLocationButton from './ChatLocationButton';
import ChatImagePreview from './ChatImagePreview';
import { useBookingChatAttachments } from '@/hooks/useBookingChatAttachments';
import { optimizeChatImage } from '@/lib/chatImageOptimizer';
import { imageCache } from '@/lib/imageCache';

const BookingChatWindow = ({ otherUser }) => {
  const { user } = useAuth();
  const {
    messages,
    loading,
    sending,
    bookingId,
    sendMessage,
    markAllAsRead,
    setTypingStatus
  } = useBookingChat();

  const [inputValue, setInputValue] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [optimizing, setOptimizing] = useState(false);
  const scrollRef = useRef(null);
  
  const { uploadFile, uploading } = useBookingChatAttachments(bookingId);

  // Preload avatars
  useEffect(() => {
      if (otherUser?.avatar_url) {
          imageCache.preload([otherUser.avatar_url]);
      }
  }, [otherUser]);

  useEffect(() => {
    if (messages.length > 0 && user) {
      markAllAsRead();
    }
  }, [messages.length, markAllAsRead, user]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!inputValue.trim() || sending) return;

    await sendMessage({
        content: inputValue,
        content_type: 'text'
    });
    setInputValue('');
  };

  const handleInputChange = (e) => {
      setInputValue(e.target.value);
      setTypingStatus(true);
  };

  const handleFileSelect = async (file, type) => {
      if (type === 'image') {
          setSelectedImage(file);
      } else {
          // Direct upload for files
          const result = await uploadFile(file);
          if (result) {
              await sendMessage({
                  content: '',
                  content_type: 'file',
                  attachment_url: result.url,
                  attachment_name: result.name,
                  attachment_size: result.size
              });
          }
      }
  };

  const handleSendImage = async () => {
      if (!selectedImage) return;
      
      setOptimizing(true);
      try {
        const { main, thumbnail } = await optimizeChatImage(selectedImage);
        
        const mainResult = await uploadFile(main, 'chat_images');
        const thumbFile = new File([thumbnail], `thumb_${selectedImage.name}`, { type: 'image/webp' });
        const thumbResult = await uploadFile(thumbFile, 'chat_thumbnails');

        if (mainResult) {
            await sendMessage({
                content: '',
                content_type: 'image',
                attachment_url: mainResult.url,
                attachment_name: thumbResult ? thumbResult.url : mainResult.name, 
                attachment_size: mainResult.size
            });
            setSelectedImage(null);
        }
      } catch (err) {
        console.error("Optimization/Upload failed", err);
      } finally {
        setOptimizing(false);
      }
  };

  const handleLocationSelect = async (locationData) => {
      await sendMessage({
          content: '',
          content_type: 'location',
          location_latitude: locationData.latitude,
          location_longitude: locationData.longitude,
          location_clinic_name: locationData.clinicName
      });
  };

  return (
    // Task 3: Full height to fill the responsive container
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between bg-muted/20 shrink-0">
        <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
                <AvatarImage src={otherUser?.avatar_url} />
                <AvatarFallback>{otherUser?.full_name?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
            <div>
                 <h4 className="font-semibold text-sm">{otherUser?.full_name || 'Chat'}</h4>
                 <p className="text-xs text-muted-foreground">En línea</p>
            </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        {loading ? (
          <div className="flex justify-center items-center h-full pt-10">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-2 pt-10 opacity-60">
             <MessageSquare className="w-8 h-8 text-muted-foreground" />
             <p className="text-sm">Inicia la conversación con {otherUser?.full_name}</p>
          </div>
        ) : (
          <div className="space-y-4 pb-2">
            {messages.map((msg) => (
              <BookingChatMessage key={msg.id} message={msg} />
            ))}
            <div ref={scrollRef} />
          </div>
        )}
      </ScrollArea>

      {/* Image Preview Modal */}
      <ChatImagePreview 
         file={selectedImage} 
         isOpen={!!selectedImage} 
         onClose={() => setSelectedImage(null)}
         onSend={handleSendImage}
      />

      {/* Input */}
      <div className="p-3 border-t bg-background shrink-0">
        <div className="flex items-center gap-2 mb-2">
             <ChatFileUploader onFileSelect={handleFileSelect} disabled={sending || uploading || optimizing} />
             <ChatLocationButton bookingId={bookingId} onLocationSelect={handleLocationSelect} disabled={sending || uploading || optimizing} />
        </div>
        
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input 
            value={inputValue} 
            onChange={handleInputChange} 
            placeholder="Escribe un mensaje..." 
            className="flex-1"
            disabled={sending || uploading || optimizing}
          />
          <Button type="submit" size="icon" disabled={sending || uploading || optimizing || !inputValue.trim()}>
            {sending || uploading || optimizing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default BookingChatWindow;