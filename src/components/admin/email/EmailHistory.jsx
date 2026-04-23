import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { 
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, RefreshCcw, Search } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const EmailHistory = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchLogs = async () => {
        setLoading(true);
        let query = supabase
            .from('email_logs')
            .select('*')
            .order('sent_at', { ascending: false })
            .limit(50);
        
        if (searchTerm) {
            query = query.or(`to_email.ilike.%${searchTerm}%,template_name.ilike.%${searchTerm}%`);
        }

        const { data, error } = await query;
        if (!error) {
            setLogs(data);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const getStatusBadge = (status) => {
        switch(status) {
            case 'sent': return <Badge className="bg-green-500">Enviado</Badge>;
            case 'failed': return <Badge variant="destructive">Fallido</Badge>;
            default: return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex gap-2">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Buscar por email o plantilla..." 
                        className="pl-9"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && fetchLogs()}
                    />
                </div>
                <Button variant="outline" onClick={fetchLogs}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />}
                </Button>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Destinatario</TableHead>
                            <TableHead>Plantilla</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead>Detalles</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8">Cargando...</TableCell>
                            </TableRow>
                        ) : logs.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8">No hay registros</TableCell>
                            </TableRow>
                        ) : (
                            logs.map((log) => (
                                <TableRow key={log.id}>
                                    <TableCell className="whitespace-nowrap">
                                        {format(new Date(log.sent_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                                    </TableCell>
                                    <TableCell>{log.to_email}</TableCell>
                                    <TableCell><Badge variant="outline">{log.template_name}</Badge></TableCell>
                                    <TableCell>{getStatusBadge(log.status)}</TableCell>
                                    <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">
                                        {log.error_message || log.message_id}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};

export default EmailHistory;