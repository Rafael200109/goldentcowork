import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Home, Users, CheckCircle2, HelpCircle, Save } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from "@/components/ui/use-toast.js";
import { cn } from '@/lib/utils.js';
import { usePublishClinic } from '@/contexts/PublishClinicContext.jsx';
import PublishFlowLayout from '@/layouts/PublishFlowLayout';

const clinicTypes = [
  {
    id: 'entire_clinic',
    icon: Home,
    title: 'Una clínica entera',
    description: 'Los odontólogos tienen toda la clínica para ellos.',
  },
  {
    id: 'cubicle',
    icon: Users,
    title: 'Un cubículo',
    description: 'Los odontólogos tienen su propio cubículo, además de acceso a espacios compartidos.',
  },
];

const PublishClinicStep1 = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { clinicData, updateClinicData } = usePublishClinic();

  const handleSelectType = (typeId) => {
    updateClinicData({ type: typeId });
  };

  const handleNext = () => {
    if (!clinicData.type) {
      toast({
        title: "Selecciona un tipo",
        description: "Por favor, elige qué tipo de espacio ofreces.",
        variant: "destructive",
      });
      return;
    }
    navigate('/publish-clinic/step-2');
  };

  return (
    <PublishFlowLayout
      currentStep={1}
      totalSteps={4}
      onNext={handleNext}
      onBack={() => navigate('/publish-clinic')}
      isNextDisabled={!clinicData.type}
    >
      <div className="flex-grow flex flex-col items-center justify-center p-4 sm:p-8 text-center">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-8 sm:mb-12"
        >
          ¿Qué tipo de espacio ofreces a los odontólogos?
        </motion.h1>

        <div className="space-y-4 sm:space-y-6 w-full max-w-lg lg:max-w-xl">
          {clinicTypes.map((type, index) => (
            <motion.div
              key={type.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 * index, ease: "easeOut" }}
            >
              <Card
                onClick={() => handleSelectType(type.id)}
                className={cn(
                  "p-4 sm:p-6 cursor-pointer transition-all duration-200 ease-in-out hover:shadow-md",
                  "border-2 rounded-lg",
                  clinicData.type === type.id 
                    ? "border-foreground bg-muted/30 shadow-md" 
                    : "border-border hover:border-muted-foreground/50"
                )}
              >
                <CardContent className="flex items-center justify-between text-left p-0">
                  <div className="flex-grow">
                    <h3 className="text-md sm:text-lg font-semibold text-foreground mb-1">{type.title}</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">{type.description}</p>
                  </div>
                  <div className="relative ml-4">
                    <type.icon 
                      className={cn(
                        "w-8 h-8 sm:w-10 sm:h-10 transition-colors",
                        clinicData.type === type.id ? "text-primary" : "text-muted-foreground/70"
                      )} 
                      strokeWidth={1.5} 
                    />
                    {clinicData.type === type.id && (
                      <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="absolute -top-1 -right-1 bg-primary rounded-full p-0.5 shadow-sm"
                      >
                        <CheckCircle2 className="w-4 h-4 text-primary-foreground" />
                      </motion.div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </PublishFlowLayout>
  );
};

export default PublishClinicStep1;