import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Loader2, Send, Clock, User, Trash2, MessageSquare } from 'lucide-react';
import ChatMessage from './ChatMessage';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useChat } from '@/hooks/useChat';
import { toast } from '@/components/ui/use-toast';

const ChatPanel = () => {
  const { user } = useAuth();
  const { fetchMessages, sendMessage, closeSession } = useChat();
  
  const [sessions, setSessions] = useState([]);
  const [filteredSessions, setFilteredSessions] = useState([]);
  const [search, setSearch] = useState('');
  const [activeSession, setActiveSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);

  useEffect(() => {
    loadSessions();

    const sessionSubscription = supabase
      .channel('admin_chat_sessions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_sessions' }, () => {
        loadSessions();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(sessionSubscription);
    };
  }, []);

  useEffect(() => {
    if (search.trim()) {
      setFilteredSessions(sessions.filter(s => 
        s.profiles?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        s.ticket_id.includes(search)
      ));
    } else {
      setFilteredSessions(sessions);
    }
  }, [search, sessions]);

  useEffect(() => {
    if (activeSession) {
      fetchMessages(activeSession.id).then(setMessages);

      const messageSubscription = supabase
        .channel(`admin_chat_messages_${activeSession.id}`)
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'chat_messages',
          filter: `session_id=eq.${activeSession.id}`
        }, payload => {
          setMessages(prev => {
             if (prev.some(m => m.id === payload.new.id)) return prev;
             return [...prev, payload.new];
          });
        })
        .subscribe();

      return () => {
        supabase.removeChannel(messageSubscription);
      };
    } else {
      setMessages([]);
    }
  }, [activeSession, fetchMessages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const loadSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .select(`
          *,
          profiles:user_id (full_name, email)
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSessions(data || []);
      
      if (activeSession && !data?.find(s => s.id === activeSession.id)) {
        setActiveSession(null);
      }
    } catch (err) {
      console.error('Error loading sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !activeSession) return;

    const messageText = inputText.trim();
    setInputText('');

    const newMsg = await sendMessage(activeSession.id, messageText, 'admin');
    if (newMsg) {
      setMessages(prev => [...prev, newMsg]);
    }
  };

  const handleCloseSession = async (sessionId) => {
    if (window.confirm('¿Seguro que deseas cerrar este ticket y eliminar sus mensajes?')) {
      const success = await closeSession(sessionId);
      if (success !== false) {
        toast({ title: "Ticket cerrado exitosamente" });
        if (activeSession?.id === sessionId) {
          setActiveSession(null);
        }
      }
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-12rem)] min-h-[500px]">
      <Card className="lg:col-span-1 flex flex-col h-full overflow-hidden">
        <CardHeader className="px-4 py-3 border-b">
          <CardTitle className="text-lg flex justify-between items-center">
            Chats Activos
            <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
              {sessions.length}
            </span>
          </CardTitle>
          <div className="relative mt-2">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar usuario o ticket..." 
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <ScrollArea className="flex-1">
          {loading ? (
            <div className="flex justify-center p-8"><Loader2 className="animate-spin h-6 w-6 text-primary" /></div>
          ) : filteredSessions.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">No hay chats activos.</div>
          ) : (
            <div className="flex flex-col">
              {filteredSessions.map(session => (
                <div 
                  key={session.id}
                  onClick={() => setActiveSession(session)}
                  className={`p-4 border-b cursor-pointer hover:bg-muted/50 transition-colors flex flex-col gap-1 ${activeSession?.id === session.id ? 'bg-muted border-l-4 border-l-primary' : ''}`}
                >
                  <div className="flex justify-between items-start">
                    <span className="font-semibold text-sm truncate pr-2">
                      {session.profiles?.full_name || 'Usuario Desconocido'}
                    </span>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(session.created_at), 'HH:mm', { locale: es })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                     <span className="text-xs text-muted-foreground truncate font-mono">
                        #{session.ticket_id.split('-')[0]}
                     </span>
                     <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:bg-destructive/10" onClick={(e) => { e.stopPropagation(); handleCloseSession(session.id); }}>
                        <Trash2 className="h-3 w-3" />
                     </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </Card>

      <Card className="lg:col-span-2 flex flex-col h-full overflow-hidden">
        {activeSession ? (
          <>
            <CardHeader className="px-4 py-3 border-b flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">{activeSession.profiles?.full_name}</CardTitle>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <Clock className="h-3 w-3" /> Ticket: {activeSession.ticket_id}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => handleCloseSession(activeSession.id)} className="text-destructive hover:bg-destructive hover:text-white border-destructive">
                Cerrar Ticket
              </Button>
            </CardHeader>
            <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto bg-muted/10">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <User className="h-12 w-12 mb-2 opacity-20" />
                  <p>Iniciando conversación...</p>
                </div>
              ) : (
                <div className="flex flex-col justify-end min-h-full">
                  {messages.map(msg => (
                    <ChatMessage key={msg.id} message={msg} currentUserId={user?.id} />
                  ))}
                </div>
              )}
            </div>
            <div className="p-3 border-t bg-background">
              <form onSubmit={handleSend} className="flex gap-2">
                <Input 
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Escribe una respuesta al usuario..."
                  className="flex-1"
                />
                <Button type="submit" disabled={!inputText.trim()}>
                  <Send className="h-4 w-4 mr-2" /> Enviar
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8 text-center">
            <MessageSquare className="h-16 w-16 mb-4 opacity-20" />
            <h3 className="text-lg font-medium mb-2">Ningún chat seleccionado</h3>
            <p>Selecciona un chat de la lista lateral para ver los mensajes o responder.</p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default ChatPanel;