import React, { useEffect, useState } from 'react';
import { supabaseClient } from '@/config/supabaseConfig';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, AlertTriangle, Calendar, Star, DollarSign, User, Building, RefreshCcw, Mail, MessageCircle, Phone, History, CheckCircle2, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import BookingConfirmationActions from '@/components/admin/BookingConfirmationActions';
import FeatureRequestActions from '@/components/admin/FeatureRequestActions';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const BookingConfirmationPage = () => {
  const [loading, setLoading] = useState(true);
  const [pendingBookings, setPendingBookings] = useState([]);
  const [historyBookings, setHistoryBookings] = useState([]);
  const [pendingFeatures, setPendingFeatures] = useState([]);
  const [historyFeatures, setHistoryFeatures] = useState([]);
  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    try {
      console.log("Fetching data...");
      
      // --- 1. BOOKINGS ---
      // Fetch Pending Bookings
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          *,
          transactions!inner (
            id,
            amount,
            payment_gateway,
            status,
            transaction_id
          )
        `)
        .eq('status', 'pending')
        .eq('transactions.payment_gateway', 'Cardnet')
        .order('created_at', { ascending: false });

      if (bookingsError) throw bookingsError;

      // Fetch History Bookings (Confirmed or Cancelled Cardnet transactions)
      const { data: historyBookingsData, error: historyBookingsError } = await supabase
        .from('bookings')
        .select(`
          *,
          transactions!inner (
            id,
            amount,
            payment_gateway,
            status,
            transaction_id
          )
        `)
        .in('status', ['confirmed', 'cancelled', 'completed']) // Include relevant history statuses
        .eq('transactions.payment_gateway', 'Cardnet')
        .order('created_at', { ascending: false })
        .limit(50); // Limit to last 50 for performance

      if (historyBookingsError) throw historyBookingsError;

      // Enrich bookings (both pending and history)
      const enrichBookings = async (rawBookings) => {
          if (!rawBookings || rawBookings.length === 0) return [];
          
          const clinicIds = [...new Set(rawBookings.map(b => b.clinic_id))];
          const dentistIds = [...new Set(rawBookings.map(b => b.dentist_id))];

          const [clinicsResponse, dentistsResponse] = await Promise.all([
            clinicIds.length > 0 ? supabaseClient.from('clinics').select('id, name').in('id', clinicIds) : { data: [] },
            dentistIds.length > 0 ? supabaseClient.from('profiles').select('id, full_name, email').in('id', dentistIds) : { data: [] }
          ]);

          const clinicsMap = (clinicsResponse.data || []).reduce((acc, c) => ({ ...acc, [c.id]: c }), {});
          const dentistsMap = (dentistsResponse.data || []).reduce((acc, d) => ({ ...acc, [d.id]: d }), {});

          return rawBookings.map(booking => ({
            ...booking,
            clinics: clinicsMap[booking.clinic_id] || { name: 'Desconocida' },
            profiles: dentistsMap[booking.dentist_id] || { full_name: 'Desconocido', email: '' }
          }));
      };

      const enrichedPendingBookings = await enrichBookings(bookingsData);
      const enrichedHistoryBookings = await enrichBookings(historyBookingsData);


      // --- 2. FEATURE REQUESTS ---
      // Fetch Pending Feature Requests
      const { data: featuresData, error: featuresError } = await supabase
        .from('featured_purchases')
        .select('*')
        .in('status', ['pending', 'pending_manual_payment']) 
        .order('created_at', { ascending: false });

      if (featuresError) throw featuresError;

      // Fetch History Feature Requests
      const { data: historyFeaturesData, error: historyFeaturesError } = await supabase
        .from('featured_purchases')
        .select('*')
        .in('status', ['completed', 'rejected']) 
        .order('updated_at', { ascending: false }) // Use updated_at for history
        .limit(50);

      if (historyFeaturesError) throw historyFeaturesError;


      // Enrich Features (both pending and history)
      const enrichFeatures = async (rawFeatures) => {
        if (!rawFeatures || rawFeatures.length === 0) return [];

        const featureClinicIds = [...new Set(rawFeatures.map(f => f.clinic_id))];
        const hostIds = [...new Set(rawFeatures.map(f => f.host_id))];

        const [fClinicsResponse, fHostsResponse] = await Promise.all([
          featureClinicIds.length > 0 ? supabaseClient.from('clinics').select('id, name').in('id', featureClinicIds) : { data: [] },
          hostIds.length > 0 ? supabaseClient.from('profiles').select('id, full_name, email, phone').in('id', hostIds) : { data: [] }
        ]);

        const fClinicsMap = (fClinicsResponse.data || []).reduce((acc, c) => ({ ...acc, [c.id]: c }), {});
        const fHostsMap = (fHostsResponse.data || []).reduce((acc, h) => ({ ...acc, [h.id]: h }), {});

        return rawFeatures.map(req => ({
          ...req,
          clinics: fClinicsMap[req.clinic_id] || { name: 'Desconocida' },
          profiles: fHostsMap[req.host_id] || { full_name: 'Desconocido', email: '', phone: '' }
        }));
      };

      const enrichedPendingFeatures = await enrichFeatures(featuresData);
      const enrichedHistoryFeatures = await enrichFeatures(historyFeaturesData);

      setPendingBookings(enrichedPendingBookings);
      setHistoryBookings(enrichedHistoryBookings);
      setPendingFeatures(enrichedPendingFeatures);
      setHistoryFeatures(enrichedHistoryFeatures);

    } catch (error) {
      console.error('Error in fetchData:', error);
      toast({
        variant: "destructive",
        title: "Error al cargar datos",
        description: "Hubo un problema al consultar la base de datos.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'dd MMM yyyy, HH:mm', { locale: es });
    } catch (e) {
      return 'Fecha inválida';
    }
  };

  const getWhatsappLink = (phone) => {
    if (!phone) return null;
    const cleanPhone = phone.replace(/\D/g, '');
    return `https://wa.me/${cleanPhone}`;
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'confirmed':
      case 'completed':
      case 'succeeded':
        return <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100"><CheckCircle2 className="w-3 h-3 mr-1"/> Confirmado</Badge>;
      case 'cancelled':
      case 'rejected':
      case 'failed':
        return <Badge className="bg-red-100 text-red-800 border-red-200 hover:bg-red-100"><XCircle className="w-3 h-3 mr-1"/> {status === 'cancelled' ? 'Cancelado' : 'Rechazado'}</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Pendiente</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Centro de Confirmaciones</h1>
          <p className="text-muted-foreground">Gestiona pagos manuales, reservas pendientes y solicitudes de destaque.</p>
        </div>
        <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
              <RefreshCcw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
            <div className="flex gap-2">
              <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium flex items-center shadow-sm">
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  {pendingBookings.length} Reservas
              </div>
              <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium flex items-center shadow-sm">
                  <Star className="w-4 h-4 mr-2" />
                  {pendingFeatures.length} Destaques
              </div>
            </div>
        </div>
      </div>

      <Tabs defaultValue="bookings" className="w-full">
        <TabsList className="grid w-full max-w-[400px] grid-cols-2">
          <TabsTrigger value="bookings">Pagos Manuales</TabsTrigger>
          <TabsTrigger value="features">Destaques</TabsTrigger>
        </TabsList>

        {/* TAB: BOOKINGS (MANUAL PAYMENTS) */}
        <TabsContent value="bookings" className="mt-6">
          <Tabs defaultValue="pending" className="w-full">
             <div className="flex items-center justify-between mb-4">
               <TabsList>
                 <TabsTrigger value="pending">Pendientes ({pendingBookings.length})</TabsTrigger>
                 <TabsTrigger value="history">Historial</TabsTrigger>
               </TabsList>
             </div>

             {/* SUB-TAB: PENDING BOOKINGS */}
             <TabsContent value="pending">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-5 h-5" /> Reservas Pendientes de Pago
                    </CardTitle>
                    <CardDescription>
                      Reservas que han seleccionado pago manual/transferencia (Cardnet) y requieren validación.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="flex justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      </div>
                    ) : pendingBookings.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-lg">
                        <CheckCircleIcon className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p>No hay reservas pendientes de confirmación.</p>
                      </div>
                    ) : (
                      <div className="rounded-md border overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Fecha Reserva</TableHead>
                              <TableHead>Clínica</TableHead>
                              <TableHead>Odontólogo</TableHead>
                              <TableHead>Monto</TableHead>
                              <TableHead>Estado Pago</TableHead>
                              <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {pendingBookings.map((booking) => (
                              <TableRow key={booking.id}>
                                <TableCell className="font-medium">
                                  <div className="flex flex-col">
                                    <span>{formatDate(booking.start_time)}</span>
                                    <span className="text-xs text-muted-foreground">Creada: {formatDate(booking.created_at)}</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                      <Building className="w-4 h-4 text-muted-foreground" />
                                      {booking.clinics?.name || 'Desconocida'}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                      <User className="w-4 h-4 text-muted-foreground" />
                                      <div className="flex flex-col text-sm">
                                          <span>{booking.profiles?.full_name || 'Sin nombre'}</span>
                                          <span className="text-xs text-muted-foreground">{booking.profiles?.email}</span>
                                      </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="font-bold border-yellow-200 bg-yellow-50">
                                      RD$ {Number(booking.total_price).toLocaleString()}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {getStatusBadge('pending')}
                                </TableCell>
                                <TableCell className="text-right">
                                  <BookingConfirmationActions booking={booking} onActionComplete={fetchData} />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
             </TabsContent>

             {/* SUB-TAB: BOOKINGS HISTORY */}
             <TabsContent value="history">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-slate-600">
                      <History className="w-5 h-5" /> Historial de Pagos Manuales
                    </CardTitle>
                    <CardDescription>
                      Últimas 50 transacciones procesadas (confirmadas o rechazadas).
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                       <div className="flex justify-center py-12">
                         <Loader2 className="w-8 h-8 animate-spin text-primary" />
                       </div>
                    ) : historyBookings.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-lg">
                        <History className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p>No hay historial reciente de pagos manuales.</p>
                      </div>
                    ) : (
                      <div className="rounded-md border overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Fecha Creación</TableHead>
                              <TableHead>Clínica</TableHead>
                              <TableHead>Odontólogo</TableHead>
                              <TableHead>Monto</TableHead>
                              <TableHead>Estado</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {historyBookings.map((booking) => (
                              <TableRow key={booking.id} className="opacity-80 hover:opacity-100 transition-opacity">
                                <TableCell className="font-medium text-sm">
                                    {formatDate(booking.created_at)}
                                </TableCell>
                                <TableCell>
                                    <span className="text-sm">{booking.clinics?.name || 'Desconocida'}</span>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col text-sm">
                                        <span>{booking.profiles?.full_name || 'Sin nombre'}</span>
                                        <span className="text-xs text-muted-foreground">{booking.profiles?.email}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                   <span className="font-mono text-sm">RD$ {Number(booking.total_price).toLocaleString()}</span>
                                </TableCell>
                                <TableCell>
                                  {getStatusBadge(booking.status)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
             </TabsContent>
          </Tabs>
        </TabsContent>

        {/* TAB: FEATURES (DESTAQUES) */}
        <TabsContent value="features" className="mt-6">
          <Tabs defaultValue="pending" className="w-full">
            <div className="flex items-center justify-between mb-4">
                <TabsList>
                  <TabsTrigger value="pending">Pendientes ({pendingFeatures.length})</TabsTrigger>
                  <TabsTrigger value="history">Historial</TabsTrigger>
                </TabsList>
            </div>

             {/* SUB-TAB: PENDING FEATURES */}
             <TabsContent value="pending">
                <Card className="border-blue-100 bg-blue-50/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-blue-700">
                      <Star className="w-5 h-5 fill-blue-700 text-blue-700" /> Solicitudes de Clínica Destacada
                    </CardTitle>
                    <CardDescription>
                      Anfitriones que han solicitado pagar para destacar sus clínicas en la página principal.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="flex justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                      </div>
                    ) : pendingFeatures.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground bg-white/50 rounded-lg border border-dashed border-blue-200">
                        <Star className="w-12 h-12 mx-auto mb-3 text-blue-200" />
                        <p>No hay solicitudes de destaque pendientes.</p>
                      </div>
                    ) : (
                      <div className="rounded-md border bg-white overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Fecha Solicitud</TableHead>
                              <TableHead>Clínica</TableHead>
                              <TableHead>Anfitrión</TableHead>
                              <TableHead>Contacto Directo</TableHead>
                              <TableHead>Plan</TableHead>
                              <TableHead>Monto (USD)</TableHead>
                              <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {pendingFeatures.map((req) => (
                              <TableRow key={req.id}>
                                <TableCell className="text-sm">
                                  {formatDate(req.created_at)}
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                      <div className="p-2 bg-blue-50 rounded-md">
                                          <Building className="w-4 h-4 text-blue-600" />
                                      </div>
                                      <div className="flex flex-col">
                                          <span className="font-medium text-slate-900">{req.clinics?.name || 'Clínica desconocida'}</span>
                                      </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                                          <User className="w-4 h-4" />
                                      </div>
                                      <div className="flex flex-col">
                                          <span className="font-medium text-sm text-slate-900">{req.profiles?.full_name || 'Desconocido'}</span>
                                          <span className="text-xs text-muted-foreground">{req.profiles?.email}</span>
                                      </div>
                                  </div>
                                </TableCell>
                                <TableCell> 
                                  <div className="flex flex-col gap-1.5 items-start">
                                      {req.profiles?.phone ? (
                                          <a 
                                              href={getWhatsappLink(req.profiles.phone)} 
                                              target="_blank" 
                                              rel="noopener noreferrer"
                                              className="flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 hover:bg-green-100 hover:border-green-300 px-2.5 py-1.5 rounded-md transition-all shadow-sm"
                                              title="Abrir chat de WhatsApp"
                                          >
                                              <MessageCircle className="w-3.5 h-3.5" />
                                              WhatsApp
                                          </a>
                                      ) : (
                                          <span className="text-xs text-muted-foreground italic flex items-center gap-1">
                                              <Phone className="w-3 h-3" /> Sin teléfono
                                          </span>
                                      )}
                                      
                                      <a 
                                          href={`mailto:${req.profiles?.email}`}
                                          className="flex items-center gap-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 hover:border-blue-300 px-2.5 py-1.5 rounded-md transition-all shadow-sm"
                                          title="Enviar correo electrónico"
                                      >
                                          <Mail className="w-3.5 h-3.5" />
                                          Enviar Correo
                                      </a>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex flex-col">
                                      <span className="font-bold text-primary">{req.plan_name}</span>
                                      <span className="text-xs text-muted-foreground">{req.plan_duration_days} días</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center font-bold text-green-600">
                                      <DollarSign className="w-3 h-3 mr-1" />
                                      {req.amount_paid}
                                  </div>
                                </TableCell>
                                <TableCell className="text-right">
                                  <FeatureRequestActions request={req} onProcessed={fetchData} />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
             </TabsContent>

             {/* SUB-TAB: FEATURES HISTORY */}
             <TabsContent value="history">
               <Card className="border-slate-200 bg-slate-50/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-slate-700">
                      <History className="w-5 h-5" /> Historial de Destaques
                    </CardTitle>
                    <CardDescription>
                      Últimas 50 solicitudes procesadas.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="flex justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-slate-500" />
                      </div>
                    ) : historyFeatures.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground bg-white/50 rounded-lg border border-dashed border-slate-200">
                        <History className="w-12 h-12 mx-auto mb-3 text-slate-200" />
                        <p>No hay historial de solicitudes procesadas.</p>
                      </div>
                    ) : (
                      <div className="rounded-md border bg-white overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Fecha Proceso</TableHead>
                              <TableHead>Clínica</TableHead>
                              <TableHead>Anfitrión</TableHead>
                              <TableHead>Plan</TableHead>
                              <TableHead>Monto</TableHead>
                              <TableHead>Estado</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {historyFeatures.map((req) => (
                              <TableRow key={req.id} className="opacity-90 hover:opacity-100">
                                <TableCell className="text-sm">
                                  {formatDate(req.updated_at || req.created_at)}
                                </TableCell>
                                <TableCell>
                                    <span className="font-medium text-sm text-slate-900">{req.clinics?.name || 'Clínica desconocida'}</span>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="text-sm text-slate-700">{req.profiles?.full_name || 'Desconocido'}</span>
                                        <span className="text-xs text-muted-foreground">{req.profiles?.email}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <span className="text-sm">{req.plan_name}</span>
                                </TableCell>
                                <TableCell>
                                   <span className="font-medium text-green-700">${req.amount_paid}</span>
                                </TableCell>
                                <TableCell>
                                  {getStatusBadge(req.status)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
               </Card>
             </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Helper Icon
function CheckCircleIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  )
}

export default BookingConfirmationPage;