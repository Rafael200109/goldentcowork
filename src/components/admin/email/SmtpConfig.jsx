import React, { useState, useEffect } from 'react';
import { supabaseClient } from '@/config/supabaseConfig';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Server, Save } from 'lucide-react';

const SmtpConfig = () => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [config, setConfig] = useState({
        enabled: false,
        host: 'smtp.hostinger.com',
        port: '465',
        user: '',
        pass: ''
    });

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        setLoading(true);
        const { data } = await supabaseClient.from('system_config').select('value').eq('key', 'smtp_settings').maybeSingle();
        if (data?.value) {
            setConfig(data.value);
        } else {
            // Default placeholder if nothing in DB, likely implies using Env Vars
             setConfig({
                enabled: false,
                host: 'smtp.hostinger.com',
                port: '465',
                user: '',
                pass: ''
            });
        }
        setLoading(false);
    };

    const handleSave = async () => {
        setSaving(true);
        // We store this in system_config. 
        // NOTE: In a real high-security app, storing passwords in a json column in system_config 
        // isn't ideal without encryption, but Supabase Secrets are hard to manage from client.
        // We assume system_config RLS is restricted to admins only.
        const { error } = await supabaseClient.from('system_config').upsert({
            key: 'smtp_settings',
            value: config,
            description: 'Custom SMTP Configuration'
        }, { onConflict: 'key' });

        if (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo guardar la configuración.' });
        } else {
            toast({ title: 'Configuración guardada', description: 'Los ajustes SMTP han sido actualizados.' });
        }
        setSaving(false);
    };

    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Server className="w-5 h-5"/> Configuración SMTP</CardTitle>
                <CardDescription>
                    Configura el servidor de correo saliente. Si se desactiva, el sistema intentará usar las variables de entorno predeterminadas.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
                    <div className="space-y-0.5">
                        <Label className="text-base">Habilitar SMTP Personalizado</Label>
                        <p className="text-sm text-muted-foreground">Usar estos ajustes en lugar de los del sistema base.</p>
                    </div>
                    <Switch checked={config.enabled} onCheckedChange={(c) => setConfig({...config, enabled: c})} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label>Host SMTP</Label>
                        <Input value={config.host} onChange={e => setConfig({...config, host: e.target.value})} placeholder="smtp.ejemplo.com" disabled={!config.enabled} />
                    </div>
                    <div className="space-y-2">
                        <Label>Puerto</Label>
                        <Input value={config.port} onChange={e => setConfig({...config, port: e.target.value})} placeholder="465" disabled={!config.enabled} />
                    </div>
                    <div className="space-y-2">
                        <Label>Usuario / Email</Label>
                        <Input value={config.user} onChange={e => setConfig({...config, user: e.target.value})} placeholder="no-reply@..." disabled={!config.enabled} />
                    </div>
                    <div className="space-y-2">
                        <Label>Contraseña</Label>
                        <Input type="password" value={config.pass} onChange={e => setConfig({...config, pass: e.target.value})} placeholder="••••••••" disabled={!config.enabled} />
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <Button onClick={handleSave} disabled={saving}>
                        {saving && <Loader2 className="mr-2 w-4 h-4 animate-spin" />}
                        <Save className="mr-2 w-4 h-4" /> Guardar Configuración
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};

export default SmtpConfig;