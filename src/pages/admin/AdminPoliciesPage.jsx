import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, Plus, Search, Edit, Trash2, FileText } from 'lucide-react';
import PolicyModal from '@/components/admin/policies/PolicyModal';
import { motion } from 'framer-motion';

const AdminPoliciesPage = () => {
    const [policies, setPolicies] = useState([]);
    const [filteredPolicies, setFilteredPolicies] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    
    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPolicy, setEditingPolicy] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false); // Task 1: Fixed missing isEditing state
    
    // Delete states
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [policyToDelete, setPolicyToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const { toast } = useToast();

    const fetchPolicies = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('system_config')
                .select('value')
                .eq('key', 'policies')
                .single();

            if (error && error.code !== 'PGRST116') {
                throw error;
            }

            const fetchedPolicies = data?.value?.policies || [];
            
            // Sort by order
            fetchedPolicies.sort((a, b) => (a.order || 0) - (b.order || 0));
            
            setPolicies(fetchedPolicies);
            setFilteredPolicies(fetchedPolicies);
        } catch (error) {
            console.error('Error fetching policies:', error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "No se pudieron cargar las políticas.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPolicies();
    }, []);

    useEffect(() => {
        if (searchQuery.trim() === '') {
            setFilteredPolicies(policies);
        } else {
            const lowerQuery = searchQuery.toLowerCase();
            const filtered = policies.filter(p => 
                p.title.toLowerCase().includes(lowerQuery) || 
                p.description.toLowerCase().includes(lowerQuery)
            );
            setFilteredPolicies(filtered);
        }
    }, [searchQuery, policies]);

    const handleOpenCreateModal = () => {
        setEditingPolicy(null);
        setIsEditing(false);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (policy) => {
        setEditingPolicy(policy);
        setIsEditing(true);
        setIsModalOpen(true);
    };

    const handleSavePolicy = async (formData) => {
        setIsSaving(true);
        try {
            let updatedPolicies = [...policies];
            // Task 1: Using the newly defined isEditing state for consistency
            const savingModeIsEditing = isEditing || !!editingPolicy;

            if (savingModeIsEditing) {
                updatedPolicies = updatedPolicies.map(p => 
                    p.id === editingPolicy.id ? { ...formData, id: editingPolicy.id, updated_at: new Date().toISOString() } : p
                );
            } else {
                const newPolicy = {
                    ...formData,
                    id: crypto.randomUUID(),
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                };
                updatedPolicies.push(newPolicy);
            }

            // Sort again before saving
            updatedPolicies.sort((a, b) => (a.order || 0) - (b.order || 0));

            const { error } = await supabase
                .from('system_config')
                .upsert(
                    { key: 'policies', value: { policies: updatedPolicies } },
                    { onConflict: 'key' }
                );

            if (error) throw error;

            toast({
                title: "Éxito",
                description: savingModeIsEditing ? "Política actualizada exitosamente" : "Política creada exitosamente",
            });
            
            setIsModalOpen(false);
            fetchPolicies();
        } catch (error) {
            console.error('Error saving policy:', error);
            toast({
                variant: "destructive",
                title: "Error",
                description: isEditing ? "Error al actualizar política" : "Error al crear política",
            });
        } finally {
            setIsSaving(false);
        }
    };

    const confirmDelete = (policy) => {
        setPolicyToDelete(policy);
        setIsDeleteDialogOpen(true);
    };

    const handleDeletePolicy = async () => {
        if (!policyToDelete) return;
        
        setIsDeleting(true);
        try {
            const updatedPolicies = policies.filter(p => p.id !== policyToDelete.id);

            const { error } = await supabase
                .from('system_config')
                .upsert(
                    { key: 'policies', value: { policies: updatedPolicies } },
                    { onConflict: 'key' }
                );

            if (error) throw error;

            toast({
                title: "Éxito",
                description: "Política eliminada exitosamente",
            });
            
            setIsDeleteDialogOpen(false);
            fetchPolicies();
        } catch (error) {
            console.error('Error deleting policy:', error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Error al eliminar política",
            });
        } finally {
            setIsDeleting(false);
            setPolicyToDelete(null);
        }
    };

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <FileText className="w-8 h-8 text-primary" />
                        Gestión de Políticas
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Administra los términos, condiciones y políticas de la plataforma.
                    </p>
                </div>
                <Button onClick={handleOpenCreateModal} className="shrink-0">
                    <Plus className="w-4 h-4 mr-2" />
                    Añadir Nueva Política
                </Button>
            </div>

            <div className="flex items-center space-x-2 max-w-md">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar políticas..."
                        className="pl-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
                {isLoading ? (
                    <div className="flex justify-center items-center p-12">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : filteredPolicies.length === 0 ? (
                    <div className="text-center p-12">
                        <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                        <h3 className="text-lg font-medium text-foreground">No se encontraron políticas</h3>
                        <p className="text-muted-foreground mt-1">
                            {searchQuery ? "Intenta con otra búsqueda." : "Comienza añadiendo una nueva política."}
                        </p>
                        {!searchQuery && (
                            <Button variant="outline" className="mt-4" onClick={handleOpenCreateModal}>
                                Añadir Política
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[50px]">Orden</TableHead>
                                    <TableHead className="w-[250px]">Título</TableHead>
                                    <TableHead>Descripción</TableHead>
                                    <TableHead className="text-right w-[150px]">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredPolicies.map((policy) => (
                                    <TableRow key={policy.id} className="admin-table-row">
                                        <TableCell className="font-medium text-center text-muted-foreground">
                                            {policy.order || 0}
                                        </TableCell>
                                        <TableCell className="font-semibold">{policy.title}</TableCell>
                                        <TableCell className="text-muted-foreground truncate max-w-[300px]" title={policy.description}>
                                            {policy.description}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon"
                                                    onClick={() => handleOpenEditModal(policy)}
                                                    title="Editar"
                                                >
                                                    <Edit className="w-4 h-4 text-blue-500" />
                                                </Button>
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon"
                                                    onClick={() => confirmDelete(policy)}
                                                    title="Eliminar"
                                                >
                                                    <Trash2 className="w-4 h-4 text-destructive" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>

            <PolicyModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                policy={editingPolicy}
                onSave={handleSavePolicy}
                isLoading={isSaving}
            />

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro de que deseas eliminar esta política?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. La política "{policyToDelete?.title}" será eliminada permanentemente del sistema.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={(e) => {
                                e.preventDefault();
                                handleDeletePolicy();
                            }} 
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={isDeleting}
                        >
                            {isDeleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                            Confirmar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default AdminPoliciesPage;