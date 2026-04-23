import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CheckCircle, Edit3, UploadCloud, Send, X } from 'lucide-react';
import { motion } from 'framer-motion';

const PublishClinicIntro = () => {
  const navigate = useNavigate();

  const steps = [
    {
      icon: <Edit3 className="w-7 h-7 text-secondary" />,
      title: 'Describe tu espacio',
      description: 'Agrega datos básicos, como el tipo de espacio, dónde está y qué servicios ofreces.',
    },
    {
      icon: <UploadCloud className="w-7 h-7 text-secondary" />,
      title: 'Haz que destaque',
      description: 'Agrega al menos cinco fotos, un título atractivo y una descripción detallada.',
    },
    {
      icon: <Send className="w-7 h-7 text-secondary" />,
      title: 'Terminar y publicar',
      description: 'Elige un precio inicial, verifica algunos detalles y publica tu clínica.',
    },
  ];

  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
      <header className="absolute top-6 right-6 z-10">
        <Button variant="ghost" size="icon" onClick={() => navigate('/clinic-dashboard')} aria-label="Salir">
          <X className="w-6 h-6 text-muted-foreground hover:text-foreground" />
        </Button>
      </header>
      
      <main className="flex-grow flex items-center justify-center p-4 sm:p-6 md:p-8">
        <div className="grid md:grid-cols-2 gap-8 md:gap-16 w-full max-w-6xl">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: "circOut" }}
            className="flex flex-col justify-center text-center md:text-left"
          >
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground leading-tight">
              Publicar tu clínica en <span className="text-primary">Goldent</span> es muy fácil
            </h1>
          </motion.div>

          <motion.div 
            className="space-y-6 md:space-y-8"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: "circOut" }}
          >
            {steps.map((step, index) => (
              <motion.div
                key={index}
                className="flex items-start gap-4 p-4 rounded-lg bg-card/50 dark:bg-card/80"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 + index * 0.15 }}
              >
                <div className="flex-shrink-0 pt-1">
                  {step.icon}
                </div>
                <div className="flex-grow">
                  <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-1">
                    <span className="text-secondary font-bold">{index + 1}.</span> {step.title}
                  </h2>
                  <p className="text-muted-foreground text-sm sm:text-base">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </main>

      <footer className="w-full border-t border-border bg-background py-4 px-4 sm:px-6 md:px-8">
        <div className="max-w-6xl mx-auto flex justify-end">
          <Button
            size="lg"
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md hover:shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105"
            onClick={() => navigate('/publish-clinic/step-1')}
          >
            Comenzar Ahora <CheckCircle className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </footer>
    </div>
  );
};

export default PublishClinicIntro;