import React, { useState } from 'react';
    import { motion } from 'framer-motion';
    import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
    import { Link, useNavigate } from 'react-router-dom';
    import { UserPlus as UserPlusIcon } from 'lucide-react';
    import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
    import DentistRegistrationForm from '@/components/auth/DentistRegistrationForm.jsx';
    import ClinicHostRegistrationFlow from '@/pages/ClinicHostRegistrationFlow.jsx'; 
    import { useToast } from "@/components/ui/use-toast.js";
    import { Checkbox } from '@/components/ui/checkbox';
    import { Label } from '@/components/ui/label';

    export const Register = () => {
      const [activeTab, setActiveTab] = useState('dentist');
      const [acceptedTerms, setAcceptedTerms] = useState(false);
      const navigate = useNavigate();
      const { toast } = useToast();

      const handleTabChange = (value) => {
        setActiveTab(value);
      };
      
      const handleRegistrationComplete = () => {
        toast({
          title: "¡Registro Recibido!",
          description: "Hemos enviado un enlace de verificación a tu correo electrónico. Por favor, revisa tu bandeja de entrada para activar tu cuenta.",
          duration: 8000,
        });
        navigate('/awaiting-verification');
      };

      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-center py-6 md:py-12 container max-w-screen-2xl px-4 sm:px-6"
        >
          <Card className="w-full max-w-2xl shadow-2xl glassmorphism">
            <CardHeader className="text-center">
              <div className="inline-block p-3 mx-auto rounded-full bg-primary/20 text-primary mb-4">
                <UserPlusIcon className="w-10 h-10" />
              </div>
              <CardTitle className="text-3xl font-bold gradient-text">Crear Cuenta</CardTitle>
              <CardDescription>Únete a Goldent Co Work y encuentra tu espacio ideal o registra tu clínica.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <Tabs defaultValue="dentist" value={activeTab} onValueChange={handleTabChange} className="w-full flex flex-col items-center">
                <TabsList className="flex flex-col space-y-2 sm:space-y-0 sm:grid sm:grid-cols-2 w-full max-w-sm mb-4 h-auto sm:h-13">
                  <TabsTrigger value="dentist" className="py-3 text-base w-full sm:w-auto">Soy Odontólogo</TabsTrigger>
                  <TabsTrigger value="clinic_host_flow" className="py-3 text-base w-full sm:w-auto">Soy Anfitrión (Clínica)</TabsTrigger>
                </TabsList>
                <TabsContent value="dentist" className="px-1 w-full">
                  <DentistRegistrationForm 
                    onRegistrationComplete={handleRegistrationComplete}
                    acceptedTerms={acceptedTerms}
                  />
                </TabsContent>
                <TabsContent value="clinic_host_flow" className="px-1 w-full">
                  <ClinicHostRegistrationFlow isEmbedded onComplete={handleRegistrationComplete} acceptedTerms={acceptedTerms} />
                </TabsContent>
              </Tabs>
              
              <div className="items-top flex space-x-2 mt-6">
                <Checkbox id="terms1" checked={acceptedTerms} onCheckedChange={setAcceptedTerms} />
                <div className="grid gap-1.5 leading-none">
                  <Label htmlFor="terms1" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Acepto los <Link to="/policies" target="_blank" className="underline text-primary">Términos y Condiciones</Link> y la <Link to="/policies" target="_blank" className="underline text-primary">Política de Privacidad</Link>.
                  </Label>
                </div>
              </div>

            </CardContent>
            <CardFooter className="text-center block mt-6">
              <p className="text-sm text-muted-foreground">
                ¿Ya tienes una cuenta? <Link to="/login" className="font-semibold text-primary hover:underline">Inicia sesión aquí</Link>
              </p>
            </CardFooter>
          </Card>
        </motion.div>
      );
    };