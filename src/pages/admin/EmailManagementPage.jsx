import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import EmailTemplateEditor from '@/components/admin/email/EmailTemplateEditor';
import EmailHistory from '@/components/admin/email/EmailHistory';
import MassEmailSender from '@/components/admin/email/MassEmailSender';
import SmtpConfig from '@/components/admin/email/SmtpConfig';
import EmailStats from '@/components/admin/email/EmailStats';
import { Mail, Settings, History, Send, BarChart2 } from 'lucide-react';
import { motion } from 'framer-motion';

const EmailManagementPage = () => {
    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
        >
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Gestión de Correos</h1>
                <p className="text-muted-foreground">
                    Administra plantillas, configuraciones SMTP y monitorea el envío de correos de la plataforma.
                </p>
            </div>

            <Tabs defaultValue="stats" className="w-full">
                <TabsList className="w-full justify-start overflow-x-auto">
                    <TabsTrigger value="stats"><BarChart2 className="w-4 h-4 mr-2"/>Estadísticas</TabsTrigger>
                    <TabsTrigger value="templates"><Mail className="w-4 h-4 mr-2"/>Plantillas</TabsTrigger>
                    <TabsTrigger value="history"><History className="w-4 h-4 mr-2"/>Historial</TabsTrigger>
                    <TabsTrigger value="mass-send"><Send className="w-4 h-4 mr-2"/>Envío Masivo</TabsTrigger>
                    <TabsTrigger value="config"><Settings className="w-4 h-4 mr-2"/>Configuración SMTP</TabsTrigger>
                </TabsList>

                <TabsContent value="stats" className="mt-6">
                    <EmailStats />
                </TabsContent>

                <TabsContent value="templates" className="mt-6">
                    <EmailTemplateEditor />
                </TabsContent>

                <TabsContent value="history" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Historial de Envíos</CardTitle>
                            <CardDescription>Registro completo de correos transaccionales enviados.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <EmailHistory />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="mass-send" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Envío Masivo</CardTitle>
                            <CardDescription>Enviar notificaciones o boletines a grupos de usuarios.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <MassEmailSender />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="config" className="mt-6">
                    <SmtpConfig />
                </TabsContent>
            </Tabs>
        </motion.div>
    );
};

export default EmailManagementPage;