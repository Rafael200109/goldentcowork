import React, { useState, useEffect, useMemo } from 'react';
import { supabaseClient } from '@/config/supabaseConfig';
import { DataTable } from '@/components/admin/DataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, ListChecks, ArrowUpDown, Search, Image as ImageIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import ClinicManagementActions from '@/components/admin/ClinicManagementActions';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import AdminPhotoManager from '@/components/admin/AdminPhotoManager';

const ClinicManagementPage = () => {
    const [clinics, setClinics] = useState([]);
    const [loading, setLoading] = useState(true);
    const [globalFilter, setGlobalFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedClinicPhotos, setSelectedClinicPhotos] = useState(null);
    const navigate = useNavigate();
    const { toast } = useToast();

    const fetchClinics = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('clinics')
                .select('*, host:profiles!host_id(full_name, email)')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setClinics(data || []);
        } catch (error) {
            console.error("Error fetching clinics:", error);
            toast({
                variant: 'destructive',
                title: 'Error al cargar clínicas',
                description: 'No se pudo obtener la lista de clínicas.',
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClinics();
    }, []);

    const filteredData = useMemo(() => {
        let filtered = clinics;
        
        if (statusFilter !== 'all') {
            filtered = filtered.filter(clinic => clinic.status === statusFilter);
        }
        
        if (globalFilter) {
            const lowerFilter = globalFilter.toLowerCase();
            filtered = filtered.filter(clinic =>
                clinic.name?.toLowerCase().includes(lowerFilter) ||
                clinic.host?.full_name?.toLowerCase().includes(lowerFilter) ||
                clinic.host?.email?.toLowerCase().includes(lowerFilter) ||
                clinic.address_city?.toLowerCase().includes(lowerFilter)
            );
        }
        return filtered;
    }, [clinics, globalFilter, statusFilter]);

    const columns = useMemo(() => [
        {
            accessorKey: 'name',
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                    className="p-0 hover:bg-transparent text-left font-medium"
                >
                    Clínica
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => (
                <div className="font-medium text-foreground">
                    {row.original.name}
                </div>
            ),
        },
        {
            accessorKey: 'host.full_name',
            header: 'Anfitrión',
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">{row.original.host?.full_name || 'Sin nombre'}</span>
                    <span className="text-xs text-muted-foreground">{row.original.host?.email || 'Sin email'}</span>
                </div>
            ),
        },
        {
            accessorKey: 'status',
            header: 'Estado',
            cell: ({ row }) => {
                const status = row.original.status;
                let badgeClass = '';
                let label = status;

                switch (status) {
                    case 'published': badgeClass = 'bg-green-100 text-green-800 border-green-200'; label = 'Publicada'; break;
                    case 'pending': badgeClass = 'bg-yellow-100 text-yellow-800 border-yellow-200'; label = 'Pendiente'; break;
                    case 'rejected': badgeClass = 'bg-red-100 text-red-800 border-red-200'; label = 'Rechazada'; break;
                    case 'archived': badgeClass = 'bg-gray-100 text-gray-800 border-gray-200'; label = 'Archivada'; break;
                    default: badgeClass = 'variant-outline'; label = status;
                }
                return <Badge className={`${badgeClass} capitalize border`}>{label}</Badge>;
            },
        },
        {
            id: 'photos',
            header: 'Fotos',
            cell: ({ row }) => (
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setSelectedClinicPhotos(row.original)}
                    className="flex items-center gap-1"
                >
                    <ImageIcon className="w-4 h-4" /> Ver/Editar
                </Button>
            ),
        },
        {
            id: 'actions',
            cell: ({ row }) => <ClinicManagementActions clinic={row.original} onActionComplete={fetchClinics} />,
        },
    ], [fetchClinics]);

    return (
        <div className="container mx-auto py-8 space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center space-x-4">
                    <div className="p-3 bg-primary/10 rounded-full dark:bg-primary/20">
                        <ListChecks className="h-6 w-6 text-primary dark:text-primary-foreground" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">Gestión de Clínicas</h1>
                        <p className="text-muted-foreground">Administra y monitorea todas las clínicas registradas en la plataforma.</p>
                    </div>
                </div>
                <Button variant="outline" onClick={() => navigate('/admin-dashboard')} className="shrink-0">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver al Panel
                </Button>
            </div>

            <Card className="border-border/50 shadow-md dark:bg-card">
                <CardHeader className="pb-4 border-b border-border/50">
                   <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar por nombre o anfitrión..."
                                value={globalFilter}
                                onChange={(e) => setGlobalFilter(e.target.value)}
                                className="pl-9 bg-background"
                            />
                        </div>
                        <div className="flex items-center gap-2 w-full md:w-auto">
                             <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-full md:w-[200px] bg-background">
                                    <SelectValue placeholder="Filtrar por estado" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos los estados</SelectItem>
                                    <SelectItem value="published">Publicada</SelectItem>
                                    <SelectItem value="pending">Pendiente</SelectItem>
                                    <SelectItem value="rejected">Rechazada</SelectItem>
                                    <SelectItem value="archived">Archivada</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                   </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="rounded-b-xl overflow-hidden bg-background">
                        <DataTable
                            columns={columns}
                            data={filteredData}
                            isLoading={loading}
                        />
                    </div>
                </CardContent>
            </Card>

            <Dialog open={!!selectedClinicPhotos} onOpenChange={(open) => !open && setSelectedClinicPhotos(null)}>
                <DialogContent className="max-w-4xl h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Gestión de Fotos - Administrador</DialogTitle>
                        <DialogDescription>
                            Gestiona las fotos de la clínica {selectedClinicPhotos?.name}
                        </DialogDescription>
                    </DialogHeader>
                    {selectedClinicPhotos && (
                        <AdminPhotoManager 
                            clinicId={selectedClinicPhotos.id} 
                            clinicName={selectedClinicPhotos.name} 
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default ClinicManagementPage;