import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Loader2, Lock } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { useToast } from '@/components/ui/use-toast';

export const InternalNotes = ({ conversationId }) => {
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { profile } = useUser();
  const { toast } = useToast();

  const fetchNotes = useCallback(async () => {
    if (!conversationId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('support_internal_notes')
        .select(`
          *,
          agent:agent_id(full_name, avatar_url)
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (error) {
      console.error('Error fetching internal notes:', error);
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const handleAddNote = async () => {
    if (!newNote.trim() || !profile) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from('support_internal_notes').insert({
        conversation_id: conversationId,
        agent_id: profile.id,
        content: newNote.trim()
      });

      if (error) throw error;
      setNewNote('');
      fetchNotes();
      toast({ title: "Nota agregada", description: "La nota interna ha sido guardada." });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "No se pudo guardar la nota." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-yellow-50/30 p-4 rounded-lg border border-yellow-100">
      <div className="flex items-center gap-2 mb-4 text-yellow-700">
        <Lock className="w-4 h-4" />
        <h3 className="font-semibold text-sm">Notas Internas (Solo Agentes)</h3>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
        {loading ? (
          <div className="flex justify-center py-4"><Loader2 className="animate-spin w-5 h-5 text-yellow-600" /></div>
        ) : notes.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center italic py-4">No hay notas internas aún.</p>
        ) : (
          notes.map(note => (
            <div key={note.id} className="bg-white p-3 rounded-lg border border-yellow-100 shadow-sm text-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                   <Avatar className="w-5 h-5">
                      <AvatarImage src={note.agent?.avatar_url} />
                      <AvatarFallback className="text-[9px]">{note.agent?.full_name?.charAt(0)}</AvatarFallback>
                   </Avatar>
                   <span className="font-medium text-xs text-foreground/80">{note.agent?.full_name}</span>
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {format(new Date(note.created_at), "d MMM, HH:mm", { locale: es })}
                </span>
              </div>
              <p className="text-gray-700 whitespace-pre-wrap">{note.content}</p>
            </div>
          ))
        )}
      </div>

      <div className="space-y-2">
        <Textarea 
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Escribe una nota privada para el equipo..."
          className="bg-white border-yellow-200 focus-visible:ring-yellow-400 min-h-[80px] text-sm resize-none"
        />
        <Button 
          size="sm" 
          onClick={handleAddNote} 
          disabled={submitting || !newNote.trim()}
          className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          Agregar Nota
        </Button>
      </div>
    </div>
  );
};