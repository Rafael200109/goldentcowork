import React, { useState, useEffect } from 'react';
import { FiFileText, FiInfo, FiShield, FiAlertCircle, FiCheckCircle, FiEdit2, FiTrash2, FiPlus, FiLoader } from 'react-icons/fi';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabaseClient } from '@/config/supabaseConfig';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useUser } from '@/contexts/UserContext';
import DOMPurify from 'dompurify';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

const ClinicPoliciesSection = ({ clinicId }) => {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ policy_type: '', policy_text: '' });
  const [formLoading, setFormLoading] = useState(false);
  
  const { toast } = useToast();
  const { user } = useAuth();
  const { profile } = useUser();
  const [isHost, setIsHost] = useState(false);

  const fetchPolicies = async () => {
    if (!clinicId) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('clinic_policies')
        .select('*')
        .eq('clinic_id', clinicId)
        .order('created_at', { ascending: true });

      if (fetchError) throw fetchError;
      setPolicies(data || []);
      
      // Verify if current user is the host
      if (user) {
        const { data: clinicData } = await supabase
          .from('clinics')
          .select('host_id')
          .eq('id', clinicId)
          .single();
        if (clinicData?.host_id === user.id || profile?.role === 'admin') {
          setIsHost(true);
        }
      }
      
    } catch (err) {
      console.error('Error fetching policies', err);
      setError('No se pudieron cargar las políticas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, [clinicId, user, profile]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const openCreateModal = () => {
    setFormData({ policy_type: '', policy_text: '' });
    setEditingId(null);
    setIsEditing(true);
  };

  const openEditModal = (policy) => {
    setFormData({ 
      policy_type: policy.policy_type || '', 
      policy_text: policy.policy_text || policy.policies_text || '' 
    });
    setEditingId(policy.id);
    setIsEditing(true);
  };

  const closeEditModal = () => {
    setIsEditing(false);
    setFormData({ policy_type: '', policy_text: '' });
    setEditingId(null);
  };

  const handleSavePolicy = async () => {
    if (formData.policy_type.length < 3) {
      toast({ variant: "destructive", title: "Validación", description: "El título debe tener al menos 3 caracteres." });
      return;
    }
    if (formData.policy_text.length < 10) {
      toast({ variant: "destructive", title: "Validación", description: "La descripción debe tener al menos 10 caracteres." });
      return;
    }

    setFormLoading(true);
    try {
      if (editingId) {
        // UPDATE
        const { error: updateError } = await supabase
          .from('clinic_policies')
          .update({ 
            policy_type: formData.policy_type,
            policy_text: formData.policy_text,
            policies_text: formData.policy_text, // keep sync
            updated_at: new Date().toISOString()
          })
          .eq('id', editingId);
        
        if (updateError) throw updateError;
        toast({ title: "Éxito", description: "Política actualizada correctamente." });
      } else {
        // CREATE
        const { error: insertError } = await supabase
          .from('clinic_policies')
          .insert([{
            clinic_id: clinicId,
            policy_type: formData.policy_type,
            policy_text: formData.policy_text,
            policies_text: formData.policy_text,
          }]);
        
        if (insertError) throw insertError;
        toast({ title: "Éxito", description: "Política creada correctamente." });
      }
      closeEditModal();
      fetchPolicies();
    } catch (err) {
      console.error('Error saving policy', err);
      toast({ variant: "destructive", title: "Error", description: err.message || "Hubo un error al guardar la política." });
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeletePolicy = async (id) => {
    try {
      const { error: deleteError } = await supabase
        .from('clinic_policies')
        .delete()
        .eq('id', id);
        
      if (deleteError) throw deleteError;
      toast({ title: "Éxito", description: "Política eliminada correctamente." });
      fetchPolicies();
    } catch (err) {
      console.error('Error deleting policy', err);
      toast({ variant: "destructive", title: "Error", description: "No se pudo eliminar la política." });
    }
  };

  if (!clinicId) return null;

  return (
    <Card className="w-full shadow-sm border-border/60 overflow-hidden mb-6">
      <CardHeader className="bg-muted/20 border-b border-border/40 py-4 px-5 flex flex-row items-center justify-between">
        <CardTitle className="text-xl font-bold flex items-center text-primary">
          <FiFileText className="w-5 h-5 mr-3" />
          Políticas y Reglas
        </CardTitle>
        {isHost && (
          <Button onClick={openCreateModal} size="sm" variant="outline" className="flex items-center gap-1.5">
            <FiPlus className="w-4 h-4" /> Agregar Política
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
           <div className="space-y-4 p-5">
             {[1, 2].map(i => (
               <div key={i} className="flex gap-4">
                 <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                 <div className="space-y-2 flex-1">
                   <Skeleton className="h-5 w-1/3" />
                   <Skeleton className="h-4 w-full" />
                   <Skeleton className="h-4 w-5/6" />
                 </div>
               </div>
             ))}
           </div>
        ) : error ? (
           <div className="p-6 text-center text-destructive">
             <FiAlertCircle className="w-8 h-8 mx-auto mb-2 opacity-80" />
             <p className="mb-4">{error}</p>
             <Button variant="outline" onClick={fetchPolicies}>Reintentar</Button>
           </div>
        ) : policies.length > 0 ? (
          <div className="divide-y divide-border/40">
            {policies.map(policy => {
              // Legacy support: if policies_html exists, render it. Otherwise plain text.
              const isHtml = !!policy.policies_html && !policy.policy_type;
              
              return (
                <div key={policy.id} className="p-5 flex flex-col md:flex-row gap-4 group hover:bg-muted/10 transition-colors">
                  <div className="flex-1">
                    {isHtml ? (
                      <div 
                        className="prose-policies max-w-none text-sm leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(policy.policies_html) }}
                      />
                    ) : (
                      <>
                        <h4 className="font-semibold text-foreground mb-1 flex items-center gap-2">
                           <FiShield className="w-4 h-4 text-primary" /> 
                           {policy.policy_type || 'Regla General'}
                        </h4>
                        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                          {policy.policy_text || policy.policies_text}
                        </p>
                      </>
                    )}
                  </div>
                  
                  {isHost && (
                    <div className="flex flex-row md:flex-col gap-2 shrink-0 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity justify-end md:justify-start">
                      <Button variant="secondary" size="icon" onClick={() => openEditModal(policy)} className="h-8 w-8">
                        <FiEdit2 className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="icon" className="h-8 w-8">
                            <FiTrash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Eliminar política?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción no se puede deshacer. Se eliminará permanentemente la regla de la clínica.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeletePolicy(policy.id)} className="bg-destructive text-destructive-foreground">
                              Eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-center px-4">
            <div className="bg-muted/50 p-4 rounded-full mb-3">
              <FiInfo className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-foreground font-medium text-lg mb-1">Sin políticas establecidas</p>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mb-5">
              Esta clínica no ha definido reglas específicas aún. Se aplican las normas generales de convivencia de la plataforma.
            </p>
            {isHost && (
              <Button onClick={openCreateModal}>
                <FiPlus className="w-4 h-4 mr-2" /> Crear Primera Política
              </Button>
            )}
          </div>
        )}
      </CardContent>

      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Política' : 'Nueva Política'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="policy_type">Título / Tipo de Regla</Label>
              <Input 
                id="policy_type" 
                name="policy_type"
                value={formData.policy_type}
                onChange={handleInputChange}
                placeholder="Ej: Cancelaciones, Limpieza, Uso de Equipos..." 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="policy_text">Descripción Detallada</Label>
              <Textarea 
                id="policy_text" 
                name="policy_text"
                value={formData.policy_text}
                onChange={handleInputChange}
                placeholder="Describe claramente las condiciones de esta regla..."
                className="min-h-[120px] resize-y"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeEditModal} disabled={formLoading}>Cancelar</Button>
            <Button onClick={handleSavePolicy} disabled={formLoading}>
              {formLoading ? <FiLoader className="w-4 h-4 animate-spin mr-2" /> : null}
              Guardar Política
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default ClinicPoliciesSection;