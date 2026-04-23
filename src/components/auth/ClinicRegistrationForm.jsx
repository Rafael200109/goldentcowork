import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea'; 
import { useToast } from "@/components/ui/use-toast";
import { Eye, EyeOff, Camera, Info, UploadCloud, ClipboardList } from 'lucide-react';
import FileUploadItem from '@/components/auth/FileUploadItem';
import { cn } from '@/lib/utils';

const ClinicRegistrationForm = ({ initialEmail = '', initialPassword = '' }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState(initialPassword);
  const [confirmPassword, setConfirmPassword] = useState(initialPassword);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [clinicName, setClinicName] = useState('');
  const [rnc, setRnc] = useState('');
  const [clinicAddress, setClinicAddress] = useState('');
  const [clinicPhone, setClinicPhone] = useState('');

  const [pricePerHour, setPricePerHour] = useState('');
  const [minHours, setMinHours] = useState(4);
  const [minHoursError, setMinHoursError] = useState('');
  
  const [numberOfCubicles, setNumberOfCubicles] = useState(1);
  const [cubiclesError, setCubiclesError] = useState('');
  
  const [mainSpaceDescription, setMainSpaceDescription] = useState('');
  const [clinicPolicies, setClinicPolicies] = useState('');
  const [mainSpacePhoto, setMainSpacePhoto] = useState(null);
  const [mainSpacePhotoName, setMainSpacePhotoName] = useState('');
  const mainSpacePhotoRef = useRef(null);


  const handleFileChange = (event, setFile, setName) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({ title: "Archivo Demasiado grande", description: "Por favor, sube un archivo menor a 5MB.", variant: "destructive" });
        event.target.value = null; 
        return;
      }
      setFile(file);
      setName(file.name);
    }
  };

  const clearFile = (setFile, setName, ref) => {
    setFile(null);
    setName('');
    if (ref && ref.current) {
      ref.current.value = null; 
    }
  };

  const handleMinHoursChange = (e) => {
    let val = e.target.value.replace('-', ''); // Reject negative sign
    setMinHours(val);
    
    if (val === '') {
      setMinHoursError('El mínimo de horas es requerido');
    } else if (Number(val) < 4) {
      setMinHoursError('El mínimo de horas debe ser 4 o mayor');
    } else {
      setMinHoursError('');
    }
  };

  const handleMinHoursBlur = () => {
    if (!minHours || Number(minHours) < 4) {
      setMinHours(4);
      setMinHoursError('');
    }
  };

  const handleCubiclesChange = (e) => {
    const val = e.target.value;
    setNumberOfCubicles(val);

    if (val === '') {
      setCubiclesError('El número de cubículos es requerido');
    } else {
      const num = parseInt(val, 10);
      if (isNaN(num) || num < 1 || num > 100) {
        setCubiclesError('El número de cubículos debe ser un entero entre 1 y 100.');
      } else {
        setCubiclesError('');
      }
    }
  };

  const handleCubiclesBlur = () => {
    const num = parseInt(numberOfCubicles, 10);
    if (isNaN(num) || num < 1) {
      setNumberOfCubicles(1);
      setCubiclesError('');
    } else if (num > 100) {
      setNumberOfCubicles(100);
      setCubiclesError('');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ title: "Error de Contraseña", description: "Las contraseñas no coinciden.", variant: "destructive" });
      return;
    }
     if (!clinicName || !rnc || !clinicAddress || !clinicPhone || !email || !password || !pricePerHour || !minHours || !numberOfCubicles || !mainSpaceDescription) {
      toast({ title: "Campos Incompletos", description: "Por favor, completa todos los campos requeridos de la clínica.", variant: "destructive" });
      return;
    }
    if (password.length < 8) {
      toast({ title: "Contraseña Débil", description: "La contraseña debe tener al menos 8 caracteres.", variant: "destructive" });
      return;
    }
    if (!mainSpacePhoto) {
      toast({ title: "Foto Requerida", description: "Por favor, sube la foto principal del espacio.", variant: "destructive" });
      return;
    }
    if (parseFloat(pricePerHour) <= 0) {
      toast({ title: "Precio Inválido", description: "El precio por hora debe ser mayor a cero.", variant: "destructive" });
      return;
    }
    if (!minHours || parseInt(minHours, 10) < 4) {
      toast({ title: "Horas Mínimas Inválidas", description: "El mínimo de horas debe ser 4 o mayor.", variant: "destructive" });
      setMinHoursError("El mínimo de horas debe ser 4 o mayor");
      return;
    }
    const parsedCubicles = parseInt(numberOfCubicles, 10);
    if (isNaN(parsedCubicles) || parsedCubicles < 1 || parsedCubicles > 100) {
      setCubiclesError('El número de cubículos debe ser un entero entre 1 y 100.');
      return;
    }
    if (clinicPolicies.length > 2000) {
      toast({ title: "Error de validación", description: "Las políticas no deben exceder los 2000 caracteres.", variant: "destructive" });
      return;
    }

    const clinicData = { 
      email, 
      role: 'clinic', 
      clinicName, 
      rnc, 
      clinicAddress, 
      clinicPhone,
      pricePerHour: parseFloat(pricePerHour),
      minHours: parseInt(minHours, 10),
      numberOfCubicles: parsedCubicles,
      mainSpaceDescription,
      clinicPolicies,
      mainSpacePhotoName, 
    };

    localStorage.setItem('clinicRegistration', JSON.stringify(clinicData));
    localStorage.setItem('user', JSON.stringify({ email, role: 'clinic', clinicName }));
    
    if (mainSpacePhoto) {
      localStorage.setItem('mainSpacePhoto_temp', mainSpacePhotoName); 
    }

    toast({ title: "¡Registro Exitoso!", description: "Tu cuenta de clínica ha sido creada (simulado)." });
    navigate('/clinic-dashboard');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-primary border-b pb-2 mb-3">Información General de la Clínica</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="clinicName">Nombre de la Clínica</Label>
            <Input id="clinicName" value={clinicName} onChange={(e) => setClinicName(e.target.value)} placeholder="Ej: Centro Dental Sonrisa Feliz" required />
          </div>
          <div className="space-y-1">
            <Label htmlFor="rnc">RNC</Label>
            <Input id="rnc" value={rnc} onChange={(e) => setRnc(e.target.value)} placeholder="Registro Nacional de Contribuyente" required />
          </div>
          <div className="space-y-1">
            <Label htmlFor="clinic-email">Correo Electrónico de Contacto</Label>
            <Input id="clinic-email" type="email" placeholder="contacto@clinicadental.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-background/70" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="clinicPhone">Teléfono de la Clínica</Label>
            <Input id="clinicPhone" type="tel" value={clinicPhone} onChange={(e) => setClinicPhone(e.target.value)} placeholder="809-000-0000" required />
          </div>
          <div className="md:col-span-2 space-y-1">
            <Label htmlFor="clinicAddress">Dirección de la Clínica</Label>
            <Input id="clinicAddress" value={clinicAddress} onChange={(e) => setClinicAddress(e.target.value)} placeholder="Calle, Número, Sector, Ciudad" required />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-primary border-b pb-2 mb-3">Detalles del Espacio Principal y Precios</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="pricePerHour">Precio por Hora (DOP)</Label>
            <Input id="pricePerHour" type="number" value={pricePerHour} onChange={(e) => setPricePerHour(e.target.value)} placeholder="Ej: 2500" min="1" step="any" required />
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <Info className="w-3 h-3 mr-1"/> Sugerido: 1500 - 5000 DOP. Este es el precio base.
            </p>
          </div>
          <div className="space-y-1">
            <Label htmlFor="minHours" className={minHoursError ? "text-red-500" : ""}>Mínimo de Horas por Reserva</Label>
            <Input 
              id="minHours" 
              type="number" 
              value={minHours} 
              onChange={handleMinHoursChange} 
              onBlur={handleMinHoursBlur}
              placeholder="Ej: 4" 
              min="4" 
              step="1"
              className={minHoursError ? "border-red-500 focus-visible:ring-red-500" : ""}
              required 
            />
            {minHoursError ? (
               <p className="text-xs text-red-500 mt-1">{minHoursError}</p>
            ) : (
               <p className="text-xs text-muted-foreground mt-1">Usualmente entre 4 y 12 horas.</p>
            )}
          </div>
          <div className="md:col-span-2 space-y-1">
            <Label htmlFor="numberOfCubicles" className={cubiclesError ? "text-red-500" : ""}>Número de cubículos de la clínica</Label>
            <Input 
              id="numberOfCubicles" 
              type="number" 
              min="1" 
              max="100" 
              value={numberOfCubicles} 
              onChange={handleCubiclesChange}
              onBlur={handleCubiclesBlur}
              placeholder="Ej: 3" 
              className={cubiclesError ? "border-red-500 focus-visible:ring-red-500" : ""}
              required 
            />
            {cubiclesError ? (
              <p className="text-xs text-red-500 mt-1">{cubiclesError}</p>
            ) : (
              <p className="text-xs text-muted-foreground flex items-center mt-1">
                <Info className="w-3 h-3 mr-1"/> Indica cuántos cubículos tiene tu clínica. Cada cubículo se podrá reservar de manera independiente en la plataforma.
              </p>
            )}
          </div>
        </div>
        <div className="mt-4 space-y-1">
          <Label htmlFor="mainSpaceDescription">Descripción del Espacio Principal</Label>
          <Textarea 
            id="mainSpaceDescription" 
            value={mainSpaceDescription} 
            onChange={(e) => setMainSpaceDescription(e.target.value)} 
            placeholder="Describe tu consultorio principal: equipamiento, ambiente, características destacadas para los odontólogos." 
            rows={3}
            required 
          />
        </div>
        
        <div className="mt-4 space-y-1">
          <Label htmlFor="clinicPolicies" className="flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-primary" /> Políticas y Reglas de la Clínica (Opcional)
          </Label>
          <Textarea 
            id="clinicPolicies" 
            value={clinicPolicies} 
            onChange={(e) => setClinicPolicies(e.target.value)} 
            placeholder="Ej: No se permiten cancelaciones con menos de 24 horas de anticipación. Las sesiones deben ser confirmadas 48 horas antes..." 
            rows={3}
            className={cn("resize-y", clinicPolicies.length > 2000 ? "border-destructive focus-visible:ring-destructive" : "")}
          />
          <div className="flex justify-between mt-1">
            <p className="text-xs text-muted-foreground">
              Describe las políticas y reglas específicas de tu clínica.
            </p>
            <span className={cn("text-xs font-medium", clinicPolicies.length > 2000 ? "text-destructive" : "text-muted-foreground")}>
              {clinicPolicies.length} / 2000
            </span>
          </div>
          {clinicPolicies.length > 2000 && (
            <p className="text-xs text-destructive mt-1">Las políticas no deben exceder los 2000 caracteres.</p>
          )}
        </div>

        <div className="mt-4">
          <Label className="text-base font-medium block mb-2">Foto Principal del Espacio</Label>
          <div className="flex items-center space-x-4 p-4 border border-dashed rounded-lg bg-accent/50 dark:bg-slate-800/50">
            <div className="p-3 bg-primary/10 rounded-full">
              <UploadCloud className="w-8 h-8 text-primary" />
            </div>
            <div className="flex-grow">
              <FileUploadItem
                id="mainSpacePhoto"
                name="mainSpacePhoto"
                label="Sube la mejor foto de tu espacio principal"
                onFileChange={(e) => handleFileChange(e, setMainSpacePhoto, setMainSpacePhotoName)}
                fileName={mainSpacePhotoName}
                onClear={() => clearFile(setMainSpacePhoto, setMainSpacePhotoName, mainSpacePhotoRef)}
              />
              <p className="text-xs text-muted-foreground mt-1">Esta foto se mostrará en los resultados de búsqueda y en la página de reserva.</p>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-primary border-b pb-2 mb-3">Seguridad de la Cuenta</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="clinic-password">Contraseña para la Cuenta</Label>
            <div className="relative">
              <Input id="clinic-password" type={showPassword ? "text" : "password"} placeholder="Mínimo 8 caracteres" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} className="bg-background/70" />
              <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="clinic-confirm-password">Confirmar Contraseña</Label>
            <div className="relative">
              <Input id="clinic-confirm-password" type={showConfirmPassword ? "text" : "password"} placeholder="Repite tu contraseña" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="bg-background/70" />
              <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>
      </div>
      <Button type="submit" disabled={!!minHoursError || !!cubiclesError || clinicPolicies.length > 2000} className="w-full text-lg py-3 shadow-lg mt-6">
        Crear Cuenta de Clínica
      </Button>
    </form>
  );
};

export default ClinicRegistrationForm;