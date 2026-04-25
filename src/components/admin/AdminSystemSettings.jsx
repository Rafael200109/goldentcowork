import React, { useState } from 'react';
import { supabaseClient } from '@/config/supabaseConfig';
import { 
  Settings, Users, Shield, Globe, BarChart4, Save, 
  RotateCcw, Download, CreditCard,
  Map as MapIcon, Mail, AlertTriangle, FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import SystemUsersManager from './SystemUsersManager';
import { useSystemConfig } from '@/contexts/SystemConfigContext';
import { downloadCSV } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { logAdminAction } from '@/lib/adminLogger';

const AdminSystemSettings = () => {
  const { toast } = useToast();
  const { config, loading: configLoading, updateConfig, saveConfig } = useSystemConfig();
  const [activeTab, setActiveTab] = useState("general");
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);

  // If initial load
  if (configLoading) {
      return <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>;
  }

  const handleSaveWrapper = async (sectionKey) => {
    setSaving(true);
    const previousValue = config[sectionKey]; // Simplified, ideally we'd have the strict previous state
    const result = await saveConfig(sectionKey);
    setSaving(false);
    
    if (result.success) {
        // Log the successful action
        await logAdminAction(
            'update_system_config',
            'system_config',
            null,
            { section: sectionKey, updated_at: new Date().toISOString() }
        );

        toast({ title: "Configuración guardada", description: "Los cambios han sido aplicados correctamente." });
    } else {
        toast({ variant: "destructive", title: "Error", description: "No se pudo guardar la configuración." });
    }
  };

  const handleExport = async (type) => {
      setExporting(true);
      try {
          let data = [];
          let filename = '';

          if (type === 'users') {
              const { data: users, error } = await supabaseClient.from('profiles').select('id, full_name, email, role, phone, created_at');
              if (error) throw error;
              data = users;
              filename = `usuarios_goldent_${new Date().toISOString().split('T')[0]}.csv`;
          } else if (type === 'transactions') {
              const { data: transactions, error } = await supabaseClient.from('transactions').select('id, amount, currency, status, payment_gateway, created_at, platform_fee');
              if (error) throw error;
              data = transactions;
              filename = `transacciones_goldent_${new Date().toISOString().split('T')[0]}.csv`;
          } else if (type === 'audit') {
              const { data: logs, error } = await supabase
                .from('audit_logs')
                .select('id, created_at, action, target_resource, target_id, details, profiles(email)')
                .order('created_at', { ascending: false });
              
              if (error) throw error;

              // Flatten data for CSV
              data = logs.map(log => ({
                  id: log.id,
                  date: log.created_at,
                  admin: log.profiles?.email || 'Unknown',
                  action: log.action,
                  resource: log.target_resource,
                  details: JSON.stringify(log.details || {})
              }));
              filename = `auditoria_goldent_${new Date().toISOString().split('T')[0]}.csv`;
          }

          if (data.length > 0) {
              downloadCSV(data, filename);
              toast({ title: "Exportación exitosa", description: "El archivo se ha descargado correctamente." });
              
              await logAdminAction('export_data', 'system_reports', null, { type, filename });
          } else {
              toast({ title: "Sin datos", description: "No hay registros para exportar." });
          }

      } catch (error) {
          console.error(error);
          toast({ variant: "destructive", title: "Error", description: "Fallo al exportar los datos." });
      } finally {
          setExporting(false);
      }
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'users', label: 'Usuarios y Permisos', icon: Users },
    { id: 'policies', label: 'Políticas Legales', icon: Shield },
    { id: 'integrations', label: 'Integraciones', icon: Globe },
    { id: 'reports', label: 'Reportes y Datos', icon: BarChart4 },
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start">
      {/* Sidebar Navigation */}
      <Card className="w-full lg:w-64 flex-shrink-0 shadow-sm border-border/60">
        <CardContent className="p-3">
          <nav className="flex flex-col space-y-1">
            {tabs.map(tab => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? "secondary" : "ghost"}
                className={`justify-start h-10 px-4 font-medium ${activeTab === tab.id ? 'bg-primary/10 text-primary hover:bg-primary/15' : 'text-muted-foreground'}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <tab.icon className="w-4 h-4 mr-3" />
                {tab.label}
              </Button>
            ))}
          </nav>
        </CardContent>
      </Card>

      {/* Main Content Area */}
      <div className="flex-1 w-full min-w-0">
        {activeTab === 'general' && (
          <div className="space-y-6 animate-in fade-in duration-300">
             <Card>
                <CardHeader>
                   <CardTitle>Configuración General</CardTitle>
                   <CardDescription>Ajustes básicos de la plataforma.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                         <Label>Comisión de Plataforma (%)</Label>
                         <Input 
                            type="number" 
                            value={config.platform_settings?.fee_percentage || 25}
                            onChange={(e) => updateConfig('platform_settings', 'fee_percentage', parseFloat(e.target.value))}
                         />
                         <p className="text-[10px] text-muted-foreground">Porcentaje retenido de cada reserva.</p>
                      </div>
                      <div className="space-y-2">
                         <Label>Moneda Principal</Label>
                         <Input value={config.platform_settings?.currency || 'DOP'} disabled />
                      </div>
                      <div className="space-y-2">
                         <Label>Email de Soporte</Label>
                         <div className="relative">
                            <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input 
                               className="pl-9" 
                               value={config.platform_settings?.support_email || ''} 
                               onChange={(e) => updateConfig('platform_settings', 'support_email', e.target.value)}
                            />
                         </div>
                      </div>
                   </div>
                   
                   <Separator />

                   <div className="flex items-center justify-between p-4 border border-red-200 bg-red-50 rounded-lg">
                      <div className="space-y-0.5">
                         <Label className="text-red-700 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" /> Modo Mantenimiento
                         </Label>
                         <p className="text-xs text-red-600">Al activar, solo los administradores podrán acceder a la plataforma.</p>
                      </div>
                      <Switch 
                         checked={config.platform_settings?.maintenance_mode || false}
                         onCheckedChange={(checked) => updateConfig('platform_settings', 'maintenance_mode', checked)}
                      />
                   </div>
                </CardContent>
                <CardFooter className="justify-end border-t bg-muted/20 px-6 py-4">
                   <Button onClick={() => handleSaveWrapper('platform_settings')} disabled={saving}>
                      {saving && <RotateCcw className="mr-2 h-4 w-4 animate-spin" />}
                      Guardar Cambios
                   </Button>
                </CardFooter>
             </Card>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="animate-in fade-in duration-300">
             <Card className="border-none shadow-none bg-transparent">
               <div className="mb-4">
                 <h2 className="text-xl font-bold tracking-tight">Gestión de Usuarios</h2>
                 <p className="text-muted-foreground">Administra roles y permisos de acceso.</p>
               </div>
               <SystemUsersManager />
             </Card>
          </div>
        )}

        {activeTab === 'policies' && (
          <div className="space-y-6 animate-in fade-in duration-300">
             <Card>
                <CardHeader>
                   <CardTitle>Políticas y Términos</CardTitle>
                   <CardDescription>Define los textos legales visibles para los usuarios.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                   <div className="space-y-2">
                      <Label>Política de Cancelación</Label>
                      <Textarea 
                        rows={6}
                        value={config.policies?.cancellation || ''}
                        onChange={(e) => updateConfig('policies', 'cancellation', e.target.value)}
                        placeholder="Ej: Cancelación gratuita hasta 48h antes..."
                      />
                   </div>
                   <div className="space-y-2">
                      <Label>Política de Reembolso</Label>
                      <Textarea 
                        rows={6}
                        value={config.policies?.refund || ''}
                        onChange={(e) => updateConfig('policies', 'refund', e.target.value)}
                        placeholder="Ej: Los reembolsos se procesan en..."
                      />
                   </div>
                   <div className="space-y-2">
                      <Label>Política de Privacidad (Resumen)</Label>
                      <Textarea 
                        rows={4}
                        value={config.policies?.privacy || ''}
                        onChange={(e) => updateConfig('policies', 'privacy', e.target.value)}
                      />
                   </div>
                </CardContent>
                <CardFooter className="justify-end border-t bg-muted/20 px-6 py-4">
                   <Button onClick={() => handleSaveWrapper('policies')} disabled={saving}>
                      {saving ? 'Guardando...' : 'Actualizar Políticas'}
                   </Button>
                </CardFooter>
             </Card>
          </div>
        )}

        {activeTab === 'integrations' && (
           <div className="space-y-6 animate-in fade-in duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {/* Payments */}
                 <Card>
                    <CardHeader>
                       <CardTitle className="flex items-center gap-2">
                          <CreditCard className="w-5 h-5 text-primary" /> Pasarelas de Pago
                       </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                       <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                             <Label>PayPal</Label>
                             <p className="text-xs text-muted-foreground">Pagos internacionales</p>
                          </div>
                          <Switch 
                             checked={config.integrations?.paypal_enabled || false}
                             onCheckedChange={(checked) => updateConfig('integrations', 'paypal_enabled', checked)}
                          />
                       </div>
                       <Separator />
                       <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                             <Label>Cardnet (Local)</Label>
                             <p className="text-xs text-muted-foreground">Tarjetas de crédito RD</p>
                          </div>
                          <Switch 
                             checked={config.integrations?.cardnet_enabled || false}
                             onCheckedChange={(checked) => updateConfig('integrations', 'cardnet_enabled', checked)}
                          />
                       </div>
                    </CardContent>
                 </Card>

                 {/* Maps */}
                 <Card>
                    <CardHeader>
                       <CardTitle className="flex items-center gap-2">
                          <MapIcon className="w-5 h-5 text-primary" /> Mapas y Ubicación
                       </CardTitle>
                    </CardHeader>
                    <CardContent>
                       <div className="space-y-2">
                          <Label>Proveedor de Mapas</Label>
                          <Input value="OpenStreetMap (Gratuito)" disabled />
                          <p className="text-[10px] text-muted-foreground">Proveedor configurado por defecto en el sistema.</p>
                       </div>
                    </CardContent>
                 </Card>
              </div>
              
              <div className="flex justify-end">
                  <Button onClick={() => handleSaveWrapper('integrations')} disabled={saving}>Guardar Integraciones</Button>
              </div>
           </div>
        )}

        {activeTab === 'reports' && (
           <div className="space-y-6 animate-in fade-in duration-300">
              <Card>
                 <CardHeader>
                    <CardTitle>Exportación de Datos</CardTitle>
                    <CardDescription>Descarga reportes completos en formato CSV.</CardDescription>
                 </CardHeader>
                 <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                       <Button 
                        variant="outline" 
                        className="h-28 flex flex-col gap-3 hover:bg-primary/5 hover:border-primary/30"
                        onClick={() => handleExport('users')}
                        disabled={exporting}
                       >
                          <Users className="w-8 h-8 text-blue-500" />
                          <div className="flex flex-col items-center">
                            <span className="font-semibold">Usuarios</span>
                            <span className="text-[10px] text-muted-foreground font-normal">Todos los perfiles</span>
                          </div>
                       </Button>
                       <Button 
                        variant="outline" 
                        className="h-28 flex flex-col gap-3 hover:bg-primary/5 hover:border-primary/30"
                        onClick={() => handleExport('transactions')}
                        disabled={exporting}
                       >
                          <CreditCard className="w-8 h-8 text-green-500" />
                          <div className="flex flex-col items-center">
                             <span className="font-semibold">Transacciones</span>
                             <span className="text-[10px] text-muted-foreground font-normal">Historial financiero</span>
                          </div>
                       </Button>
                       <Button 
                        variant="outline" 
                        className="h-28 flex flex-col gap-3 hover:bg-primary/5 hover:border-primary/30"
                        onClick={() => handleExport('audit')}
                        disabled={exporting}
                       >
                          <FileText className="w-8 h-8 text-purple-500" />
                          <div className="flex flex-col items-center">
                             <span className="font-semibold">Auditoría</span>
                             <span className="text-[10px] text-muted-foreground font-normal">Logs del sistema</span>
                          </div>
                       </Button>
                    </div>
                 </CardContent>
              </Card>
           </div>
        )}
      </div>
    </div>
  );
};

export default AdminSystemSettings;