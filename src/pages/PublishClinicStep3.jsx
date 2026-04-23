import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from "@/components/ui/use-toast.js";
import { usePublishClinic } from '@/contexts/PublishClinicContext.jsx';
import PublishFlowLayout from '@/layouts/PublishFlowLayout';
import { 
    Wifi, Thermometer, Users, Car, CreditCard, 
    Flame, ShieldAlert, HeartPulse, BellRing,
    Cigarette, Dog, SprayCan, Trash2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils.js';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import ServicesSelector from '@/components/publish/ServicesSelector';

const amenitiesList = [
    { id: 1, name: 'Wifi de alta velocidad', icon: Wifi },
    { id: 2, name: 'Aire acondicionado', icon: Thermometer },
    { id: 3, name: 'Sala de espera', icon: Users },
    { id: 4, name: 'Estacionamiento', icon: Car },
    { id: 5, name: 'Pagos con Tarjeta', icon: CreditCard },
    { id: 6, name: 'Detector de humo', icon: BellRing },
    { id: 7, name: 'Botiquín Primeros Auxilios', icon: HeartPulse },
    { id: 8, name: 'Extintor', icon: Flame },
    { id: 9, name: 'Seguridad 24/7', icon: ShieldAlert },
];

const commonRules = [
    { id: 1, name: 'Prohibido Fumar', icon: Cigarette, description: 'Espacio libre de humo' },
    { id: 2, name: 'No se permiten mascotas', icon: Dog, description: 'Excepto animales de servicio' },
    { id: 3, name: 'Traer propios instrumentos', icon: SprayCan, description: 'Solo se alquila el sillón' },
    { id: 4, name: 'Dejar el área limpia', icon: Trash2, description: 'Limpiar al terminar el turno' },
];

const AmenityCard = ({ item, isSelected, onSelect }) => {
    return (
        <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(item.id)}
            className={cn(
                "p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 flex flex-col gap-3 h-full",
                isSelected 
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border bg-card hover:border-muted-foreground/30"
            )}
        >
            <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            )}>
                <item.icon className="w-5 h-5" strokeWidth={2} />
            </div>
            <span className={cn(
                "text-sm font-semibold leading-tight", 
                isSelected ? "text-primary" : "text-foreground"
            )}>
                {item.name}
            </span>
        </motion.div>
    );
};

const RuleItem = ({ rule, allowed, onToggle }) => (
    <div className="flex items-center justify-between p-4 rounded-xl border bg-card hover:bg-accent/5 transition-colors">
        <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground">
                <rule.icon className="w-5 h-5" />
            </div>
            <div>
                <p className="font-medium text-sm sm:text-base">{rule.name}</p>
                <p className="text-xs text-muted-foreground">{rule.description}</p>
            </div>
        </div>
        <Switch 
            checked={allowed} 
            onCheckedChange={() => onToggle(rule.id)}
        />
    </div>
);

const PublishClinicStep3 = () => {
    const navigate = useNavigate();
    const { clinicData, updateClinicData } = usePublishClinic();

    const handleToggleAmenity = (amenityId) => {
        const currentAmenities = clinicData.amenities || [];
        const newAmenities = currentAmenities.includes(amenityId)
            ? currentAmenities.filter(id => id !== amenityId)
            : [...currentAmenities, amenityId];
        updateClinicData({ amenities: newAmenities });
    };

    const handleToggleRule = (ruleId) => {
        const currentRules = clinicData.rules || {};
        updateClinicData({
            rules: { ...currentRules, [ruleId]: !currentRules[ruleId] }
        });
    };

    const handleServicesChange = (newServices) => {
        updateClinicData({ services: newServices });
    };

    const handleNext = () => {
        navigate('/publish-clinic/step-4');
    };

    return (
        <PublishFlowLayout
            currentStep={3}
            totalSteps={4}
            onNext={handleNext}
            onBack={() => navigate('/publish-clinic/step-2')}
        >
            <div className="max-w-4xl mx-auto px-4 sm:px-6">
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-10"
                >
                    <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">Servicios y Reglas</h1>
                    <p className="text-muted-foreground text-sm sm:text-base max-w-2xl mx-auto">
                        Selecciona los servicios que ofrece tu clínica y define las reglas importantes para los odontólogos.
                    </p>
                </motion.div>

                <div className="space-y-12">
                    {/* New Services Section */}
                    <section>
                        <div className="flex items-center gap-2 mb-6">
                            <h2 className="text-xl font-semibold">Servicios que ofrece este lugar</h2>
                            <Separator className="flex-1" />
                        </div>
                        <p className="text-muted-foreground mb-4 text-sm">Selecciona de la lista todos los servicios que están disponibles para los odontólogos que reserven.</p>
                        <ServicesSelector 
                            selectedServices={clinicData.services || []} 
                            onChange={handleServicesChange} 
                        />
                    </section>

                    <section>
                        <div className="flex items-center gap-2 mb-6">
                            <h2 className="text-xl font-semibold">Comodidades Destacadas</h2>
                            <Separator className="flex-1" />
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {amenitiesList.map(amenity => (
                                <AmenityCard 
                                    key={amenity.id} 
                                    item={amenity} 
                                    isSelected={(clinicData.amenities || []).includes(amenity.id)}
                                    onSelect={handleToggleAmenity}
                                />
                            ))}
                        </div>
                    </section>

                    <section>
                        <div className="flex items-center gap-2 mb-6">
                            <h2 className="text-xl font-semibold">Reglas de la Clínica</h2>
                            <Separator className="flex-1" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {commonRules.map(rule => (
                                <RuleItem 
                                    key={rule.id}
                                    rule={rule}
                                    allowed={!!(clinicData.rules || {})[rule.id]}
                                    onToggle={handleToggleRule}
                                />
                            ))}
                        </div>
                    </section>
                </div>
            </div>
        </PublishFlowLayout>
    );
};

export default PublishClinicStep3;