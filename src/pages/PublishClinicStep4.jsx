import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from "@/components/ui/use-toast.js";
import { usePublishClinic } from '@/contexts/PublishClinicContext.jsx';
import PublishFlowLayout from '@/layouts/PublishFlowLayout';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Loader2 } from 'lucide-react';

const PublishClinicStep4 = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const { clinicData, updateClinicData, publishClinic, loading } = usePublishClinic();

    const handlePriceChange = (e) => {
        const value = e.target.value.replace(/[^0-9]/g, '');
        updateClinicData({ price_per_hour: Number(value) });
    };

    const handleHoursChange = (value) => {
        updateClinicData({ min_hours_booking: value[0] });
    };
    
    const isFormValid = clinicData.price_per_hour > 0 && clinicData.min_hours_booking > 0;

    const handlePublish = async () => {
        if (!isFormValid) {
            toast({
                title: "Información Faltante",
                description: "Por favor, establece un precio y un mínimo de horas.",
                variant: "destructive"
            });
            return;
        }
        await publishClinic();
    };

    const cardClassName = "bg-card shadow-sm border rounded-xl";

    return (
        <PublishFlowLayout
            currentStep={4}
            totalSteps={4}
            onNext={handlePublish}
            onBack={() => navigate('/publish-clinic/step-3')}
            isNextDisabled={!isFormValid || loading}
        >
            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="text-center mb-8 sm:mb-12 px-4"
            >
                <h1 className="text-3xl sm:text-4xl font-bold text-foreground">Terminar y publicar</h1>
                <p className="text-muted-foreground mt-2 text-sm sm:text-base max-w-2xl mx-auto">
                    Establece tu precio, revisa tu anuncio y publícalo para que los odontólogos puedan encontrarlo.
                </p>
            </motion.div>
            
            <div className="max-w-2xl mx-auto px-4 space-y-10">
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
                    <Card className={cardClassName}>
                        <CardHeader>
                            <CardTitle>Precio por hora</CardTitle>
                            <CardDescription>Establece un precio competitivo para tu espacio.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex items-center gap-4">
                            <span className="text-xl font-semibold text-muted-foreground">DOP</span>
                            <Input 
                                type="text"
                                value={clinicData.price_per_hour || ''} 
                                onChange={handlePriceChange} 
                                placeholder="Ej: 1500" 
                                className="text-2xl font-bold h-14"
                            />
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
                    <Card className={cardClassName}>
                        <CardHeader>
                            <CardTitle>Mínimo de horas por reserva</CardTitle>
                            <CardDescription>Define el tiempo mínimo que un odontólogo puede reservar.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-4">
                                <Slider
                                    value={[clinicData.min_hours_booking || 2]}
                                    onValueChange={handleHoursChange}
                                    min={1}
                                    max={8}
                                    step={1}
                                />
                                <Badge variant="secondary" className="text-lg px-4 py-2">
                                    {clinicData.min_hours_booking || 2} horas
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
                    <Card className={cn(cardClassName, "bg-gradient-to-br from-primary/5 to-secondary/5")}>
                        <CardHeader>
                            <CardTitle>¡Todo listo para publicar!</CardTitle>
                            <CardDescription>Revisa que todo esté correcto. Una vez publicado, tu anuncio pasará por un proceso de verificación antes de ser visible.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button
                                size="lg"
                                className="w-full text-lg"
                                onClick={handlePublish}
                                disabled={!isFormValid || loading}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Publicando...
                                    </>
                                ) : (
                                    'Confirmar y Publicar'
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </PublishFlowLayout>
    );
};

export default PublishClinicStep4;