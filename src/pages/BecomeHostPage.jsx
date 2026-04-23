import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Home, FileText, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import BecomeHostForm from '@/components/auth/BecomeHostForm';

const BecomeHostPage = () => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-4xl mx-auto"
    >
      <Button variant="outline" onClick={() => navigate(-1)} className="mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Volver al Perfil
      </Button>
      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-6">
            <Card className="glassmorphism">
                <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                        <Home className="w-8 h-8 text-primary" />
                        <span className="text-2xl">Conviértete en Anfitrión</span>
                    </CardTitle>
                    <CardDescription>
                        Únete a nuestra comunidad de anfitriones y comparte tu espacio con otros profesionales de la odontología.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-start gap-3">
                        <FileText className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                        <p className="text-muted-foreground">
                            Completa el formulario de solicitud. Nuestro equipo revisará tu petición para asegurar que todo esté en orden.
                        </p>
                    </div>
                     <div className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                        <p className="text-muted-foreground">
                            Una vez aprobado, podrás publicar tus clínicas, gestionar reservas y recibir pagos de forma segura a través de nuestra plataforma.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
        <div>
           <BecomeHostForm />
        </div>
      </div>
    </motion.div>
  );
};

export default BecomeHostPage;