import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader2, Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight, FileDown } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

const CheckInHistory = ({ history, loading, totalCount, fetchHistory }) => {
  const [page, setPage] = useState(1);
  const limit = 20;

  useEffect(() => {
    fetchHistory(limit, (page - 1) * limit);
  }, [page, fetchHistory]);

  const totalPages = Math.ceil(totalCount / limit);

  const formatDuration = (minutes) => {
    if (minutes === null || minutes === undefined) return '-';
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}m`;
  };

  const handleExportCSV = () => {
    if (!history || history.length === 0) return;
    
    const headers = ['Fecha', 'Llegada', 'Salida', 'Duracion (Minutos)', 'Clinica', 'Notas Llegada', 'Notas Salida'];
    const csvContent = [
      headers.join(','),
      ...history.map(row => {
        return [
          format(parseISO(row.check_in_time), 'yyyy-MM-dd'),
          format(parseISO(row.check_in_time), 'HH:mm'),
          row.check_out_time ? format(parseISO(row.check_out_time), 'HH:mm') : 'Activo',
          row.duration_minutes || '',
          `"${row.clinic?.name || ''}"`,
          `"${(row.check_in_notes || '').replace(/"/g, '""')}"`,
          `"${(row.check_out_notes || '').replace(/"/g, '""')}"`
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `historial_presencia_${format(new Date(), 'yyyyMMdd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card className="glassmorphism">
      <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <CardTitle>Historial de Presencia</CardTitle>
          <CardDescription>Registro de todas tus entradas y salidas de las clínicas.</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={history.length === 0 || loading}>
          <FileDown className="w-4 h-4 mr-2" />
          Exportar CSV
        </Button>
      </CardHeader>
      <CardContent>
        {loading && history.length === 0 ? (
          <div className="flex justify-center p-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]">Fecha</TableHead>
                    <TableHead>Clínica</TableHead>
                    <TableHead>Hora Llegada</TableHead>
                    <TableHead>Hora Salida</TableHead>
                    <TableHead>Duración</TableHead>
                    <TableHead className="hidden md:table-cell">Notas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.length > 0 ? (
                    history.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                            {format(parseISO(record.check_in_time), 'dd MMM, yy', { locale: es })}
                          </div>
                        </TableCell>
                        <TableCell>{record.clinic?.name}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-status-checked-in font-medium">
                            <Clock className="w-3.5 h-3.5" />
                            {format(parseISO(record.check_in_time), 'h:mm a')}
                          </div>
                        </TableCell>
                        <TableCell>
                          {record.check_out_time ? (
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <Clock className="w-3.5 h-3.5" />
                              {format(parseISO(record.check_out_time), 'h:mm a')}
                            </div>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                              Activo ahora
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatDuration(record.duration_minutes)}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground max-w-[200px] truncate" title={record.check_out_notes || record.check_in_notes || ''}>
                          {record.check_out_notes || record.check_in_notes || '-'}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                        No hay registros de presencia en el historial.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Mostrando {(page - 1) * limit + 1} - {Math.min(page * limit, totalCount)} de {totalCount}
                </p>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1 || loading}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages || loading}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default CheckInHistory;