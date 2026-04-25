import React, { useState, useEffect } from 'react';
import { supabaseClient } from '@/config/supabaseConfig';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Send, Users } from 'lucide-react';

const MassEmailSender = () => {
    const { toast } = useToast();
    const [templates, setTemplates] = useState([]);
    const [targetGroup, setTargetGroup] = useState('all');
    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [customSubject, setCustomSubject] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [progress, setProgress] = useState(0);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);

    useEffect(() => {
        supabaseClient.from('email_templates').select('id, name, subject').then(({data}) => {
            if(data) setTemplates(data);
        });
    }, []);

    const handleSendClick = () => {
        if (!selectedTemplate) {
            toast({ variant: 'destructive', title: 'Error', description: 'Selecciona una plantilla.' });
            return;
        }
        setShowConfirmDialog(true);
    };

    const handleSend = async () => {
        setShowConfirmDialog(false);
        setIsSending(true);
        setProgress(0);

        try {
            // 1. Fetch Users
            let query = supabaseClient.from('profiles').select('email, full_name');
            if (targetGroup === 'dentists') query = query.eq('role', 'dentist');
            if (targetGroup === 'hosts') query = query.eq('role', 'clinic_host');
            
            const { data: users, error } = await query;
            if (error) throw error;
            if (!users || users.length === 0) throw new Error("No hay usuarios en este grupo.");

            // 2. Send Emails in Batches
            let sentCount = 0;
            const batchSize = 5; // Conservative batch size for edge function calls
            
            for (let i = 0; i < users.length; i += batchSize) {
                const batch = users.slice(i, i + batchSize);
                await Promise.all(batch.map(user => 
                    supabaseClient.functions.invoke('send-email', {
                        body: {
                            template_name: selectedTemplate,
                            to_email: user.email,
                            subject_override: customSubject || undefined,
                            data: {
                                name: user.full_name || 'Usuario',
                                subject: customSubject // for general_alert template
                            }
                        }
                    })
                ));
                sentCount += batch.length;
                setProgress(Math.round((sentCount / users.length) * 100));
            }

            toast({ title: "Envío completado", description: `Se enviaron correos a ${users.length} usuarios.` });
            setCustomSubject('');
            setSelectedTemplate('');

        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Error en el envío', description: error.message });
        } finally {
            setIsSending(false);
            setProgress(0);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8 p-4 border rounded-lg bg-card">
            <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center"><Users className="mr-2 w-5 h-5"/> Selección de Audiencia</h3>
                <RadioGroup defaultValue="all" onValueChange={setTargetGroup} className="grid grid-cols-3 gap-4">
                    <div>
                        <RadioGroupItem value="all" id="all" className="peer sr-only" />
                        <Label htmlFor="all" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                            Todos
                        </Label>
                    </div>
                    <div>
                        <RadioGroupItem value="dentists" id="dentists" className="peer sr-only" />
                        <Label htmlFor="dentists" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                            Odontólogos
                        </Label>
                    </div>
                    <div>
                        <RadioGroupItem value="hosts" id="hosts" className="peer sr-only" />
                        <Label htmlFor="hosts" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                            Anfitriones
                        </Label>
                    </div>
                </RadioGroup>
            </div>

            <div className="space-y-4">
                <div className="space-y-2">
                    <Label>Plantilla a utilizar</Label>
                    <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecciona plantilla..." />
                        </SelectTrigger>
                        <SelectContent>
                            {templates.map(t => <SelectItem key={t.id} value={t.name}>{t.name} - {t.subject}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label>Sobreescribir Asunto (Opcional)</Label>
                    <Input value={customSubject} onChange={e => setCustomSubject(e.target.value)} placeholder="Dejar en blanco para usar el asunto de la plantilla" />
                </div>
            </div>

            <div className="pt-4 border-t">
                {isSending ? (
                    <div className="space-y-2">
                        <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                            <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
                        </div>
                        <p className="text-center text-sm text-muted-foreground">Enviando... {progress}%</p>
                    </div>
                ) : (
                    <Button className="w-full" onClick={handleSendClick} disabled={!selectedTemplate}>
                        <Send className="mr-2 w-4 h-4" /> Enviar Correo Masivo
                    </Button>
                )}
            </div>

            <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar envío masivo</AlertDialogTitle>
                        <AlertDialogDescription>
                            ¿Estás seguro de enviar este correo masivo? Esta acción no se puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="flex gap-2 justify-end">
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleSend}>Confirmar</AlertDialogAction>
                    </div>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default MassEmailSender;