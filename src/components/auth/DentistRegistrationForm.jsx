import React, { useState } from 'react';
    import { motion } from 'framer-motion';
    import { Button } from '@/components/ui/button';
    import { Input } from '@/components/ui/input';
    import { Label } from '@/components/ui/label';
    import { useToast } from "@/components/ui/use-toast";
    import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
    import { Eye, EyeOff, Loader2 } from 'lucide-react';
    import { useAuth } from '@/contexts/SupabaseAuthContext.jsx';

    const universitiesInDR = [
      "Universidad Autónoma de Santo Domingo (UASD)",
      "Pontificia Universidad Católica Madre y Maestra (PUCMM)",
      "Universidad Nacional Pedro Henríquez Ureña (UNPHU)",
      "Instituto Tecnológico de Santo Domingo (INTEC)",
      "Universidad Iberoamericana (UNIBE)",
      "Universidad Tecnológica de Santiago (UTESA)",
      "Universidad Central del Este (UCE)",
      "Universidad Organización y Método (O&M)",
      "Otra"
    ];

    const dentalSpecialties = [
      "Odontología General",
      "Ortodoncia",
      "Endodoncia",
      "Periodoncia",
      "Cirugía Oral y Maxilofacial",
      "Prostodoncia",
      "Odontopediatría",
      "Radiología Oral y Maxilofacial",
      "Patología Oral y Maxilofacial",
      "Salud Pública Dental",
      "Otra"
    ];

    const DentistRegistrationForm = ({ onRegistrationComplete }) => {
      const { toast } = useToast();
      const { signUp, loading } = useAuth();
      
      const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        cedula: '',
        phone: '',
        university: '',
        specialty: '',
        password: '',
        confirmPassword: '',
      });
      const [showPassword, setShowPassword] = useState(false);
      const [showConfirmPassword, setShowConfirmPassword] = useState(false);

      const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
      };

      const handleSelectChange = (name, value) => {
        setFormData(prev => ({ ...prev, [name]: value }));
      };

      const validateForm = () => {
        const { fullName, email, cedula, phone, university, specialty, password, confirmPassword } = formData;
        if (!fullName || !email || !cedula || !phone || !university || !specialty) {
          toast({ title: "Campos Incompletos", description: "Por favor, completa todos los campos obligatorios.", variant: "destructive" });
          return false;
        }
        if (!password || !confirmPassword) {
          toast({ title: "Contraseña Requerida", description: "Por favor, introduce y confirma tu contraseña.", variant: "destructive" });
          return false;
        }
        if (password !== confirmPassword) {
          toast({ title: "Error de Contraseña", description: "Las contraseñas no coinciden.", variant: "destructive" });
          return false;
        }
        if (password.length < 8) {
          toast({ title: "Contraseña Débil", description: "La contraseña debe tener al menos 8 caracteres.", variant: "destructive" });
          return false;
        }
        return true;
      };

      const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm() || loading) {
          return;
        }

        const { email, password, fullName, phone, cedula, university, specialty } = formData;
        
        const { error } = await signUp(
          email,
          password,
          {
            data: {
              role: 'dentist',
              full_name: fullName,
              phone,
              dentist_id_document_number: cedula,
              dentist_university: university,
              dentist_specialty: specialty,
              documentation_status: 'pending_documents',
            }
          }
        );

        if (!error) {
          if (onRegistrationComplete) {
            onRegistrationComplete();
          }
        }
      };

      return (
        <form onSubmit={handleSubmit} className="space-y-6">
          <motion.h3 initial={{opacity:0}} animate={{opacity:1}} className="text-xl font-semibold text-center text-primary">
            Datos del Odontólogo
          </motion.h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="fullName">Nombre Completo</Label>
              <Input name="fullName" value={formData.fullName} onChange={handleChange} placeholder="Ej: Dra. Ana Pérez" required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input name="email" type="email" value={formData.email} onChange={handleChange} placeholder="tu@correo.com" required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="cedula">Cédula</Label>
              <Input name="cedula" value={formData.cedula} onChange={handleChange} placeholder="000-0000000-0" required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="phone">Teléfono</Label>
              <Input name="phone" type="tel" value={formData.phone} onChange={handleChange} placeholder="809-000-0000" required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="university">Universidad</Label>
              <Select name="university" onValueChange={(value) => handleSelectChange('university', value)} value={formData.university}>
                <SelectTrigger><SelectValue placeholder="Selecciona tu universidad" /></SelectTrigger>
                <SelectContent>
                  {universitiesInDR.map(uni => <SelectItem key={uni} value={uni}>{uni}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="specialty">Especialidad Principal</Label>
              <Select name="specialty" onValueChange={(value) => handleSelectChange('specialty', value)} value={formData.specialty}>
                <SelectTrigger><SelectValue placeholder="Selecciona tu especialidad" /></SelectTrigger>
                <SelectContent>
                  {dentalSpecialties.map(spec => <SelectItem key={spec} value={spec}>{spec}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="dentist-password">Contraseña</Label>
              <div className="relative">
                <Input name="password" type={showPassword ? "text" : "password"} value={formData.password} onChange={handleChange} placeholder="Mínimo 8 caracteres" required minLength={8}/>
                <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="dentist-confirmPassword">Confirmar Contraseña</Label>
              <div className="relative">
                <Input name="confirmPassword" type={showConfirmPassword ? "text" : "password"} value={formData.confirmPassword} onChange={handleChange} placeholder="Repite tu contraseña" required />
                <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </div>
          <Button type="submit" className="w-full text-lg py-3 shadow-lg" disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Finalizar Registro
          </Button>
        </form>
      );
    };

    export default DentistRegistrationForm;