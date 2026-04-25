import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabaseClient } from '@/config/supabaseConfig';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Send, Check, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const BecomeHostForm = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [requestStatus, setRequestStatus] = useState(null); // null, 'pending', 'approved', 'rejected'

    useEffect(() => {
        const checkExistingRequest = async () => {
            if (!user) return;
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('host_requests')
                    .select('status, reason')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })
                    .limit(1);

                if (error) throw error;
                
                if (data && data.length > 0) {
                    setRequestStatus(data[0].status);
                    if(data[0].status === 'pending') {
                       setReason(data[0].reason);
                    }
                }
            } catch (error) {
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: 'No se pudo verificar el estado de tu solicitud.',
                });
            } finally {
                setLoading(false);
            }
        };
        checkExistingRequest();
    }, [user, toast]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user) return;

        setLoading(true);
        try {
            const { error } = await supabase
                .from('host_requests')
                .insert([{ user_id: user.id, reason: reason }]);

            if (error) throw error;

            toast({
                title: '¡Solicitud enviada!',
                description: 'Tu solicitud para ser anfitrión ha sido enviada. Te notificaremos cuando sea revisada.',
            });
            setRequestStatus('pending');
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error al enviar la solicitud',
                description: 'Por favor, inténtalo de nuevo. ' + error.message,
            });
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Card className="glassmorphism flex items-center justify-center p-10">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </Card>
        );
    }

    if (requestStatus === 'approved') {
        return (
            <Card className="glassmorphism bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
                        <Check className="w-6 h-6" /> ¡Ya eres Anfitrión!
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-green-600 dark:text-green-400 mb-4">
                        Tu solicitud ha sido aprobada. Ya puedes empezar a publicar tus clínicas.
                    </p>
                    <Button onClick={() => navigate('/clinic-dashboard')}>Ir a mi Panel de Anfitrión</Button>
                </CardContent>
            </Card>
        );
    }
    
    if (requestStatus === 'rejected') {
        return (
             <Card className="glassmorphism bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-300">
                        <AlertCircle className="w-6 h-6" /> Solicitud Rechazada
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-red-600 dark:text-red-400 mb-4">
                        Lamentablemente, tu solicitud fue rechazada. Contacta a soporte para más detalles.
                    </p>
                    <Button onClick={() => navigate('/support')}>Contactar a Soporte</Button>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="glassmorphism">
            <CardHeader>
                <CardTitle>Solicitud para ser Anfitrión</CardTitle>
                <CardDescription>
                    {requestStatus === 'pending' 
                    ? 'Tu solicitud está siendo revisada. Te notificaremos pronto.' 
                    : 'Cuéntanos por qué te gustaría ser anfitrión en nuestra plataforma.'}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="reason">Motivo de la solicitud (Opcional)</Label>
                        <Textarea
                            id="reason"
                            placeholder="Ej: Tengo un consultorio que me gustaría rentar por horas..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            rows={5}
                            disabled={loading || requestStatus === 'pending'}
                        />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading || requestStatus === 'pending'}>
                        {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                        {requestStatus === 'pending' ? 'Solicitud Pendiente' : 'Enviar Solicitud'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
};

export default BecomeHostForm;