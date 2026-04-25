import React, { useState, useEffect } from 'react';
import { supabaseClient } from '@/config/supabaseConfig';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Search, Filter, RefreshCw, FileJson } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const AuditLogViewer = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [limit, setLimit] = useState(50);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('audit_logs')
        .select(`
          *,
          profiles:admin_id (full_name, email, role)
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (searchTerm) {
        // Simple search on action or resource
        query = query.or(`action.ilike.%${searchTerm}%,target_resource.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [limit]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLogs();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const getActionBadge = (action) => {
    if (action.includes('delete') || action.includes('ban') || action.includes('reject')) return 'destructive';
    if (action.includes('update') || action.includes('edit')) return 'default'; // blue-ish
    if (action.includes('create') || action.includes('approve')) return 'secondary'; // green-ish usually or secondary style
    return 'outline';
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle>Historial de Acciones</CardTitle>
          <CardDescription>Auditoría de cambios y movimientos administrativos en la plataforma.</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={fetchLogs} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 py-4">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por acción o recurso..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 max-w-sm"
            />
          </div>
          <div className="flex items-center gap-2">
             <Filter className="h-4 w-4 text-muted-foreground" />
             <select 
               className="h-10 rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
               value={limit}
               onChange={(e) => setLimit(Number(e.target.value))}
             >
               <option value={50}>50 registros</option>
               <option value={100}>100 registros</option>
               <option value={500}>500 registros</option>
             </select>
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha / Hora</TableHead>
                <TableHead>Administrador</TableHead>
                <TableHead>Acción</TableHead>
                <TableHead>Recurso Objetivo</TableHead>
                <TableHead className="text-right">Detalles</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 && !loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No se encontraron registros.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium whitespace-nowrap">
                      {format(new Date(log.created_at), "dd MMM yyyy, HH:mm", { locale: es })}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm">{log.profiles?.full_name || 'Sistema'}</span>
                        <span className="text-xs text-muted-foreground">{log.profiles?.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getActionBadge(log.action)} className="capitalize">
                        {log.action.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {log.target_resource}
                      {log.target_id && <span className="text-xs block font-mono opacity-50 truncate w-24">ID: {log.target_id.slice(0, 8)}...</span>}
                    </TableCell>
                    <TableCell className="text-right">
                      {log.details && Object.keys(log.details).length > 0 && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <FileJson className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Detalles del Registro</DialogTitle>
                              <DialogDescription>
                                ID: {log.id}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="bg-muted p-4 rounded-md overflow-auto max-h-[300px]">
                              <pre className="text-xs font-mono whitespace-pre-wrap">
                                {JSON.stringify(log.details, null, 2)}
                              </pre>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default AuditLogViewer;