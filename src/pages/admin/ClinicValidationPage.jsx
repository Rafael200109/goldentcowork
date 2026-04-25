import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabaseClient } from '@/config/supabaseConfig';
import { Loader2, ShieldCheck, ArrowLeft, Building, ListChecks, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import ClinicValidationCard from '@/components/admin/ClinicValidationCard';
import { DataTable } from '@/components/admin/DataTable';
import ClinicManagementActions from '@/components/admin/ClinicManagementActions';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const ClinicValidationPage = () => {
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [globalFilter, setGlobalFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const navigate = useNavigate();
  const { toast } = useToast();

  const fetchClinics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('clinics')
        .select(`
          *,
          host:profiles(full_name, email, avatar_url),
          photos:clinic_photos(photo_url, is_cover)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClinics(data);
    } catch (err) {
      setError(err.message);
      toast({
        variant: 'destructive',
        title: 'Error al cargar clínicas',
        description: err.message,
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchClinics();
  }, [fetchClinics]);

  // Derived state for pending clinics (Validation Tab)
  const pendingClinics = useMemo(() => {
    return clinics.filter(c => c.status === 'pending');
  }, [clinics]);

  // Derived state for management table (Management Tab)
  const filteredManagementData = useMemo(() => {
    let filtered = clinics;
    if (statusFilter !== 'all') {
      filtered = filtered.filter(clinic => clinic.status === statusFilter);
    }
    if (globalFilter) {
      const lowerFilter = globalFilter.toLowerCase();
      filtered = filtered.filter(clinic =>
        clinic.name?.toLowerCase().includes(lowerFilter) ||
        clinic.host?.full_name?.toLowerCase().includes(lowerFilter) ||
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
        >
          Clínica
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div className="font-medium">{row.original.name}</div>,
    },
    {
      accessorKey: 'host.full_name',
      header: 'Anfitrión',
      cell: ({ row }) => (
        <div>
          <div>{row.original.host?.full_name || 'N/A'}</div>
          <div className="text-xs text-muted-foreground">{row.original.host?.email || ''}</div>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Estado',
      cell: ({ row }) => {
        const status = row.original.status;
        const variant = {
          published: 'success',
          pending: 'warning',
          rejected: 'destructive',
          archived: 'secondary',
          draft: 'outline',
        }[status] || 'default';
        return <Badge variant={variant} className="capitalize">{status}</Badge>;
      },
    },
    {
      accessorKey: 'address_city',
      header: 'Ubicación',
      cell: ({ row }) => `${row.original.address_city || ''}, ${row.original.address_province || ''}`,
    },
    {
      accessorKey: 'created_at',
      header: 'Fecha Creación',
      cell: ({ row }) => format(new Date(row.original.created_at), 'd MMM, yyyy', { locale: es }),
    },
    {
      id: 'actions',
      cell: ({ row }) => <ClinicManagementActions clinic={row.original} onActionComplete={fetchClinics} />,
    },
  ], [fetchClinics]);

  if (loading && clinics.length === 0) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 animate-in fade-in duration-500">
      <div className="mb-6 flex items-center justify-between">
        <Button variant="outline" onClick={() => navigate('/admin-dashboard')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver al Panel
        </Button>
      </div>

      <div className="flex items-center space-x-4 mb-8">
        <ShieldCheck className="h-10 w-10 text-primary" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Administración de Clínicas</h1>
          <p className="text-muted-foreground">
            Valida nuevas clínicas y gestiona las existentes.
          </p>
        </div>
      </div>

      <Tabs defaultValue="validation" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="validation">Validar ({pendingClinics.length})</TabsTrigger>
          <TabsTrigger value="management">Gestionar Clínicas</TabsTrigger>
        </TabsList>

        {/* --- VALIDATION TAB --- */}
        <TabsContent value="validation" className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
             <div className="flex items-center gap-2 text-yellow-800 font-medium">
                 <ShieldCheck className="w-5 h-5"/>
                 <span>Zona de Validación</span>
             </div>
             <p className="text-sm text-yellow-700 mt-1">
                 Aquí aparecen las clínicas recién registradas que necesitan aprobación manual para ser públicas.
             </p>
          </div>

          {pendingClinics.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {pendingClinics.map((clinic) => (
                <ClinicValidationCard
                  key={clinic.id}
                  clinic={clinic}
                  onActionComplete={fetchClinics}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 border-2 border-dashed rounded-lg bg-slate-50/50">
              <Building className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
              <h3 className="mt-2 text-lg font-semibold text-gray-900">¡Todo al día!</h3>
              <p className="mt-1 text-sm text-gray-500">No hay clínicas pendientes de validación en este momento.</p>
            </div>
          )}
        </TabsContent>

        {/* --- MANAGEMENT TAB --- */}
        <TabsContent value="management" className="space-y-4">
           <div className="bg-white p-6 rounded-lg border shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                <div className="flex items-center gap-2">
                    <ListChecks className="w-5 h-5 text-primary"/>
                    <h2 className="text-xl font-semibold">Listado Global de Clínicas</h2>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3">
                    <Input
                      placeholder="Buscar por nombre, anfitrión..."
                      value={globalFilter}
                      onChange={(e) => setGlobalFilter(e.target.value)}
                      className="w-full sm:w-[300px]"
                    />
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder="Estado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="published">Publicadas</SelectItem>
                        <SelectItem value="pending">Pendientes</SelectItem>
                        <SelectItem value="rejected">Rechazadas</SelectItem>
                        <SelectItem value="archived">Archivadas</SelectItem>
                        <SelectItem value="draft">Borrador</SelectItem>
                      </SelectContent>
                    </Select>
                </div>
              </div>

              <DataTable
                columns={columns}
                data={filteredManagementData}
                isLoading={loading}
                globalFilter={globalFilter}
                setGlobalFilter={setGlobalFilter}
              />
           </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ClinicValidationPage;