import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ArrowLeft, BookOpen, FileText, Shield, HeartHandshake as Handshake, CreditCard, Scale, MessageSquare, Hand, FileEdit, Mail } from 'lucide-react';
import { motion } from 'framer-motion';

const policies = [
  {
    value: "item-1",
    title: "Términos y Condiciones de Uso",
    icon: <FileText className="h-5 w-5 mr-3 text-primary" />,
    content: `
      <p>Bienvenido a GolDent Co-Work, un servicio diseñado para conectar a odontólogos con propietarios de clínicas para la renta de consultorios por horas de manera segura y eficiente. Al utilizar nuestra plataforma, usted acepta cumplir con las siguientes Políticas de Uso.</p>
      <ul class="list-disc list-inside ml-4 my-2 space-y-2">
        <li><strong>Usuarios elegibles:</strong> Solo pueden usar esta app odontólogos con exequátur vigente en la República Dominicana y clínicas debidamente habilitadas.</li>
        <li><strong>Objeto de la plataforma:</strong> Facilitar la conexión entre odontólogos y propietarios de clínicas para la renta de espacios por horas mediante una aplicación tecnológica.</li>
        <li><strong>Obligaciones del usuario:</strong> Proveer información veraz, mantener una conducta profesional, respetar el tiempo y el espacio reservado.</li>
      </ul>
    `
  },
  {
    value: "item-2",
    title: "Política de Privacidad",
    icon: <Shield className="h-5 w-5 mr-3 text-primary" />,
    content: `
      <p>En cumplimiento de la Ley No. 172-13 sobre Protección de Datos de Carácter Personal en la República Dominicana, GolDent Co-Work garantiza la confidencialidad y seguridad de los datos personales.</p>
      <ul class="list-disc list-inside ml-4 my-2 space-y-2">
        <li><strong>Se recolectan datos como:</strong> nombre, cédula, exequátur, teléfono, correo, y cuenta bancaria.</li>
        <li><strong>Estos datos se utilizan únicamente para:</strong> fines de contacto, pago y verificación profesional.</li>
        <li><strong>El usuario puede solicitar modificación o eliminación de sus datos escribiendo a:</strong> <a href="mailto:legal@goldentcowork.com" class="underline text-secondary font-semibold">legal@goldentcowork.com</a>.</li>
      </ul>
    `
  },
  {
    value: "item-3",
    title: "Política de Cancelación y Reembolso",
    icon: <Handshake className="h-5 w-5 mr-3 text-primary" />,
    content: `
      <h3 class="font-semibold text-base mt-2 mb-1">Cancelación por parte del odontólogo:</h3>
      <ul class="list-disc list-inside ml-4 my-2 space-y-2">
        <li>Con <strong>más de 48 horas:</strong> reembolso del 100%.</li>
        <li>Entre <strong>48 y 24 horas:</strong> se retiene 25% como penalidad.</li>
        <li><strong>Menos de 24 horas</strong> o no show: no se reembolsa el monto.</li>
      </ul>
      <h3 class="font-semibold text-base mt-4 mb-1">Cancelación por parte de la clínica:</h3>
      <ul class="list-disc list-inside ml-4 my-2 space-y-2">
        <li>Si cancela con <strong>menos de 24 horas</strong> de antelación: el odontólogo recibe el 100% y la clínica es advertida. Dos advertencias en 60 días: suspensión temporal.</li>
      </ul>
      <p>Los reembolsos se procesan en 5 días laborables. Casos excepcionales (emergencias médicas, fuerza mayor) serán evaluados con documentos probatorios.</p>
    `
  },
  {
    value: "item-4",
    title: "Política de Uso de los Consultorios",
    icon: <BookOpen className="h-5 w-5 mr-3 text-primary" />,
    content: `
      <p>Los consultorios deben estar en condiciones óptimas de higiene, funcionalidad y mantenimiento.</p>
      <ul class="list-disc list-inside ml-4 my-2 space-y-2">
        <li>Odontólogos y propietarios deberán firmar un documento de revisión antes y después del uso.</li>
        <li>Cualquier daño debe ser reportado inmediatamente.</li>
        <li>Los odontólogos son responsables por los daños causados durante su uso.</li>
        <li>Conducta profesional esperada en todo momento. La plataforma podrá suspender usuarios en caso de faltas graves.</li>
      </ul>
    `
  },
  {
    value: "item-5",
    title: "Política de Pagos de Plataforma",
    icon: <CreditCard className="h-5 w-5 mr-3 text-primary" />,
    content: `
      <ul class="list-disc list-inside ml-4 my-2 space-y-2">
        <li>El odontólogo debe pagar por adelantado para confirmar su reserva.</li>
        <li><strong>La plataforma aplica una comisión del 25% por transacción, distribuida entre el odontólogo y el anfitrión. Esta comisión se retiene del monto total de cada reserva confirmada.</strong></li>
        <li><em>Ejemplo práctico:</em> Si una sesión cuesta RD$2,000:
          <ul class="list-disc list-inside ml-6 mt-1 text-sm text-muted-foreground">
             <li>Comisión de plataforma: RD$500 (25%)</li>
             <li>Monto neto para el anfitrión: RD$1,500</li>
          </ul>
        </li>
        <li>Pagos a propietarios se realizan de manera programada o a solicitud mediante el método elegido en el panel financiero.</li>
        <li>Si se requiere comprobante fiscal, la plataforma lo emite por el valor de la comisión.</li>
        <li>En caso de impago, no se activa la reserva.</li>
      </ul>
    `
  },
  {
    value: "item-6",
    title: "Resolución de Conflictos",
    icon: <Scale className="h-5 w-5 mr-3 text-primary" />,
    content: `
      <ul class="list-disc list-inside ml-4 my-2 space-y-2">
        <li>Cualquier disputa debe ser notificada primero a <a href="mailto:soporte@goldentcowork.com" class="underline text-secondary font-semibold">soporte@goldentcowork.com</a>.</li>
        <li>Si no hay resolución satisfactoria, se procederá a una mediación legal con un centro reconocido.</li>
        <li>En última instancia, se acudiría a los tribunales del Distrito Nacional.</li>
      </ul>
    `
  },
  {
    value: "item-7",
    title: "Exención de Responsabilidad",
    icon: <Hand className="h-5 w-5 mr-3 text-primary" />,
    content: `
      <p>GolDent Co-Work es solo un intermediario tecnológico.</p>
      <ul class="list-disc list-inside ml-4 my-2 space-y-2">
        <li>No se responsabiliza por la calidad del servicio odontológico ni por negligencias profesionales.</li>
        <li>Los odontólogos deben firmar un descargo de responsabilidad al reservar.</li>
        <li>Los propietarios no son responsables por malas prácticas de los arrendatarios.</li>
      </ul>
    `
  },
  {
    value: "item-8",
    title: "Política de Revisión y Evaluación",
    icon: <MessageSquare className="h-5 w-5 mr-3 text-primary" />,
    content: `
      <ul class="list-disc list-inside ml-4 my-2 space-y-2">
        <li>Los usuarios podrán calificar y dejar reseñas sobre su experiencia.</li>
        <li>No se permite lenguaje ofensivo o difamatorio. Comentarios falsos serán removidos.</li>
        <li>La plataforma se reserva el derecho de investigar y moderar estas opiniones.</li>
      </ul>
    `
  },
  {
    value: "item-9",
    title: "Política de Colaboración y Convivencia",
    icon: <Handshake className="h-5 w-5 mr-3 text-primary" />,
    content: `
      <ul class="list-disc list-inside ml-4 my-2 space-y-2">
        <li>Se espera respeto mutuo entre odontólogos, propietarios, personal y pacientes.</li>
        <li>Está prohibido negociar rentas fuera de la plataforma luego de una conexión realizada a través de GolDent.</li>
        <li>Conductas inapropiadas o discriminatorias serán motivo de sanción o suspensión.</li>
      </ul>
    `
  },
  {
    value: "item-10",
    title: "Modificación de Políticas",
    icon: <FileEdit className="h-5 w-5 mr-3 text-primary" />,
    content: `
      <ul class="list-disc list-inside ml-4 my-2 space-y-2">
        <li>La plataforma se reserva el derecho de modificar estas políticas.</li>
        <li>Se notificará a los usuarios con al menos 7 días de anticipación mediante correo o dentro de la app.</li>
      </ul>
    `
  },
  {
    value: "item-11",
    title: "Contacto Legal",
    icon: <Mail className="h-5 w-5 mr-3 text-primary" />,
    content: `
      <p>Para dudas o situaciones legales, puede comunicarse con:</p>
      <ul class="list-disc list-inside ml-4 my-2 space-y-2">
        <li><strong>Correo:</strong> <a href="mailto:legal@goldentcowork.com" class="underline text-secondary font-semibold">legal@goldentcowork.com</a></li>
        <li><strong>Dirección física:</strong> [Colocar dirección fiscal de la empresa]</li>
      </ul>
    `
  },
];

const PolicyPage = () => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-4xl mx-auto py-8 container max-w-screen-2xl px-4 sm:px-6"
    >
      <div className="mb-6">
        <Button variant="outline" onClick={() => navigate(-1)} className="flex items-center">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
        </Button>
      </div>
      <Card className="shadow-xl glassmorphism">
        <CardHeader>
          <CardTitle className="text-3xl font-bold gradient-text text-center">Políticas de Goldent Co-Work</CardTitle>
          <p className="text-muted-foreground text-center">Todo lo que necesitas saber sobre el uso de nuestra plataforma.</p>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full" defaultValue="item-1">
            {policies.map((policy) => (
              <AccordionItem value={policy.value} key={policy.value}>
                <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                  <div className="flex items-center">
                    {policy.icon}
                    {policy.title}
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div 
                    className="prose dark:prose-invert max-w-none text-muted-foreground" 
                    dangerouslySetInnerHTML={{ __html: policy.content }} 
                  />
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default PolicyPage;