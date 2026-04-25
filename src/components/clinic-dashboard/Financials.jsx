import React, { useState, useEffect } from 'react';
import { supabaseClient } from '@/config/supabaseConfig';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Loader2, DollarSign, TrendingUp, Download, AlertCircle, CreditCard, ArrowUpRight, CheckCircle2, Info } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import BankAccountsManager from './BankAccountsManager';

const StatCard = ({ title, value, description, icon }) => (
  <Card className="glassmorphism border-border/20 hover:border-primary/50 transition-all duration-300">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <div className="text-3xl font-bold gradient-text">{value}</div>
      <p className="text-xs text-muted-foreground">{description}</p>
    </CardContent>
  </Card>
);

const getPayoutStatusBadge = (status) => {
    const variants = {
      paid: { variant: 'success', label: 'Pagado' },
      pending: { variant: 'outline', label: 'Pendiente' },
      processing: { variant: 'warning', label: 'Procesando' },
      refund_requested: { variant: 'destructive', label: 'Reembolso' },
    };
    const s = variants[status] || { variant: 'default', label: status };
    return <Badge variant={s.variant} className="capitalize">{s.label}</Badge>;
};

const Financials = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [financialData, setFinancialData] = useState({
    pending_balance: 0,
    total_revenue: 0,
    last_payout_amount: null,
    last_payout_date: null,
    transactions: [],
  });

  const [isConnectingStripe, setIsConnectingStripe] = useState(false);

  useEffect(() => {
    const fetchFinancials = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const { data, error } = await supabaseClient.rpc('get_host_financial_summary', { p_host_id: user.id });
        if (error) throw error;
        
        if (data && data.length > 0) {
          const summary = data[0];
          setFinancialData({
            pending_balance: summary.pending_balance || 0,
            total_revenue: summary.total_revenue || 0,
            last_payout_amount: summary.last_payout_amount,
            last_payout_date: summary.last_payout_date,
            transactions: summary.transactions || [],
          });
        }
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error al cargar finanzas',
          description: 'No se pudieron obtener tus datos financieros. ' + error.message,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchFinancials();
  }, [user, toast]);

  const handleConnectStripe = () => {
      setIsConnectingStripe(true);
      // Simulate API call
      setTimeout(() => {
          setIsConnectingStripe(false);
          toast({
              title: "Integración en Proceso",
              description: "Stripe Connect se activará pronto para tu cuenta. Por ahora, utiliza las transferencias bancarias manuales.",
          });
      }, 1500);
  };

  const formatCurrency = (amount) => `RD$${Number(amount || 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })}`;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold">Panel Financiero</h2>
        <p className="text-muted-foreground">Gestiona tus ingresos, historial de transacciones y métodos de cobro.</p>
      </div>

      <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 rounded-xl p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800 dark:text-blue-300">
          <p className="font-semibold mb-1">Información sobre comisiones</p>
          <p>La plataforma aplica una comisión del 25% por transacción, distribuida entre el odontólogo y el anfitrión. Esta comisión se retiene del monto total de cada reserva confirmada y se refleja en la columna "Comisión" del historial.</p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
            <TabsTrigger value="overview">Resumen General</TabsTrigger>
            <TabsTrigger value="payouts">Métodos de Cobro</TabsTrigger>
            <TabsTrigger value="transactions">Historial</TabsTrigger>
        </TabsList>

        {/* TAB: OVERVIEW */}
        <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-3">
                <StatCard
                title="Balance Pendiente"
                value={formatCurrency(financialData.pending_balance)}
                description="Ingresos netos por liquidar"
                icon={<DollarSign className="h-5 w-5 text-muted-foreground" />}
                />
                <StatCard
                title="Ingresos Totales"
                value={formatCurrency(financialData.total_revenue)}
                description="Ganancias totales generadas"
                icon={<TrendingUp className="h-5 w-5 text-muted-foreground" />}
                />
                <StatCard
                title="Último Pago Recibido"
                value={financialData.last_payout_amount ? formatCurrency(financialData.last_payout_amount) : 'N/A'}
                description={financialData.last_payout_date ? `Recibido el ${format(parseISO(financialData.last_payout_date), 'dd MMM, yyyy', { locale: es })}` : 'No se han realizado pagos'}
                icon={<Download className="h-5 w-5 text-muted-foreground" />}
                />
            </div>
        </TabsContent>

        {/* TAB: PAYOUT METHODS */}
        <TabsContent value="payouts" className="space-y-8">
            {/* Stripe Connect Section */}
            <Card className="border-blue-100 dark:border-blue-900 bg-gradient-to-r from-blue-50 to-white dark:from-blue-950/30 dark:to-background">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                        <CreditCard className="w-5 h-5" /> Stripe Connect
                    </CardTitle>
                    <CardDescription>
                        Recibe pagos internacionales de forma rápida y segura.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="text-sm text-muted-foreground">
                            <p>• Pagos automáticos a tu cuenta.</p>
                            <p>• Soporte para múltiples divisas.</p>
                            <p>• Seguridad de nivel bancario.</p>
                        </div>
                        <Button onClick={handleConnectStripe} disabled={isConnectingStripe} className="bg-[#635BFF] hover:bg-[#4B42FF] text-white">
                            {isConnectingStripe ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ArrowUpRight className="w-4 h-4 mr-2" />}
                            Conectar con Stripe
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Manual Bank Accounts Section */}
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-1 bg-primary rounded-full" />
                    <h3 className="text-xl font-semibold">Transferencia Bancaria Local</h3>
                </div>
                <Card>
                    <CardContent className="pt-6">
                        <BankAccountsManager />
                    </CardContent>
                </Card>
            </div>
        </TabsContent>

        {/* TAB: TRANSACTIONS */}
        <TabsContent value="transactions">
            <Card className="glassmorphism">
                <CardHeader>
                <CardTitle>Historial de Transacciones</CardTitle>
                <CardDescription>Un desglose detallado de todos tus ingresos por reservas y la comisión aplicada (25%).</CardDescription>
                </CardHeader>
                <CardContent>
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Clínica</TableHead>
                        <TableHead>Odontólogo</TableHead>
                        <TableHead className="text-right">Monto Bruto</TableHead>
                        <TableHead className="text-right">Comisión (25%)</TableHead>
                        <TableHead className="text-right">Ingreso Neto</TableHead>
                        <TableHead className="text-center">Estado</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {financialData.transactions.length > 0 ? (
                        financialData.transactions.map((tx) => (
                        <TableRow key={tx.id}>
                            <TableCell>{format(parseISO(tx.created_at), 'dd MMM, yyyy', { locale: es })}</TableCell>
                            <TableCell className="font-medium">{tx.clinic_name || 'N/A'}</TableCell>
                            <TableCell>{tx.dentist_name || 'N/A'}</TableCell>
                            <TableCell className="text-right">{formatCurrency(tx.amount)}</TableCell>
                            <TableCell className="text-right text-red-500">-{formatCurrency(tx.platform_fee)}</TableCell>
                            <TableCell className="text-right font-bold text-green-500">{formatCurrency(tx.host_payout)}</TableCell>
                            <TableCell className="text-center">{getPayoutStatusBadge(tx.payout_status)}</TableCell>
                        </TableRow>
                        ))
                    ) : (
                        <TableRow>
                        <TableCell colSpan="7" className="h-24 text-center">
                            <div className="flex flex-col items-center justify-center gap-2">
                                <AlertCircle className="w-8 h-8 text-muted-foreground" />
                                <p>Aún no tienes transacciones.</p>
                                <p className="text-sm text-muted-foreground">Cuando recibas tu primera reserva, aparecerá aquí.</p>
                            </div>
                        </TableCell>
                        </TableRow>
                    )}
                    </TableBody>
                </Table>
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};

export default Financials;