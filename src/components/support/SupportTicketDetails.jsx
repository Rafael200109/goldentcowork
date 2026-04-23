import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { useUser } from '@/contexts/UserContext';
import { Loader2, User, Calendar, Tag, ShieldAlert } from 'lucide-react';
import { format } from 'date-fns';

export const SupportTicketDetails = ({ conversation, onUpdate }) => {
  const { profile } = useUser();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  // Local state for immediate UI feedback
  const [priority, setPriority] = useState(conversation.priority || 'medium');
  const [category, setCategory] = useState(conversation.category || 'other');
  
  // Close Dialog State
  const [isCloseDialogOpen, setIsCloseDialogOpen] = useState(false);
  const [resolutionNote, setResolutionNote] = useState('');
  const [closing, setClosing] = useState(false);

  useEffect(() => {
      setPriority(conversation.priority || 'medium');
      setCategory(conversation.category || 'other');
  }, [conversation]);

  const updateField = async (field, value) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('support_conversations')
        .update({ [field]: value })
        .eq('id', conversation.id);

      if (error) throw error;

      // Log Audit
      await supabase.from('support_audit_logs').insert({
        conversation_id: conversation.id,
        actor_id: profile.id,
        action: `${field}_change`,
        old_value: conversation[field],
        new_value: value
      });

      if (onUpdate) onUpdate({ ...conversation, [field]: value });
      toast({ title: "Actualizado", description: `El campo ${field} ha sido modificado.` });
      
      if (field === 'priority') setPriority(value);
      if (field === 'category') setCategory(value);

    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo actualizar el ticket.' });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseTicket = async () => {
    if (!resolutionNote.trim()) return;
    setClosing(true);
    try {
      // 1. Update status and note
      const { error } = await supabase
        .from('support_conversations')
        .update({ 
            status: 'closed', 
            resolution_note: resolutionNote,
            updated_at: new Date().toISOString()
        })
        .eq('id', conversation.id);

      if (error) throw error;

      // 2. Audit Log
      await supabase.from('support_audit_logs').insert({
        conversation_id: conversation.id,
        actor_id: profile.id,
        action: 'status_change',
        old_value: conversation.status,
        new_value: 'closed'
      });

      // 3. Notification (Optional logic - could be DB trigger)
      
      setIsCloseDialogOpen(false);
      if (onUpdate) onUpdate({ ...conversation, status: 'closed', resolution_note: resolutionNote });
      toast({ title: "Ticket Cerrado", description: "La resolución ha sido guardada." });

    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "No se pudo cerrar el ticket." });
    } finally {
      setClosing(false);
    }
  };

  return (
    <div className="space-y-6 p-1">
      {/* Status Section */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Estado Actual</h4>
        <div className="flex items-center justify-between">
           <Badge variant={conversation.status === 'open' ? 'destructive' : conversation.status === 'closed' ? 'outline' : 'default'} className="text-sm px-3 py-1 capitalize">
              {conversation.status === 'in_progress' ? 'En Progreso' : conversation.status}
           </Badge>
           
           {conversation.status !== 'closed' ? (
               <Button variant="outline" size="sm" onClick={() => setIsCloseDialogOpen(true)}>
                   Cerrar Ticket
               </Button>
           ) : (
               <Button variant="ghost" size="sm" onClick={() => updateField('status', 'open')} className="text-muted-foreground hover:text-primary">
                   Reabrir
               </Button>
           )}
        </div>
      </div>

      <Separator />

      {/* Priority & Category */}
      <div className="grid gap-4">
        <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Prioridad</Label>
            <Select value={priority} onValueChange={(val) => updateField('priority', val)} disabled={conversation.status === 'closed'}>
                <SelectTrigger>
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="low">Baja</SelectItem>
                    <SelectItem value="medium">Media</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="critical" className="text-red-600 font-medium">Crítica</SelectItem>
                </SelectContent>
            </Select>
        </div>

        <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Categoría</Label>
            <Select value={category} onValueChange={(val) => updateField('category', val)} disabled={conversation.status === 'closed'}>
                <SelectTrigger>
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="technical">Soporte Técnico</SelectItem>
                    <SelectItem value="billing">Facturación</SelectItem>
                    <SelectItem value="account">Cuenta y Acceso</SelectItem>
                    <SelectItem value="other">Otro</SelectItem>
                </SelectContent>
            </Select>
        </div>
      </div>

      <Separator />

      {/* Metadata */}
      <div className="space-y-3 text-sm">
         <div className="flex items-center justify-between">
             <span className="flex items-center text-muted-foreground gap-2"><User className="w-4 h-4"/> Usuario</span>
             <span className="font-medium truncate max-w-[120px]" title={conversation.user_full_name}>{conversation.user_full_name}</span>
         </div>
         <div className="flex items-center justify-between">
             <span className="flex items-center text-muted-foreground gap-2"><Calendar className="w-4 h-4"/> Creado</span>
             <span>{format(new Date(conversation.created_at), 'dd/MM/yy HH:mm')}</span>
         </div>
         <div className="flex items-center justify-between">
             <span className="flex items-center text-muted-foreground gap-2"><Tag className="w-4 h-4"/> ID</span>
             <span className="font-mono text-xs">{conversation.id.substring(0, 8)}...</span>
         </div>
      </div>

      {conversation.resolution_note && (
         <div className="mt-4 p-3 bg-green-50 border border-green-100 rounded-md">
             <p className="text-xs font-semibold text-green-700 mb-1">Nota de Resolución:</p>
             <p className="text-xs text-green-800">{conversation.resolution_note}</p>
         </div>
      )}

      {/* Close Dialog */}
      <Dialog open={isCloseDialogOpen} onOpenChange={setIsCloseDialogOpen}>
         <DialogContent>
             <DialogHeader>
                 <DialogTitle>Cerrar Ticket</DialogTitle>
                 <DialogDescription>
                    Por favor, añade una nota de resolución. Esta información es útil para futuras consultas.
                 </DialogDescription>
             </DialogHeader>
             <div className="py-2">
                 <Label>Nota de Resolución (Requerido)</Label>
                 <Textarea 
                    value={resolutionNote} 
                    onChange={(e) => setResolutionNote(e.target.value)}
                    placeholder="Describe cómo se resolvió el problema..."
                    className="mt-2"
                 />
             </div>
             <DialogFooter>
                 <Button variant="outline" onClick={() => setIsCloseDialogOpen(false)}>Cancelar</Button>
                 <Button onClick={handleCloseTicket} disabled={!resolutionNote.trim() || closing}>
                     {closing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                     Confirmar Cierre
                 </Button>
             </DialogFooter>
         </DialogContent>
      </Dialog>
    </div>
  );
};