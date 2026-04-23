import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, MessageSquare, FileQuestion, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';

const SupportPage = () => {
  return (
    <div className="container mx-auto py-8 sm:py-12 px-4 max-w-6xl">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-12"
      >
        <h1 className="text-3xl sm:text-4xl font-bold mb-4 gradient-text">Centro de Soporte</h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Estamos aquí para ayudarte. Elige el canal de comunicación que mejor se adapte a tus necesidades.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Chat Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="h-full hover:shadow-lg transition-shadow border-muted/60 flex flex-col">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <MessageSquare className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Chat en Vivo</CardTitle>
              <CardDescription>Respuesta inmediata</CardDescription>
            </CardHeader>
            <CardContent className="text-center text-sm text-muted-foreground flex-grow">
              <p>Habla directamente con nuestro equipo de soporte para resolver dudas rápidas en tiempo real.</p>
            </CardContent>
            <CardFooter className="justify-center pt-4">
              <Button onClick={() => {
                // Trigger chat widget opening if possible, or just scroll to it
                const chatWidgetTrigger = document.querySelector('[aria-label="Chat de soporte"]');
                if (chatWidgetTrigger) chatWidgetTrigger.click();
              }}>
                Iniciar Chat
              </Button>
            </CardFooter>
          </Card>
        </motion.div>

        {/* Email Card - The requested fix */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="h-full hover:shadow-lg transition-shadow border-muted/60 flex flex-col">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                <Mail className="w-6 h-6 text-orange-600" />
              </div>
              <CardTitle>Correo Electrónico</CardTitle>
              <CardDescription>Consultas detalladas</CardDescription>
            </CardHeader>
            <CardContent className="text-center text-sm text-muted-foreground flex-grow">
              <p>Para temas legales, facturación compleja o reportes detallados que requieran revisión.</p>
            </CardContent>
            <CardFooter className="justify-center pt-4">
              {/* Fix: Using asChild with an anchor tag for robust mailto handling */}
              <Button 
                variant="outline" 
                className="border-orange-200 text-orange-700 hover:bg-orange-50 hover:text-orange-800 hover:border-orange-300 w-full sm:w-auto" 
                asChild
              >
                <a href="mailto:soporte@goldentcowork.com">
                  Enviar Correo
                </a>
              </Button>
            </CardFooter>
          </Card>
        </motion.div>

        {/* FAQs Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="h-full hover:shadow-lg transition-shadow border-muted/60 flex flex-col">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <FileQuestion className="w-6 h-6 text-blue-600" />
              </div>
              <CardTitle>Preguntas Frecuentes</CardTitle>
              <CardDescription>Autoayuda 24/7</CardDescription>
            </CardHeader>
            <CardContent className="text-center text-sm text-muted-foreground flex-grow">
              <p>Encuentra respuestas rápidas a las preguntas más comunes de la comunidad Goldent.</p>
            </CardContent>
            <CardFooter className="justify-center pt-4">
              <Button variant="secondary" asChild>
                  <a href="/policies" className="flex items-center">
                    Ver FAQs <ExternalLink className="ml-2 w-4 h-4" />
                  </a>
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      </div>

      <div className="mt-16 text-center">
         <h2 className="text-2xl font-bold mb-4">¿Necesitas ayuda urgente?</h2>
         <p className="text-muted-foreground mb-6">Nuestro equipo de soporte está disponible de Lunes a Viernes, 9:00 AM - 6:00 PM.</p>
         <div className="inline-flex items-center justify-center px-4 py-2 bg-muted rounded-full text-sm font-medium">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
            Sistemas Operativos Normales
         </div>
      </div>
    </div>
  );
};

export default SupportPage;