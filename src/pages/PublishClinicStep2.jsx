import React, { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from "@/components/ui/use-toast.js";
import { usePublishClinic } from '@/contexts/PublishClinicContext.jsx';
import PublishFlowLayout from '@/layouts/PublishFlowLayout';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { motion } from 'framer-motion';
import ImageUploader from '@/components/publish/ImageUploader';
import LocationPicker from '@/components/publish/LocationPicker';

const MIN_PHOTOS = 5;

const PublishClinicStep2 = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const { clinicData, updateClinicData } = usePublishClinic();

    const handleInputChange = useCallback((e) => {
        const { name, value } = e.target;
        updateClinicData({ [name]: value });
    }, [updateClinicData]);
    
    const isFormValid = useMemo(() => {
        return clinicData.name?.trim() !== '' &&
               clinicData.description?.trim() !== '' &&
               clinicData.photos?.length >= MIN_PHOTOS &&
               clinicData.address_street?.trim() !== '' &&
               clinicData.address_province?.trim() !== '' &&
               clinicData.address_city?.trim() !== '' &&
               clinicData.latitude !== null &&
               clinicData.longitude !== null;
    }, [clinicData]);

    const handleNext = () => {
        if (!isFormValid) {
            toast({
                title: "Campos incompletos",
                description: "Por favor, completa toda la información requerida y sube al menos 5 fotos.",
                variant: "destructive",
            });
            return;
        }
        navigate('/publish-clinic/step-3');
    };

    const cardClassName = "bg-card shadow-sm border rounded-xl";
    const inputClassName = "border-gray-300 focus:border-primary focus:ring-primary";

    return (
        <PublishFlowLayout
            currentStep={2}
            totalSteps={4}
            onNext={handleNext}
            onBack={() => navigate('/publish-clinic/step-1')}
            isNextDisabled={!isFormValid}
        >
            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="text-center mb-8 sm:mb-12 px-4"
            >
                <h1 className="text-3xl sm:text-4xl font-bold text-foreground">Haz que tu espacio destaque</h1>
                <p className="text-muted-foreground mt-2 text-sm sm:text-base max-w-2xl mx-auto">
                    Agrega los detalles clave, fotos de calidad y la ubicación para atraer a los odontólogos.
                </p>
            </motion.div>
            
            <div className="max-w-2xl mx-auto px-4 space-y-10">
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
                    <Card className={cardClassName}>
                        <CardHeader>
                            <CardTitle>Título del anuncio</CardTitle>
                            <CardDescription>Crea un título corto y atractivo.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Input 
                                name="name" 
                                value={clinicData.name || ''} 
                                onChange={handleInputChange} 
                                placeholder="Ej: Moderno cubículo en el corazón de la ciudad" 
                                className={inputClassName}
                                maxLength={50}
                            />
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
                    <Card className={cardClassName}>
                        <CardHeader>
                            <CardTitle>Descripción</CardTitle>
                            <CardDescription>Describe qué hace especial tu espacio.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Textarea 
                                name="description" 
                                value={clinicData.description || ''} 
                                onChange={handleInputChange} 
                                placeholder="Detalla el equipamiento, el ambiente y las ventajas de tu clínica." 
                                rows={5}
                                className={inputClassName}
                            />
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
                    <Card className={cardClassName}>
                        <CardHeader>
                            <CardTitle>Fotos</CardTitle>
                            <CardDescription>Sube al menos {MIN_PHOTOS} fotos. La primera será tu portada.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ImageUploader />
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
                    <Card className={cardClassName}>
                        <CardHeader>
                            <CardTitle>Ubicación</CardTitle>
                            <CardDescription>Confirma la dirección de tu clínica.</CardDescription>
                        </CardHeader>
                        <CardContent>
                           <LocationPicker />
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </PublishFlowLayout>
    );
};

export default PublishClinicStep2;