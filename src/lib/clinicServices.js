import { Utensils, Briefcase, Waves, ArrowUpFromDot, Wind, Wifi, Car, Tv, ShowerHead as WashingMachine, ThermometerSnowflake, Thermometer as Heater, Coffee, Dog, Warehouse, ConciergeBell, MonitorSmartphone, Droplets, ShieldCheck, Zap, Armchair } from 'lucide-react';

export const PREDEFINED_SERVICES = [
  { id: 'kitchen', name: 'Cocina', icon: 'Utensils', lucideIcon: Utensils, description: 'Acceso a cocina equipada para calentar o preparar alimentos ligeros.' },
  { id: 'workspace', name: 'Zona de trabajo', icon: 'Briefcase', lucideIcon: Briefcase, description: 'Espacio dedicado con escritorio y silla ergonómica.' },
  { id: 'pool', name: 'Piscina compartida', icon: 'Waves', lucideIcon: Waves, description: 'Acceso a piscina en áreas comunes del edificio.' },
  { id: 'elevator', name: 'Ascensor', icon: 'ArrowUpFromDot', lucideIcon: ArrowUpFromDot, description: 'Edificio con ascensor funcional y accesible.' },
  { id: 'dryer', name: 'Secadora', icon: 'Wind', lucideIcon: Wind, description: 'Servicio de secado disponible en el local.' },
  { id: 'wifi', name: 'Wifi de alta velocidad', icon: 'Wifi', lucideIcon: Wifi, description: 'Conexión a internet de fibra óptica disponible en todas las áreas.' },
  { id: 'free_parking', name: 'Estacionamiento gratuito', icon: 'Car', lucideIcon: Car, description: 'Espacio de estacionamiento sin costo adicional para pacientes.' },
  { id: 'hd_tv', name: 'Televisor HD', icon: 'Tv', lucideIcon: Tv, description: 'Pantalla de alta definición en sala de espera o cubículo.' },
  { id: 'washer', name: 'Lavadora', icon: 'WashingMachine', lucideIcon: WashingMachine, description: 'Servicio de lavandería disponible para uniformes.' },
  { id: 'ac', name: 'Aire acondicionado', icon: 'ThermometerSnowflake', lucideIcon: ThermometerSnowflake, description: 'Climatización completa en todas las áreas de la clínica.' },
  { id: 'heating', name: 'Calefacción', icon: 'Heater', lucideIcon: Heater, description: 'Sistema de calefacción para días fríos.' },
  { id: 'breakfast', name: 'Desayuno incluido', icon: 'Coffee', lucideIcon: Coffee, description: 'Café, té o snacks ligeros disponibles por la mañana.' },
  { id: 'pets', name: 'Mascotas permitidas', icon: 'Dog', lucideIcon: Dog, description: 'Se permite el ingreso de mascotas de asistencia o compañía.' },
  { id: 'private_parking', name: 'Estacionamiento privado', icon: 'Warehouse', lucideIcon: Warehouse, description: 'Estacionamiento exclusivo y seguro para el odontólogo.' },
  { id: 'reception_24h', name: 'Recepción 24h', icon: 'ConciergeBell', lucideIcon: ConciergeBell, description: 'Personal de recepción disponible en todo momento.' },
  { id: 'smart_tv', name: 'Smart TV con Streaming', icon: 'MonitorSmartphone', lucideIcon: MonitorSmartphone, description: 'Acceso a Netflix, YouTube, etc. para entretenimiento.' },
  { id: 'water', name: 'Agua purificada', icon: 'Droplets', lucideIcon: Droplets, description: 'Dispensador de agua potable disponible.' },
  { id: 'security', name: 'Seguridad privada', icon: 'ShieldCheck', lucideIcon: ShieldCheck, description: 'Personal de seguridad y monitoreo en el establecimiento.' },
  { id: 'generator', name: 'Planta eléctrica', icon: 'Zap', lucideIcon: Zap, description: 'Energía de respaldo garantizada 24/7.' },
  { id: 'lounge', name: 'Sala de descanso', icon: 'Armchair', lucideIcon: Armchair, description: 'Área confortable para descanso entre pacientes.' }
];

// Helper to get icon component by string name
export const getServiceIcon = (iconName) => {
  const service = PREDEFINED_SERVICES.find(s => s.icon === iconName);
  return service ? service.lucideIcon : ShieldCheck; // Default icon
};