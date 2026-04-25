import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabaseClient } from '@/config/supabaseConfig';
import { useUser } from '@/contexts/UserContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { X, Send, Loader2, HelpCircle, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSupportChat } from '@/contexts/SupportChatContext';

const SupportChatWidget = () => {
  const { isOpen, toggleChat } = useSupportChat();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [conversation, setConversation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const { profile } = useUser();
  const { toast } = useToast();
  const messagesEndRef = useRef(null);
  
  // Brand color constant
  const BRAND_COLOR = "#364027";
  
  // File upload states
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchConversationAndMessages = useCallback(async () => {
    if (!profile) return;
    setLoading(true);

    let { data: convData, error: convError } = await supabase
      .from('support_conversations')
      .select('*')
      .eq('user_id', profile.id)
      .maybeSingle();

    if (convError) {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo cargar la conversación.' });
      setLoading(false);
      return;
    }
    
    if (!convData) {
      const { data: newConvData, error: newConvError } = await supabase
        .from('support_conversations')
        .insert({ user_id: profile.id, status: 'open' })
        .select()
        .single();
      
      if (newConvError) {
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudo iniciar la conversación.' });
        setLoading(false);
        return;
      }
      convData = newConvData;
    }

    setConversation(convData);

    const { data: msgData, error: msgError } = await supabase
      .from('support_messages')
      .select('*, sender:sender_id(id, full_name, avatar_url, role)')
      .eq('conversation_id', convData.id)
      .order('created_at', { ascending: true });

    if (msgError) {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron cargar los mensajes.' });
    } else {
      setMessages(msgData || []);
    }
    setLoading(false);
  }, [profile, toast]);

  useEffect(() => {
    if (isOpen) {
      fetchConversationAndMessages();
    }
  }, [isOpen, fetchConversationAndMessages]);
  
  useEffect(() => {
    scrollToBottom();
  }, [messages, previewUrl]);

  const handleNewMessage = useCallback(async (payload) => {
    const { data: senderProfile, error } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, role')
      .eq('id', payload.new.sender_id)
      .maybeSingle();

    if (error) {
      console.error("Error fetching sender profile for new message:", error);
    }

    const messageWithSender = { 
      ...payload.new, 
      sender: senderProfile || { full_name: 'Usuario Eliminado', avatar_url: null, role: 'dentist' }
    };
    
    setMessages(currentMessages => {
      if (currentMessages.find(m => m.id === messageWithSender.id)) {
        return currentMessages;
      }
      return [...currentMessages, messageWithSender];
    });
  }, []);

  useEffect(() => {
    if (!conversation) return;

    const channel = supabase
      .channel(`support-messages-${conversation.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'support_messages',
        filter: `conversation_id=eq.${conversation.id}`
      }, handleNewMessage)
      .subscribe();

    return () => {
      supabaseClient.removeChannel(channel);
    };
  }, [conversation, handleNewMessage]);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        toast({
            variant: "destructive",
            title: "Archivo inválido",
            description: "Por favor selecciona una imagen válida (JPG, PNG).",
        });
        return;
    }

    if (file.size > 5 * 1024 * 1024) {
        toast({
            variant: "destructive",
            title: "Archivo muy grande",
            description: "La imagen no debe superar los 5MB.",
        });
        return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const removeSelectedFile = (shouldRevoke = true) => {
      setSelectedFile(null);
      if (previewUrl && shouldRevoke) {
          URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(null);
      if (fileInputRef.current) {
          fileInputRef.current.value = "";
      }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!newMessage.trim() && !selectedFile) || !conversation || !profile) return;
    
    const messageContent = newMessage.trim();
    const tempId = `temp-${Date.now()}`;
    const fileToUpload = selectedFile;
    const currentPreviewUrl = previewUrl;

    setNewMessage('');
    removeSelectedFile(false);
    setSending(true);

    const optimisticMessage = {
        id: tempId,
        conversation_id: conversation.id,
        sender_id: profile.id,
        content: messageContent,
        attachment_url: currentPreviewUrl,
        attachment_type: fileToUpload ? 'image' : null,
        created_at: new Date().toISOString(),
        sender: {
            id: profile.id,
            full_name: profile.full_name,
            avatar_url: profile.avatar_url,
            role: profile.role
        },
        isOptimistic: true 
    };

    setMessages(prev => [...prev, optimisticMessage]);

    try {
        let attachmentUrl = null;
        let attachmentType = null;

        if (fileToUpload) {
            const fileExt = fileToUpload.name.split('.').pop();
            const fileName = `${conversation.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
            
            const { error: uploadError } = await supabaseClient.storage
                .from('support_attachments')
                .upload(fileName, fileToUpload);

            if (uploadError) {
                throw new Error('Error al subir la imagen');
            }

            const { data: publicUrlData } = supabaseClient.storage
                .from('support_attachments')
                .getPublicUrl(fileName);
            
            attachmentUrl = publicUrlData.publicUrl;
            attachmentType = 'image';
        }

        const { data: insertedData, error } = await supabaseClient.from('support_messages').insert({
            conversation_id: conversation.id,
            sender_id: profile.id,
            content: messageContent,
            attachment_url: attachmentUrl,
            attachment_type: attachmentType
        }).select().single();

        if (error) throw error;

        supabase
            .from('support_conversations')
            .update({ updated_at: new Date().toISOString(), status: 'in_progress' })
            .eq('id', conversation.id)
            .then(({ error }) => { if(error) console.error("Error updating conversation timestamp", error) });

        setMessages(prev => {
             const exists = prev.some(m => m.id === insertedData.id);
             if (exists) {
                 return prev.filter(m => m.id !== tempId);
             }
             return prev.map(msg => {
                if (msg.id === tempId) {
                    return {
                        ...insertedData,
                        sender: optimisticMessage.sender
                    };
                }
                return msg;
            });
        });

        if (currentPreviewUrl && fileToUpload) {
             URL.revokeObjectURL(currentPreviewUrl);
        }

    } catch (error) {
        console.error("Send error:", error);
        toast({ 
            variant: 'destructive', 
            title: 'Error', 
            description: error.message || 'No se pudo enviar el mensaje.' 
        });
        setMessages(prev => prev.filter(msg => msg.id !== tempId));
        setNewMessage(messageContent);
    } finally {
        setSending(false);
    }
  };

  return (
    <>
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-4 animate-fade-in-scale">
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="origin-bottom-right"
            >
              <Card className="w-[320px] sm:w-[380px] h-[520px] flex flex-col shadow-2xl rounded-2xl overflow-hidden border-0 bg-background ring-1 ring-border/50">
                <CardHeader className="flex-row items-center justify-between border-b p-4 text-white" style={{ backgroundColor: BRAND_COLOR }}>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className="h-10 w-10 border-2 border-white/20">
                        <AvatarFallback className="bg-white/20 text-white font-semibold">S</AvatarFallback>
                      </Avatar>
                      <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-400 border-2" style={{ borderColor: BRAND_COLOR }}></span>
                    </div>
                    <div>
                      <p className="font-semibold text-[15px] leading-none mb-1">Soporte Goldent</p>
                      <p className="text-xs text-white/90">Te respondemos en breve</p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 rounded-full text-white/80 hover:text-white hover:bg-white/20 transition-colors" 
                    onClick={toggleChat}
                  >
                      <X className="w-5 h-5" />
                  </Button>
                </CardHeader>
                
                <CardContent className="flex-grow overflow-y-auto p-4 space-y-4 bg-slate-50">
                  {loading ? (
                    <div className="flex justify-center items-center h-full text-slate-400">
                        <div className="flex flex-col items-center gap-3">
                          <Loader2 className="w-8 h-8 animate-spin" style={{ color: BRAND_COLOR }} />
                          <span className="text-sm font-medium">Conectando...</span>
                        </div>
                    </div>
                  ) : messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 p-6">
                          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: `${BRAND_COLOR}1A` }}>
                              <HelpCircle className="w-8 h-8" style={{ color: BRAND_COLOR }} />
                          </div>
                          <p className="text-base font-semibold text-slate-700 mb-1">¿En qué podemos ayudarte?</p>
                          <p className="text-sm">Escribe tu consulta y un agente te atenderá lo más pronto posible.</p>
                      </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((msg, idx) => {
                          const isMe = msg.sender_id === profile?.id;
                          const showAvatar = !isMe && (idx === 0 || messages[idx - 1].sender_id !== msg.sender_id);
                          
                          return (
                              <div key={msg.id} className={cn("flex items-end gap-2", isMe ? "justify-end" : "justify-start")}>
                                  {!isMe && (
                                    <div className="w-8 shrink-0">
                                      {showAvatar && (
                                        <Avatar className="w-8 h-8">
                                            <AvatarImage src={msg.sender?.avatar_url} />
                                            <AvatarFallback className="text-[10px] text-white" style={{ backgroundColor: BRAND_COLOR }}>
                                              {msg.sender?.full_name?.charAt(0) || 'S'}
                                            </AvatarFallback>
                                        </Avatar>
                                      )}
                                    </div>
                                  )}
                                  <div className={cn(
                                    "max-w-[75%] flex flex-col gap-1",
                                    isMe ? "items-end" : "items-start"
                                  )}>
                                      <div className={cn(
                                          "px-4 py-2.5 text-sm shadow-sm overflow-hidden",
                                          isMe 
                                              ? "text-white rounded-2xl rounded-br-sm" 
                                              : "bg-white text-slate-700 rounded-2xl rounded-bl-sm border border-slate-100",
                                          msg.isOptimistic && "opacity-70"
                                      )} style={isMe ? { backgroundColor: BRAND_COLOR } : {}}>
                                          {msg.attachment_url && (
                                              <div className="mb-2 rounded-lg overflow-hidden bg-black/5">
                                                  <a href={msg.attachment_url} target="_blank" rel="noopener noreferrer">
                                                      <img 
                                                          src={msg.attachment_url} 
                                                          alt="Adjunto" 
                                                          className="max-w-full h-auto object-cover max-h-[160px] w-full hover:scale-105 transition-transform duration-300" 
                                                          loading="lazy"
                                                      />
                                                  </a>
                                              </div>
                                          )}
                                          {msg.content && <p className="whitespace-pre-wrap break-words leading-relaxed">{msg.content}</p>}
                                      </div>
                                      <span className="text-[10px] text-slate-400 px-1 flex items-center gap-1 font-medium">
                                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                          {msg.isOptimistic && <Loader2 className="w-3 h-3 animate-spin" />}
                                      </span>
                                  </div>
                              </div>
                          );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </CardContent>

                <CardFooter className="p-3 bg-white border-t border-slate-100 flex flex-col gap-2 shrink-0">
                  <AnimatePresence>
                      {selectedFile && previewUrl && (
                          <motion.div 
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="w-full flex items-center justify-between p-2 bg-slate-50 rounded-xl border border-slate-200"
                          >
                              <div className="flex items-center gap-3 overflow-hidden">
                                  <div className="h-10 w-10 rounded-lg overflow-hidden relative shadow-sm shrink-0">
                                      <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" />
                                  </div>
                                  <div className="min-w-0">
                                      <p className="text-xs font-semibold text-slate-700 truncate max-w-[150px]">{selectedFile.name}</p>
                                      <p className="text-[10px] text-slate-500">{(selectedFile.size / 1024).toFixed(0)} KB</p>
                                  </div>
                              </div>
                              <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-7 w-7 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full" 
                                  onClick={() => removeSelectedFile(true)}
                              >
                                  <X className="w-4 h-4" />
                              </Button>
                          </motion.div>
                      )}
                  </AnimatePresence>

                  <form onSubmit={handleSendMessage} className="flex items-end gap-2 w-full">
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/png, image/jpeg, image/jpg"
                        onChange={handleFileSelect}
                    />
                    
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      className={cn(
                        "shrink-0 h-[42px] w-[42px] rounded-full transition-all duration-300", 
                        selectedFile ? "bg-opacity-10" : "text-slate-400 hover:bg-slate-100"
                      )}
                      style={selectedFile ? { color: BRAND_COLOR, backgroundColor: `${BRAND_COLOR}1A` } : {}}
                      onClick={() => fileInputRef.current?.click()}
                      title="Adjuntar imagen"
                    >
                      <ImageIcon className="w-5 h-5" />
                    </Button>

                    <div className="relative flex-1">
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Escribe tu mensaje..."
                        autoComplete="off"
                        disabled={sending}
                        className="min-h-[42px] py-2 px-4 rounded-full border-slate-200 bg-slate-50 focus:bg-white transition-all duration-300 pr-12"
                        style={{ "--tw-ring-color": BRAND_COLOR, "--tw-border-opacity": "1" }}
                      />
                      <Button 
                        type="submit" 
                        size="icon" 
                        disabled={sending || (!newMessage.trim() && !selectedFile)}
                        className={cn(
                          "absolute right-1 top-1 bottom-1 h-auto w-8 rounded-full text-white transition-all duration-300", 
                          (newMessage.trim() || selectedFile) ? "opacity-100 scale-100" : "opacity-0 scale-90 pointer-events-none"
                        )}
                        style={{ backgroundColor: BRAND_COLOR }}
                      >
                        {sending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </form>
                </CardFooter>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        <Button
          className={cn(
            "rounded-full w-14 h-14 shadow-xl transition-all duration-300 flex items-center justify-center text-white hover:scale-110 hover:shadow-2xl",
            isOpen && "bg-slate-800 hover:bg-slate-700"
          )}
          style={!isOpen ? { backgroundColor: BRAND_COLOR } : {}}
          onClick={toggleChat}
          aria-label={isOpen ? "Cerrar chat de soporte" : "Abrir chat de soporte"}
        >
          <AnimatePresence initial={false} mode="wait">
            <motion.div
              key={isOpen ? 'close' : 'open'}
              initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.2 }}
            >
              {isOpen ? <X size={24} /> : <HelpCircle size={26} />}
            </motion.div>
          </AnimatePresence>
        </Button>
      </div>
    </>
  );
};

export default SupportChatWidget;