import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MailCheck } from 'lucide-react';

const AwaitingVerificationPage = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex items-center justify-center min-h-[calc(100vh-200px)] py-12"
    >
      <Card className="w-full max-w-lg text-center shadow-2xl glassmorphism">
        <CardHeader>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/20 mb-4">
            <MailCheck className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="mt-4 text-3xl font-bold gradient-text">¡Un último paso!</CardTitle>
          <CardDescription className="mt-2 text-lg text-muted-foreground">
            Por favor, verifica tu correo electrónico.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 px-8 pb-8">
          <p className="text-muted-foreground">
            Te hemos enviado un enlace de confirmación a tu dirección de correo. Haz clic en él para activar tu cuenta y poder iniciar sesión.
          </p>
          
          <p className="text-sm text-muted-foreground">
            ¿No encuentras el correo? Revisa tu carpeta de spam o correo no deseado. Si el problema persiste, puedes intentar iniciar sesión y solicitar un nuevo enlace de verificación.
          </p>
          <Button asChild className="w-full text-lg py-3">
            <Link to="/login">Ir a Iniciar Sesión</Link>
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AwaitingVerificationPage;