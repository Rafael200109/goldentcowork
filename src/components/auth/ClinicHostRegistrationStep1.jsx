import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Eye, EyeOff, Globe2, Loader2 } from 'lucide-react';
import { customList } from 'country-codes-list';
import { useAuth } from '@/contexts/SupabaseAuthContext.jsx';

const generateCountryCodes = () => {
  const countryData = customList('countryCode', '{countryNameEn} ({countryCode}) +{countryCallingCode}');
  const codes = Object.entries(countryData).map(([code, label]) => {
    const nameMatch = label.match(/^(.*?) \([A-Z]{2}\)/);
    const countryName = nameMatch ? nameMatch[1] : code;
    const callingCodeMatch = label.match(/\+(\d+)/);
    const countryCallingCode = callingCodeMatch ? callingCodeMatch[1] : '';
    
    const flagMatch = customList('countryCode', '{flag}');
    const flag = flagMatch[code] || '';

    return {
      value: `+${countryCallingCode}_${code.toLowerCase()}`,
      label: `${code.toUpperCase()} (+${countryCallingCode})`,
      displayValue: `+${countryCallingCode}`,
      country: countryName,
      icon: flag,
    };
  });

  codes.sort((a, b) => a.country.localeCompare(b.country));
  
  const dominicanRepublic = codes.find(c => c.value === '+1_do');
  if (dominicanRepublic) {
    return [dominicanRepublic, ...codes.filter(c => c.value !== '+1_do')];
  }
  return codes;
};

const ClinicHostRegistrationStep1 = ({ onComplete }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedFullCountryCode, setSelectedFullCountryCode] = useState('+1_do');
  const [phone, setPhone] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { toast } = useToast();
  const { signUp } = useAuth();

  const countryCodes = useMemo(() => generateCountryCodes(), []);

  const handleGoogleSignIn = () => {
    toast({
      title: "🚧 Próximamente",
      description: "El registro con Google estará disponible pronto.",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isLoading) return;

    if (!fullName || !email || !password || !confirmPassword || !phone) {
      toast({ title: "Campos incompletos", description: "Por favor, rellena todos los campos.", variant: "destructive" });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: "Error de Contraseña", description: "Las contraseñas no coinciden.", variant: "destructive" });
      return;
    }
    if (password.length < 8) {
      toast({ title: "Contraseña Débil", description: "La contraseña debe tener al menos 8 caracteres.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    const numericCountryCode = selectedFullCountryCode.split('_')[0];
    const fullPhoneNumber = `${numericCountryCode}${phone}`;
    
    try {
      const { error } = await signUp(
        email,
        password,
        {
          data: {
            role: 'clinic_host',
            full_name: fullName,
            phone: fullPhoneNumber,
            documentation_status: 'pending_documents'
          },
        }
      );

      if (error) {
        throw new Error(error.message || "No se pudo crear el usuario. Es posible que el correo ya esté en uso.");
      }

      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      toast({ title: "Error en el registro", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };
  
  const currentSelectedCountry = countryCodes.find(c => c.value === selectedFullCountryCode);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold gradient-text">Datos del Anfitrión</h1>
        <p className="text-muted-foreground mt-2">¡Te damos la bienvenida a Goldent Co Work!</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="fullName">Nombre Completo del Representante</Label>
          <Input id="fullName" placeholder="Tu nombre y apellidos" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        </div>
        <div>
          <Label htmlFor="email">Correo electrónico</Label>
          <Input id="email" type="email" placeholder="tu@correo.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <Label htmlFor="password">Contraseña</Label>
          <div className="relative">
            <Input id="password" type={showPassword ? "text" : "password"} placeholder="Mínimo 8 caracteres" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
          </div>
        </div>
        <div>
          <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
          <div className="relative">
            <Input id="confirmPassword" type={showConfirmPassword ? "text" : "password"} placeholder="Repite tu contraseña" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
            <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
          </div>
        </div>
        <div>
          <Label htmlFor="phone">Teléfono personal</Label>
          <div className="flex items-stretch space-x-2">
            <Select 
              value={selectedFullCountryCode} 
              onValueChange={setSelectedFullCountryCode}
            >
              <SelectTrigger 
                id="countryCode" 
                className="w-[140px] group px-3 py-2 h-10"
                aria-label="Seleccionar código de país"
              >
                <div className="flex items-center justify-start space-x-2 w-full truncate">
                  {currentSelectedCountry ? (
                    <>
                      <span className="text-lg leading-none">{currentSelectedCountry.icon}</span>
                      <span className="text-sm">{currentSelectedCountry.displayValue}</span>
                    </>
                  ) : (
                    <Globe2 className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                  )}
                </div>
              </SelectTrigger>
              <SelectContent className="max-h-60 overflow-y-auto">
                {countryCodes.map(cc => (
                  <SelectItem key={cc.value} value={cc.value}>
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">{cc.icon}</span>
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{cc.label}</span>
                        <span className="text-xs text-muted-foreground">{cc.country}</span>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input 
              id="phone" 
              type="tel" 
              placeholder="809-000-0000" 
              value={phone} 
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))} 
              required 
              className="flex-1 h-10"
            />
          </div>
        </div>

        <div className="text-xs text-muted-foreground pt-2">
          Al continuar, aceptas nuestra <Link to="/policy/privacy" className="underline hover:text-primary">Política de privacidad</Link>.
        </div>

        <Button type="submit" className="w-full text-lg py-3" disabled={isLoading}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Crear Cuenta de Anfitrión
        </Button>
      </form>
      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">o</span>
        </div>
      </div>
      <Button variant="outline" className="w-full flex items-center justify-center gap-2" onClick={handleGoogleSignIn}>
        <img  className="w-5 h-5" alt="Google logo" src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" />
        Registrarse con Google
      </Button>
    </div>
  );
};

export default ClinicHostRegistrationStep1;