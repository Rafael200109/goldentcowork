import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { HelpCircle, Save } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { cn } from '@/lib/utils';

const PublishFlowLayout = ({ children, currentStep, totalSteps, onNext, onBack, isNextDisabled }) => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const logoUrl = "https://storage.googleapis.com/hostinger-horizons-assets-prod/63ef2070-7e9f-47c2-85b6-42a10bded4a0/13b7a79bee570a0a14cc2cb114de4e4d.png";

    const handleSaveAndExit = () => {
        toast({
            title: "Progreso guardado",
            description: "Puedes continuar donde lo dejaste en cualquier momento.",
        });
        navigate('/clinic-dashboard');
    };

    const handleHelp = () => {
        toast({
            title: "🚧 Centro de Ayuda",
            description: "Nuestro centro de ayuda estará disponible próximamente.",
        });
    };

    const progressPercentage = ((currentStep - 1) / (totalSteps -1)) * 100;

    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground">
            <header className="fixed top-0 left-0 right-0 z-20 flex items-center justify-between p-4 sm:p-6 bg-background border-b border-border">
                <div>
                    <img src={logoUrl} alt="Goldent Logo" className="h-8 w-auto" />
                </div>
                <div className="flex items-center space-x-2 sm:space-x-3">
                    <Button variant="outline" size="sm" onClick={handleHelp}>
                        <HelpCircle className="w-4 h-4 mr-1 sm:mr-2" />
                        <span className="hidden sm:inline">Dudas</span>
                        <span className="sm:hidden">Dudas</span>
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleSaveAndExit}>
                        <Save className="w-4 h-4 mr-1 sm:mr-2" />
                        <span className="hidden sm:inline">Guardar y salir</span>
                        <span className="sm:hidden">Salir</span>
                    </Button>
                </div>
            </header>

            <main className="flex-grow pt-24 sm:pt-28 pb-24 sm:pb-28">
                {children}
            </main>

            <footer className="fixed bottom-0 left-0 right-0 w-full border-t border-border bg-background py-4 px-4 sm:px-6 md:px-8 z-10">
                <div className="max-w-6xl mx-auto mb-3 h-1.5 bg-muted rounded-full overflow-hidden">
                    <motion.div 
                        className="h-full bg-foreground"
                        initial={{ width: "0%" }}
                        animate={{ width: `${progressPercentage}%` }}
                        transition={{ duration: 0.5, ease: "easeInOut" }}
                    />
                </div>
                <div className="max-w-6xl mx-auto flex justify-between items-center">
                    <Button
                        variant="link"
                        size="lg"
                        onClick={onBack}
                        className="font-semibold text-foreground hover:text-primary p-0 underline"
                    >
                        Atrás
                    </Button>
                    <Button
                        size="lg"
                        onClick={onNext}
                        disabled={isNextDisabled}
                        className={cn(
                            "font-semibold shadow-md hover:shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105",
                            "bg-gray-800 hover:bg-black text-white dark:bg-neutral-900 dark:hover:bg-black",
                            isNextDisabled && "opacity-50 cursor-not-allowed"
                        )}
                    >
                        Siguiente
                    </Button>
                </div>
            </footer>
        </div>
    );
};

export default PublishFlowLayout;