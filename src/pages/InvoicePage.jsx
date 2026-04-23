import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, Download, AlertTriangle, FileText } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { PDFDownloadLink } from '@react-pdf/renderer';
import InvoicePDF from '@/components/invoices/InvoicePDF';

const InvoicePage = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchInvoice = useCallback(async () => {
    setLoading(true);
    try {
      // Updated query to use explicit foreign key relationship for clinics
      // This fixes the "more than one relationship was found" error
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          booking:bookings (
            *,
            clinic:clinics!bookings_clinic_id_fkey (
              name, 
              address_street, 
              address_sector, 
              address_city
            )
          ),
          dentist:profiles!invoices_dentist_id_fkey(*),
          host:profiles!invoices_host_id_fkey(*)
        `)
        .eq('booking_id', bookingId)
        .single();

      if (error) {
        throw error;
      }

      setInvoice(data);
    } catch (error) {
      console.error("Error fetching invoice:", error);
      if (error.code === 'PGRST116') {
         setInvoice(null);
      } else {
         toast({ variant: 'destructive', title: 'Error', description: 'No se pudo cargar la factura. ' + (error.message || '') });
      }
    } finally {
      setLoading(false);
    }
  }, [bookingId, toast]);

  useEffect(() => {
    fetchInvoice();
  }, [fetchInvoice]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-[calc(100vh-200px)]"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>;
  }

  if (!invoice) {
    return (
      <div className="text-center py-12 flex flex-col items-center">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold">Factura no encontrada</h2>
        <p className="mt-2 text-muted-foreground mb-6">No pudimos encontrar la factura para esta reserva. Es posible que aún no se haya generado.</p>
        <Button onClick={() => navigate('/my-bookings')} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Mis Reservas
        </Button>
      </div>
    );
  }

  const { booking, dentist, host } = invoice;
  // Safe check for booking existence and calculate duration
  const duration = booking ? (new Date(booking.end_time) - new Date(booking.start_time)) / (1000 * 60 * 60) : 0;
  const pricePerHour = duration > 0 ? (invoice.total / duration) : 0;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto p-4">
      
      {/* Actions Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="pl-0 hover:pl-0 hover:bg-transparent hover:text-primary">
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver
        </Button>
        
        <PDFDownloadLink
          document={<InvoicePDF invoice={invoice} />}
          fileName={`Factura_${invoice.invoice_number}.pdf`}
          className="w-full sm:w-auto"
        >
          {({ blob, url, loading: pdfLoading, error }) => (
            <Button className="w-full sm:w-auto bg-primary text-white hover:bg-primary/90">
              {pdfLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              {pdfLoading ? 'Generando PDF...' : 'Descargar Factura PDF'}
            </Button>
          )}
        </PDFDownloadLink>
      </div>

      {/* HTML Preview of Invoice */}
      <Card className="glassmorphism shadow-xl overflow-hidden border-t-4 border-t-primary">
        <div className="bg-primary/5 p-2 text-center text-xs text-primary font-medium print:hidden">
          Vista Previa
        </div>
        <CardHeader className="border-b pb-8 pt-8 px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                 <FileText className="w-5 h-5 text-primary" />
                 <h1 className="text-2xl font-bold tracking-tight">FACTURA</h1>
              </div>
              <p className="text-muted-foreground font-mono text-lg">#{invoice.invoice_number}</p>
              <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                PAGADO
              </div>
            </div>
            <div className="text-left sm:text-right">
              <div className="flex items-center sm:justify-end gap-2 mb-2">
                <img alt="Goldent Logo" className="h-8 w-auto" src="https://storage.googleapis.com/hostinger-horizons-assets-prod/63ef2070-7e9f-47c2-85b6-42a10bded4a0/13b7a79bee570a0a14cc2cb114de4e4d.png" />
                <span className="font-bold text-primary">Goldent Co Work</span>
              </div>
              <p className="text-sm text-muted-foreground">Conectando Sonrisas</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-dashed">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Fecha de Emisión</p>
              <p className="font-medium">{format(parseISO(invoice.issue_date), 'dd MMMM, yyyy', { locale: es })}</p>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Vencimiento</p>
              <p className="font-medium">{format(parseISO(invoice.due_date), 'dd MMMM, yyyy', { locale: es })}</p>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="px-8 py-8">
          <div className="grid md:grid-cols-2 gap-10 mb-10">
            <div className="space-y-1">
              <h3 className="text-xs font-bold uppercase text-muted-foreground tracking-wider mb-3">De (Anfitrión)</h3>
              <p className="font-semibold text-lg">{host?.host_legal_name || host?.full_name || 'N/A'}</p>
              <p className="text-sm text-muted-foreground">{host?.host_rnc ? `RNC: ${host.host_rnc}` : (host?.dentist_id_document_number ? `Doc: ${host.dentist_id_document_number}` : '')}</p>
              <p className="text-sm text-muted-foreground">{host?.email}</p>
              <p className="text-sm text-muted-foreground mt-2">{booking?.clinic ? `${booking.clinic.address_street}, ${booking.clinic.address_city}` : ''}</p>
            </div>
            <div className="space-y-1">
              <h3 className="text-xs font-bold uppercase text-muted-foreground tracking-wider mb-3">Para (Odontólogo)</h3>
              <p className="font-semibold text-lg">{dentist?.full_name || 'N/A'}</p>
              <p className="text-sm text-muted-foreground">{dentist?.dentist_id_document_number ? `Cédula: ${dentist.dentist_id_document_number}` : ''}</p>
              <p className="text-sm text-muted-foreground">{dentist?.email}</p>
              <p className="text-sm text-muted-foreground">{dentist?.phone}</p>
            </div>
          </div>

          <div className="rounded-lg border overflow-hidden mb-8">
            <Table>
                <TableHeader className="bg-muted/50">
                <TableRow>
                    <TableHead className="w-[50%]">Descripción</TableHead>
                    <TableHead className="text-center">Horas</TableHead>
                    <TableHead className="text-right">Precio/Hora</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {booking ? (
                    <TableRow>
                    <TableCell>
                        <p className="font-medium text-foreground">Alquiler de consultorio</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{booking.clinic?.name}</p>
                        <p className="text-xs text-muted-foreground">
                        {format(parseISO(booking.start_time), 'dd/MM/yyyy, HH:mm')} - {format(parseISO(booking.end_time), 'HH:mm')}
                        </p>
                    </TableCell>
                    <TableCell className="text-center font-medium">{duration > 0 ? duration.toFixed(1) : '-'}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{duration > 0 ? `RD$${pricePerHour.toFixed(2)}` : '-'}</TableCell>
                    <TableCell className="text-right font-bold">RD${invoice.total.toFixed(2)}</TableCell>
                    </TableRow>
                ) : (
                    <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">Detalles no disponibles.</TableCell>
                    </TableRow>
                )}
                </TableBody>
            </Table>
          </div>

          <div className="flex flex-col items-end">
            <div className="w-full max-w-xs space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">RD${invoice.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">ITBIS (18%)</span>
                <span className="font-medium">RD${invoice.taxes.toFixed(2)}</span>
              </div>
              <div className="border-t pt-3 mt-3">
                <div className="flex justify-between items-center">
                    <span className="font-bold text-lg">Total</span>
                    <span className="font-bold text-xl text-primary">RD${invoice.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-muted/30 py-6 px-8">
          <p className="text-xs text-muted-foreground text-center w-full">
            Esta es una representación digital de su documento fiscal. Gracias por usar Goldent Co Work.
          </p>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export default InvoicePage;