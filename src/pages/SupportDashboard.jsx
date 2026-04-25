import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabaseClient } from '@/config/supabaseConfig';
import { useUser } from '@/contexts/UserContext';
import { useToast } from '@/components/ui/use-toast';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Send, Search, Archive, Download, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { SupportStats } from '@/components/support/SupportStats';
import { InternalNotes } from '@/components/support/InternalNotes';
import { SupportTicketDetails } from '@/components/support/SupportTicketDetails';

const SupportDashboard = () => {
  const { profile } = useUser();
  const { toast } = useToast();
  
  const [conversations, setConversations] = useState([]);
  const [filteredConversations, setFilteredConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

  // Initial fetch and real-time subscription (Logic preserved, simplified for view focus)
  useEffect(() => {
     const runCleanup = async () => {
        try { await supabaseClient.rpc('cleanup_old_support_tickets'); } catch (e) { console.log("Cleanup check failed", e); }
     };
     runCleanup();
  }, []);

  const fetchConversations = useCallback(async () => {
    try {
      const { data: rawData, error: rawError } = await supabase
        .from('support_conversations')
        .select(`*, user:user_id(full_name, avatar_url, email), agent:support_agent_id(full_name), last_message:support_messages(content, created_at)`)
        .order('updated_at', { ascending: false });
      
      if (rawError) throw rawError;
      
      const formatted = rawData.map(c => ({
         ...c, 
         user_full_name: c.user?.full_name, 
         user_avatar_url: c.user?.avatar_url, 
         user_email: c.user?.email, 
         agent_full_name: c.agent?.full_name, 
         last_message_content: c.last_message?.[0]?.content, 
      }));
      setConversations(formatted);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron cargar los tickets.' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchConversations();
    const channel = supabaseClient.channel('dashboard-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_conversations' }, () => fetchConversations())
      .subscribe();
    return () => { supabaseClient.removeChannel(channel); };
  }, [fetchConversations]);

  // Filtering logic
  useEffect(() => {
    let result = conversations;
    if (statusFilter !== 'all') {
       if (statusFilter === 'mine') result = result.filter(c => c.support_agent_id === profile?.id && c.status !== 'closed');
       else result = result.filter(c => c.status === statusFilter);
    }
    if (priorityFilter !== 'all') result = result.filter(c => c.priority === priorityFilter);
    if (searchTerm) {
       const term = searchTerm.toLowerCase();
       result = result.filter(c => c.user_full_name?.toLowerCase().includes(term) || c.id.includes(term) || c.category?.includes(term));
    }
    setFilteredConversations(result);
  }, [conversations, statusFilter, priorityFilter, searchTerm, profile?.id]);

  // Message fetching
  const fetchMessages = useCallback(async (id) => {
     setLoadingMessages(true);
     const { data } = await supabaseClient.from('support_messages').select('*, sender:sender_id(full_name, avatar_url, role)').eq('conversation_id', id).order('created_at', { ascending: true });
     setMessages(data || []);
     setLoadingMessages(false);
     setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  }, []);

  useEffect(() => {
     if (selectedConversation) {
        fetchMessages(selectedConversation.id);
        const channel = supabaseClient.channel(`chat-${selectedConversation.id}`).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'support_messages', filter: `conversation_id=eq.${selectedConversation.id}`}, () => { fetchMessages(selectedConversation.id); }).subscribe();
        return () => { supabaseClient.removeChannel(channel); };
     }
  }, [selectedConversation, fetchMessages]);

  const handleSendMessage = async (e) => {
     e.preventDefault();
     if (!newMessage.trim() || !selectedConversation) return;
     setSending(true);
     await supabaseClient.from('support_messages').insert({ conversation_id: selectedConversation.id, sender_id: profile.id, content: newMessage.trim() });
     await supabaseClient.from('support_conversations').update({ updated_at: new Date() }).eq('id', selectedConversation.id);
     setNewMessage('');
     setSending(false);
  };

  const handleBackToList = () => {
    setSelectedConversation(null);
  };

  return (
    <div className="flex flex-col flex-grow w-full gap-4 h-[calc(100dvh-120px)] sm:h-[calc(100dvh-140px)]">
      <SupportStats />
      
      {/* 
        Unified Mobile/Desktop Layout Logic:
        - List is visible if no conversation selected OR if on desktop (hidden md:flex).
        - Detail is visible if conversation selected OR if on desktop (flex).
        - Detail uses 'absolute' or 'fixed' tricks sometimes, but here we use display toggling via classes.
      */}
      <div className="flex flex-1 gap-4 overflow-hidden relative">
         
         {/* LEFT: Ticket List */}
         {/* Hidden on mobile if a conversation is selected. Always shown on md+ */}
         <Card className={cn(
            "flex-col h-full border-border/60 shadow-md transition-all duration-200",
            "w-full md:w-80 lg:w-96", // Full width on mobile, fixed width on desktop
            selectedConversation ? "hidden md:flex" : "flex"
         )}>
            <div className="p-3 border-b space-y-3 bg-muted/20">
               <div className="relative"><Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Buscar..." className="pl-8 h-9 text-sm" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div>
               <div className="flex gap-2 overflow-x-auto pb-1">
                  <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="h-8 text-xs min-w-[100px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Todos</SelectItem><SelectItem value="open">Abiertos</SelectItem><SelectItem value="mine">Mis Tickets</SelectItem><SelectItem value="closed">Cerrados</SelectItem></SelectContent></Select>
                  <Select value={priorityFilter} onValueChange={setPriorityFilter}><SelectTrigger className="h-8 text-xs min-w-[100px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Prioridad</SelectItem><SelectItem value="critical">Crítica</SelectItem><SelectItem value="high">Alta</SelectItem><SelectItem value="medium">Media</SelectItem><SelectItem value="low">Baja</SelectItem></SelectContent></Select>
               </div>
            </div>
            <ScrollArea className="flex-1">
               {loading ? <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div> : filteredConversations.length === 0 ? <div className="flex flex-col items-center justify-center p-8 text-muted-foreground"><Archive className="w-8 h-8 mb-2 opacity-20" /><span className="text-xs">No hay tickets</span></div> : (
                  <div className="divide-y divide-border/40">
                     {filteredConversations.map(ticket => (
                        <div key={ticket.id} onClick={() => setSelectedConversation(ticket)} className={cn("p-3 cursor-pointer hover:bg-muted/50 transition-colors flex gap-3 items-start", selectedConversation?.id === ticket.id && "bg-primary/5 border-l-4 border-l-primary")}>
                           <Avatar className="w-9 h-9 border"><AvatarImage src={ticket.user_avatar_url} /><AvatarFallback>{ticket.user_full_name?.substring(0,2)}</AvatarFallback></Avatar>
                           <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start mb-0.5"><span className="font-semibold text-sm truncate">{ticket.user_full_name}</span><span className="text-[10px] text-muted-foreground whitespace-nowrap">{formatDistanceToNow(new Date(ticket.updated_at), { locale: es, addSuffix: false })}</span></div>
                              <div className="flex items-center gap-2 mb-1">
                                 <Badge variant="outline" className={cn("text-[10px] px-1 py-0 h-4 uppercase", ticket.priority === 'critical' ? 'text-red-600 border-red-200 bg-red-50' : ticket.priority === 'high' ? 'text-orange-600 border-orange-200' : 'text-gray-500')}>{ticket.priority || 'N/A'}</Badge>
                                 <span className={cn("w-2 h-2 rounded-full", ticket.status === 'open' ? 'bg-red-500' : ticket.status === 'closed' ? 'bg-gray-400' : 'bg-blue-500')} />
                              </div>
                              <p className="text-xs text-muted-foreground truncate">{ticket.id.substring(0,8)} • {ticket.category || 'General'}</p>
                           </div>
                        </div>
                     ))}
                  </div>
               )}
            </ScrollArea>
         </Card>

         {/* CENTER: Chat / Notes */}
         {/* Hidden on mobile if NO conversation selected. Always shown on md+ (but might be empty state) */}
         <div className={cn(
            "flex-col min-w-0 h-full flex-1",
            !selectedConversation ? "hidden md:flex" : "flex"
         )}>
            {selectedConversation ? (
               <Tabs defaultValue="chat" className="h-full flex flex-col">
                  <div className="flex items-center justify-between px-1 mb-2 bg-background z-10">
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="md:hidden -ml-2" onClick={handleBackToList}>
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <TabsList className="grid w-56 grid-cols-2"><TabsTrigger value="chat">Chat</TabsTrigger><TabsTrigger value="notes">Notas</TabsTrigger></TabsList>
                    </div>
                    <div className="text-xs text-muted-foreground hidden sm:block">Ticket ID: <span className="font-mono">{selectedConversation.id.substring(0,8)}</span></div>
                  </div>
                  
                  <TabsContent value="chat" className="flex-1 flex flex-col border rounded-lg overflow-hidden bg-background shadow-sm mt-0 h-full relative">
                     <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
                        {loadingMessages ? <div className="flex justify-center p-8"><Loader2 className="animate-spin opacity-50" /></div> : messages.map(msg => { const isMe = msg.sender_id === profile.id; return (<div key={msg.id} className={cn("flex gap-2 max-w-[85%]", isMe ? "ml-auto flex-row-reverse" : "")}><Avatar className="w-8 h-8"><AvatarImage src={msg.sender?.avatar_url} /><AvatarFallback className="text-[10px]">{msg.sender?.full_name?.substring(0,1)}</AvatarFallback></Avatar><div className={cn("p-3 rounded-lg text-sm", isMe ? "bg-primary text-primary-foreground" : "bg-white border shadow-sm")}>{msg.attachment_url && (<img src={msg.attachment_url} alt="adjunto" className="max-w-[200px] rounded mb-2 border border-white/20" />)}<p className="whitespace-pre-wrap">{msg.content}</p><span className={cn("text-[9px] block mt-1 opacity-70", isMe ? "text-right" : "")}>{format(new Date(msg.created_at), 'HH:mm')}</span></div></div>); })}
                        <div ref={messagesEndRef} />
                     </div>
                     <div className="p-3 bg-white border-t sticky bottom-0 z-20">
                        {selectedConversation.status === 'closed' ? <div className="text-center p-2 text-sm text-muted-foreground bg-muted/20 rounded border border-dashed">Ticket cerrado.</div> : <form onSubmit={handleSendMessage} className="flex gap-2"><Input value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Escribe..." className="flex-1" /><Button type="submit" size="icon" disabled={sending || !newMessage.trim()}>{sending ? <Loader2 className="animate-spin w-4 h-4" /> : <Send className="w-4 h-4" />}</Button></form>}
                     </div>
                  </TabsContent>
                  <TabsContent value="notes" className="flex-1 mt-0 h-full"><InternalNotes conversationId={selectedConversation.id} /></TabsContent>
               </Tabs>
            ) : (
               <div className="h-full flex flex-col items-center justify-center text-muted-foreground bg-muted/10 border rounded-lg border-dashed">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4"><Search className="w-8 h-8 opacity-50" /></div>
                  <h3>Selecciona un ticket</h3>
                  <p className="text-sm opacity-70 text-center max-w-xs">Selecciona una conversación de la lista para ver los detalles.</p>
               </div>
            )}
         </div>

         {/* RIGHT: Details Panel */}
         {/* Hidden on small/medium screens. Visible on large screens */}
         <div className="w-72 hidden xl:block">
            {selectedConversation ? 
              <Card className="h-full border-border/60 shadow-md">
                 <div className="p-4 bg-muted/30 border-b"><h3 className="font-semibold text-sm">Detalles del Ticket</h3></div>
                 <div className="p-4"><SupportTicketDetails conversation={selectedConversation} onUpdate={(updated) => { setConversations(prev => prev.map(c => c.id === updated.id ? updated : c)); setSelectedConversation(updated); }} /></div>
              </Card> 
              : 
              <div className="h-full bg-muted/5 border rounded-lg border-dashed" />
            }
         </div>
      </div>
    </div>
  );
};
export default SupportDashboard;