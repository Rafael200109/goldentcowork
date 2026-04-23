import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { DataTable } from '@/components/admin/DataTable';
import { Badge } from '@/components/ui/badge.jsx';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Loader2, Users, ArrowLeft, RefreshCw } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import UserActions from '@/components/admin/UserActions';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import CreateUserDialog from '@/components/admin/CreateUserDialog';

const UserManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const { profile } = useUser();
  const navigate = useNavigate();

  const fetchUsers = useCallback(async () => {
    if (profile?.role !== 'admin') {
      setLoading(false);
      setError('Acceso denegado.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'verified':
        return <Badge variant="success">Verificado</Badge>;
      case 'pending_review':
        return <Badge variant="warning">Pendiente</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rechazado</Badge>;
      case 'not_submitted':
          return <Badge variant="outline">No Enviado</Badge>;
      default:
        return <Badge variant="secondary">N/A</Badge>;
    }
  };

  const columns = useMemo(() => [
    { accessorKey: 'full_name', header: 'Nombre' },
    { accessorKey: 'email', header: 'Email' },
    { 
      accessorKey: 'role', 
      header: 'Rol',
      cell: ({ row }) => {
        const role = row.original.role;
        const map = {
            dentist: 'Dentista',
            clinic_host: 'Anfitrión',
            admin: 'Admin',
            accountant: 'Contable',
            support: 'Soporte'
        };
        return <Badge variant="secondary" className="capitalize">{map[role] || role}</Badge>
      }
    },
    { 
      accessorKey: 'documentation_status', 
      header: 'Estado Docs',
      cell: ({ row }) => getStatusBadge(row.original.documentation_status)
    },
    {
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }) => <UserActions user={row.original} onActionComplete={fetchUsers} />,
    },
  ], [fetchUsers]);

  const filteredUsers = useMemo(() => {
    if (activeTab === 'all') return users;
    return users.filter(user => user.role === activeTab);
  }, [users, activeTab]);

  if (loading && users.length === 0) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }
  if (error) {
    return <div className="text-red-500 text-center">{error}</div>;
  }

  return (
    <div className="container mx-auto py-10 animate-in fade-in duration-500">
      <div className="mb-6 flex justify-between items-center">
        <Button variant="outline" onClick={() => navigate('/admin-dashboard')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-primary/10 rounded-full">
            <Users className="h-8 w-8 text-primary"/>
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestión de Usuarios</h1>
            <p className="text-muted-foreground">Supervisa y administra a todos los usuarios de la plataforma.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={fetchUsers} title="Actualizar lista">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <CreateUserDialog onUserCreated={fetchUsers} />
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6 mb-8">
          <TabsTrigger value="all">Todos ({users.length})</TabsTrigger>
          <TabsTrigger value="dentist">Dentistas</TabsTrigger>
          <TabsTrigger value="clinic_host">Anfitriones</TabsTrigger>
          <TabsTrigger value="support">Soporte</TabsTrigger>
          <TabsTrigger value="accountant">Contables</TabsTrigger>
          <TabsTrigger value="admin">Admins</TabsTrigger>
        </TabsList>
        <div className="bg-white rounded-md border p-4 shadow-sm">
           <DataTable columns={columns} data={filteredUsers} />
        </div>
      </Tabs>
    </div>
  );
};

export default UserManagementPage;