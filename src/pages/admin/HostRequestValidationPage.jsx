import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { DataTable } from '@/components/admin/DataTable';
import { Badge } from '@/components/ui/badge.jsx';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Loader2, UserCheck, ArrowLeft, Check, X } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const HostRequestValidationPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('pending');
  const { profile } = useUser();
  const navigate = useNavigate();
  const { toast } = useToast();

  const fetchRequests = useCallback(async () => {
    if (profile?.role !== 'admin') {
      setLoading(false);
      setError('Acceso denegado.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Explicitly select the profile associated with user_id to avoid ambiguity
      const { data, error } = await supabase
        .from('host_requests')
        .select('*, user_id(full_name, email)') // Specify user_id relationship
        .order('created_at', { ascending: false });
      if (error) throw error;
      setRequests(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleUpdateRequest = async (requestId, userId, newStatus) => {
    try {
      const { error: requestError } = await supabase
        .from('host_requests')
        .update({ status: newStatus, reviewed_by: profile.id })
        .eq('id', requestId);

      if (requestError) throw requestError;

      if (newStatus === 'approved') {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ role: 'clinic_host' })
          .eq('id', userId);
        if (profileError) throw profileError;
      }
      
      toast({
        title: 'Solicitud actualizada',
        description: `La solicitud ha sido ${newStatus === 'approved' ? 'aprobada' : 'rechazada'}.`,
      });

      fetchRequests();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error al actualizar',
        description: error.message,
      });
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <Badge variant="success">Aprobada</Badge>;
      case 'pending':
        return <Badge variant="warning">Pendiente</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rechazada</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const columns = useMemo(() => [
    { 
      accessorKey: 'user_id.full_name', // Access through the specified relationship
      header: 'Nombre',
      cell: ({ row }) => row.original.user_id?.full_name || 'N/A'
    },
    { 
      accessorKey: 'user_id.email', // Access through the specified relationship
      header: 'Email',
      cell: ({ row }) => row.original.user_id?.email || 'N/A'
    },
    { accessorKey: 'reason', header: 'Motivo' },
    { 
      accessorKey: 'created_at', 
      header: 'Fecha Solicitud',
      cell: ({ row }) => format(new Date(row.original.created_at), 'dd/MM/yyyy HH:mm', { locale: es })
    },
    { 
      accessorKey: 'status', 
      header: 'Estado',
      cell: ({ row }) => getStatusBadge(row.original.status)
    },
    {
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }) => (
        row.original.status === 'pending' && (
          <div className="flex space-x-2">
            <Button size="sm" variant="success" onClick={() => handleUpdateRequest(row.original.id, row.original.user_id.id, 'approved')}>
              <Check className="h-4 w-4 mr-1" /> Aprobar
            </Button>
            <Button size="sm" variant="destructive" onClick={() => handleUpdateRequest(row.original.id, row.original.user_id.id, 'rejected')}>
              <X className="h-4 w-4 mr-1" /> Rechazar
            </Button>
          </div>
        )
      ),
    },
  ], [fetchRequests]);

  const filteredRequests = useMemo(() => {
    if (activeTab === 'all') return requests;
    return requests.filter(req => req.status === activeTab);
  }, [requests, activeTab]);

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }
  if (error) {
    return <div className="text-red-500 text-center">{error}</div>;
  }

  return (
    <div className="container mx-auto py-10">
      <div className="mb-6">
        <Button variant="outline" onClick={() => navigate('/admin-dashboard')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver al Panel
        </Button>
      </div>

      <div className="flex items-center space-x-4 mb-8">
        <UserCheck className="h-10 w-10 text-primary"/>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Validación de Anfitriones</h1>
          <p className="text-muted-foreground">Revisa y gestiona las solicitudes para ser anfitrión.</p>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pending">Pendientes</TabsTrigger>
          <TabsTrigger value="approved">Aprobadas</TabsTrigger>
          <TabsTrigger value="rejected">Rechazadas</TabsTrigger>
          <TabsTrigger value="all">Todas</TabsTrigger>
        </TabsList>
        <TabsContent value="pending">
          <DataTable columns={columns} data={filteredRequests} />
        </TabsContent>
        <TabsContent value="approved">
          <DataTable columns={columns} data={filteredRequests} />
        </TabsContent>
        <TabsContent value="rejected">
          <DataTable columns={columns} data={filteredRequests} />
        </TabsContent>
        <TabsContent value="all">
          <DataTable columns={columns} data={filteredRequests} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HostRequestValidationPage;