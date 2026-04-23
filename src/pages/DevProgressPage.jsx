import React from 'react';
    import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
    import { Badge } from '@/components/ui/badge';
    import { CheckCircle, Clock, AlertCircle } from 'lucide-react';
    import { cn } from '@/lib/utils';

    const FeatureItem = ({ name, status }) => {
      const statusConfig = {
        Completado: {
          icon: <CheckCircle className="w-4 h-4 text-green-500" />,
          variant: 'default',
          className: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
        },
        'En Progreso': {
          icon: <Clock className="w-4 h-4 text-blue-500" />,
          variant: 'secondary',
          className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
        },
        Pendiente: {
          icon: <AlertCircle className="w-4 h-4 text-yellow-500" />,
          variant: 'outline',
          className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
        },
      };

      const config = statusConfig[status] || statusConfig.Pendiente;

      return (
        <li className="flex items-center justify-between p-3 bg-background rounded-lg">
          <span className="text-sm font-medium text-muted-foreground">{name}</span>
          <Badge variant={config.variant} className={cn('flex items-center gap-1.5', config.className)}>
            {config.icon}
            {status}
          </Badge>
        </li>
      );
    };

    const FeatureCategory = ({ title, features }) => (
      <Card className="glassmorphism">
        <CardHeader>
          <CardTitle className="gradient-text">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {features.map((feature, index) => (
              <FeatureItem key={index} {...feature} />
            ))}
          </ul>
        </CardContent>
      </Card>
    );

    const DevProgressPage = () => {
      const features = {
        'Autenticación y Perfiles': [
          { name: 'Registro de Odontólogos y Anfitriones', status: 'Completado' },
          { name: 'Inicio y Cierre de Sesión', status: 'Completado' },
          { name: 'Recuperación de Contraseña', status: 'Completado' },
          { name: 'Gestión de Perfil de Usuario', status: 'Completado' },
          { name: 'Subida de Documentos para Verificación', status: 'Completado' },
        ],
        'Panel del Odontólogo': [
          { name: 'Búsqueda y Filtro de Clínicas', status: 'Completado' },
          { name: 'Vista de Detalles de Clínica', status: 'Completado' },
          { name: 'Sistema de Reservas', status: 'Completado' },
          { name: 'Gestión de "Mis Reservas"', status: 'Completado' },
          { name: 'Sistema de Reseñas y Calificaciones', status: 'Completado' },
        ],
        'Panel del Anfitrión': [
          { name: 'Creación y Publicación de Clínicas', status: 'Completado' },
          { name: 'Edición de Clínicas Existentes', status: 'Completado' },
          { name: 'Calendario de Reservas', status: 'Completado' },
          { name: 'Panel Financiero (Ingresos y Transacciones)', status: 'En Progreso' },
          { name: 'Estadísticas de la Clínica', status: 'Completado' },
        ],
        'Panel de Administración': [
          { name: 'Dashboard Principal con Estadísticas', status: 'Completado' },
          { name: 'Gestión de Usuarios (CRUD)', status: 'Completado' },
          { name: 'Validación de Clínicas Nuevas', status: 'Completado' },
          { name: 'Panel de Contabilidad (Pagos a Anfitriones)', status: 'Completado' },
          { name: 'Vista de todas las conversaciones de soporte', status: 'Completado' },
        ],
        'Módulos Generales': [
          { name: 'Sistema de Soporte Técnico por Chat', status: 'En Progreso' },
          { name: 'Integración de Políticas y Legales', status: 'Completado' },
          { name: 'Notificaciones por Toast', status: 'Completado' },
          { name: 'Pasarela de Pagos (Stripe/Cardnet)', status: 'Pendiente' },
          { name: 'Notificaciones por Email (Registro, Reserva, etc.)', status: 'Pendiente' },
          { name: 'Internacionalización (Multi-idioma)', status: 'Pendiente' },
        ],
      };

      return (
        <div className="container mx-auto py-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl gradient-text">
              Avances del Proyecto Goldent
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Un resumen del estado actual de desarrollo de la plataforma.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(features).map(([category, featureList]) => (
              <FeatureCategory key={category} title={category} features={featureList} />
            ))}
          </div>
        </div>
      );
    };

    export default DevProgressPage;