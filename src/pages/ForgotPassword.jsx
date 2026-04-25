import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { useToast } from "@/components/ui/use-toast";
import { Mail, Loader2, ArrowLeft, AlertCircle } from 'lucide-react';
import { supabaseClient } from '@/config/supabaseConfig';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorDetails, setErrorDetails] = useState(null);
  const { toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorDetails(null);

    const emailToReset = email.trim();

    if (!emailToReset) {
      toast({
        title: "Campo requerido",
        description: "Por favor ingresa un correo electrónico válido.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    try {
      // Construct the redirect URL safely
      // We use window.location.origin to ensure we redirect back to the current domain
      const redirectTo = `${window.location.origin}/update-password`;

      const { error } = await supabaseClient.auth.resetPasswordForEmail(emailToReset, {
        redirectTo: redirectTo,
      });

      if (error) throw error;

      toast({
        title: "Correo Enviado",
        description: "Si existe una cuenta con ese correo, recibirás un enlace para restablecer tu contraseña.",
      });
      setSent(true);

    } catch (error) {
      console.error('Password reset error:', error);
      let title = "Error";
      let description = "No se pudo enviar el correo de recuperación.";
      
      // Handle 504 Gateway Timeout specifically
      if (error.status === 504 || error.code === '504' || error.message?.includes('504') || error.message?.includes('timeout')) {
        title = "Tiempo de espera agotado";
        description = "El servidor tardó demasiado en responder. Es posible que el servicio de correos esté saturado. Por favor, revisa tu bandeja de entrada en unos minutos por si el correo llegó, o intenta nuevamente más tarde.";
      } else if (error.message?.includes('rate limit')) {
        title = "Demasiados intentos";
        description = "Has solicitado demasiados correos en poco tiempo. Por favor espera un momento.";
      } else {
        description = error.message || description;
      }

      setErrorDetails({ title, description });
      
      toast({
        title,
        description,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex items-center justify-center py-12"
    >
      <Card className="w-full max-w-md shadow-2xl glassmorphism">
        <CardHeader className="text-center">
          <div className="inline-block p-3 mx-auto rounded-full bg-primary/20 text-primary mb-4">
            <Mail className="w-10 h-10" />
          </div>
          <CardTitle className="text-3xl font-bold gradient-text">Recuperar Contraseña</CardTitle>
          <CardDescription>
            {sent 
              ? "¡Revisa tu bandeja de entrada!"
              : "Ingresa tu correo y te enviaremos un enlace para restablecerla."
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="text-center text-muted-foreground space-y-4">
              <p>Hemos enviado las instrucciones a <strong>{email}</strong>.</p>
              <p className="text-sm">No olvides revisar tu carpeta de spam.</p>
              <Button 
                variant="outline" 
                onClick={() => setSent(false)}
                className="mt-4"
              >
                Intentar con otro correo
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {errorDetails && (
                 <Alert variant="destructive" className="text-left">
                   <AlertCircle className="h-4 w-4" />
                   <AlertTitle>{errorDetails.title}</AlertTitle>
                   <AlertDescription>{errorDetails.description}</AlertDescription>
                 </Alert>
              )}
            
              <div className="space-y-2 text-left">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="tu@correo.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                  className="bg-background/70"
                  disabled={loading}
                />
              </div>
              <Button 
                type="submit" 
                className="w-full text-lg py-6 shadow-lg hover:shadow-primary/50 transition-shadow duration-300" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  'Enviar Enlace de Recuperación'
                )}
              </Button>
            </form>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button variant="ghost" asChild>
            <Link to="/login">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a Iniciar Sesión
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export default ForgotPasswordPage;