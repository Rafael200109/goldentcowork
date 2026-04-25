import React, { useState, useEffect } from 'react';
import { supabaseClient } from '@/config/supabaseConfig';
import { 
  Search, Shield, User, MoreHorizontal, 
  CheckCircle2, XCircle, Filter, Loader2, Save
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator 
} from '@/components/ui/dropdown-menu';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';

const SystemUsersManager = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [updatingId, setUpdatingId] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron cargar los usuarios.' });
    } finally {
      setLoading(false);
    }
  };

  const handleRoleUpdate = async (userId, newRole) => {
    setUpdatingId(userId);
    try {
      // Typically you'd use a server function for this to ensure safety, 
      // but assuming admin RLS allows update on profiles:
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
      toast({ title: 'Rol Actualizado', description: 'El rol del usuario ha sido modificado exitosamente.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo actualizar el rol.' });
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-700 hover:bg-red-200 border-red-200';
      case 'support': return 'bg-orange-100 text-orange-700 hover:bg-orange-200 border-orange-200';
      case 'clinic_host': return 'bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200';
      case 'dentist': return 'bg-green-100 text-green-700 hover:bg-green-200 border-green-200';
      case 'accountant': return 'bg-purple-100 text-purple-700 hover:bg-purple-200 border-purple-200';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card p-4 rounded-lg border shadow-sm">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar por nombre o correo..." 
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por rol" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los roles</SelectItem>
              <SelectItem value="admin">Administrador</SelectItem>
              <SelectItem value="clinic_host">Anfitrión</SelectItem>
              <SelectItem value="dentist">Odontólogo</SelectItem>
              <SelectItem value="support">Soporte</SelectItem>
              <SelectItem value="accountant">Contador</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Users List */}
      <div className="rounded-md border bg-card overflow-hidden">
        <div className="grid grid-cols-12 gap-4 p-4 border-b bg-muted/40 font-medium text-xs text-muted-foreground uppercase tracking-wider">
           <div className="col-span-5 sm:col-span-4 pl-2">Usuario</div>
           <div className="col-span-3 sm:col-span-3">Rol Actual</div>
           <div className="col-span-2 hidden sm:block">Estado</div>
           <div className="col-span-4 sm:col-span-3 text-right pr-2">Acciones</div>
        </div>
        
        <ScrollArea className="h-[500px]">
          {loading ? (
             <div className="flex items-center justify-center h-40">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
             </div>
          ) : filteredUsers.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-40 text-muted-foreground gap-2">
                <User className="w-8 h-8 opacity-20" />
                <p>No se encontraron usuarios.</p>
             </div>
          ) : (
             <div className="divide-y">
               {filteredUsers.map((user) => (
                 <div key={user.id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-muted/30 transition-colors">
                    <div className="col-span-5 sm:col-span-4 flex items-center gap-3 overflow-hidden">
                       <Avatar className="h-9 w-9 border">
                          <AvatarImage src={user.avatar_url} />
                          <AvatarFallback className="text-xs">{user.full_name?.substring(0,2).toUpperCase() || 'U'}</AvatarFallback>
                       </Avatar>
                       <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{user.full_name || 'Sin nombre'}</p>
                          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                       </div>
                    </div>
                    
                    <div className="col-span-3 sm:col-span-3">
                       <Badge variant="outline" className={`font-normal capitalize ${getRoleBadgeColor(user.role)}`}>
                         {user.role === 'clinic_host' ? 'Anfitrión' : user.role === 'dentist' ? 'Odontólogo' : user.role}
                       </Badge>
                    </div>

                    <div className="col-span-2 hidden sm:block">
                       <div className="flex items-center gap-1.5 text-xs text-green-600 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Activo
                       </div>
                    </div>

                    <div className="col-span-4 sm:col-span-3 flex justify-end pr-2">
                       <DropdownMenu>
                         <DropdownMenuTrigger asChild>
                           <Button variant="ghost" size="icon" className="h-8 w-8" disabled={updatingId === user.id}>
                             {updatingId === user.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <MoreHorizontal className="w-4 h-4" />}
                           </Button>
                         </DropdownMenuTrigger>
                         <DropdownMenuContent align="end">
                           <DropdownMenuLabel>Gestión de Usuario</DropdownMenuLabel>
                           <DropdownMenuSeparator />
                           <DropdownMenuItem onClick={() => handleRoleUpdate(user.id, 'admin')}>
                              <Shield className="w-4 h-4 mr-2" /> Hacer Admin
                           </DropdownMenuItem>
                           <DropdownMenuItem onClick={() => handleRoleUpdate(user.id, 'support')}>
                              <Shield className="w-4 h-4 mr-2" /> Hacer Soporte
                           </DropdownMenuItem>
                           <DropdownMenuItem onClick={() => handleRoleUpdate(user.id, 'accountant')}>
                              <Shield className="w-4 h-4 mr-2" /> Hacer Contador
                           </DropdownMenuItem>
                           <DropdownMenuSeparator />
                           <DropdownMenuItem className="text-red-600">
                              <XCircle className="w-4 h-4 mr-2" /> Desactivar Cuenta
                           </DropdownMenuItem>
                         </DropdownMenuContent>
                       </DropdownMenu>
                    </div>
                 </div>
               ))}
             </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
};

export default SystemUsersManager;