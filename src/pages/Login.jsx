import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from "@/components/ui/use-toast";
import { Eye, EyeOff, LogIn as LogInIcon, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabaseClient } from '@/config/supabaseConfig';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({ email: '', password: '', form: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { toast } = useToast();
  const { signIn, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  /**
   * LÓGICA DE NAVEGACIÓN BLINDADA
   * Se usa useCallback para evitar recreaciones innecesarias
   */
  const executeNavigation = useCallback(async (userId) => {
    if (!userId) {
      console.warn('executeNavigation: userId es null/undefined');
      return;
    }
    
    console.log('executeNavigation: Iniciando navegación para userId:', userId);
    
    try {
      // 1. Obtener el rol directamente de la base de datos (más confiable que el estado global)
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (profileError || !profile) {
        console.error("executeNavigation: Error obteniendo perfil:", profileError);
        // Fallback: redirigir a home si no se puede obtener el perfil
        navigate('/', { replace: true });
        return;
      }

      console.log('executeNavigation: Perfil obtenido:', profile);

      // 2. Mapeo de rutas por rol
      const routes = {
        'clinic_host': '/clinic-dashboard',
        'admin': '/admin-dashboard',
        'dentist': '/',
        'support': '/support-dashboard'
      };
      
      const destination = routes[profile.role] || '/';
      console.log('executeNavigation: Redirigiendo a:', destination, 'para rol:', profile.role);
      
      // 3. Pequeño respiro para que los Providers de la App se sincronicen
      setTimeout(() => {
        navigate(destination, { replace: true });
      }, 100);

    } catch (err) {
      console.error('executeNavigation: Error inesperado:', err);
      // Fallback seguro
      navigate('/', { replace: true });
    }
  }, [navigate]);

  // Si el usuario ya está autenticado al cargar el componente
  useEffect(() => {
    if (user && !authLoading && !isSubmitting) {
      console.log('Usuario detectado en contexto, ejecutando navegación:', user.id);
      executeNavigation(user.id);
    }
  }, [user, authLoading, executeNavigation, isSubmitting]);

  const validateForm = () => {
    let newErrors = { email: '', password: '', form: '' };
    let valid = true;

    if (!email) {
      newErrors.email = 'El correo es requerido';
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'El formato de correo no es válido';
      valid = false;
    }

    if (!password || password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm() || isSubmitting) return;

    setIsSubmitting(true);
    setErrors(prev => ({ ...prev, form: '' }));
    
    try {
      const { data, error: signInError } = await signIn(email, password);
      
      if (signInError) {
        const errorMsg = signInError.message?.includes('Invalid login credentials') 
          ? 'Correo o contraseña incorrectos. Verifica tus datos.' 
          : 'No se pudo iniciar sesión. Inténtalo más tarde.';

        setErrors(prev => ({ ...prev, form: errorMsg }));
        return;
      }

      if (data?.user) {
        toast({
          title: 'Sesión iniciada',
          description: 'Redirigiendo a tu panel de control...',
        });

        // El contexto ahora actualiza el estado inmediatamente, el useEffect se encargará de la redirección
        // No necesitamos lógica adicional aquí
      }
    } catch (err) {
      setErrors(prev => ({ ...prev, form: 'Error de red inesperado.' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const isGlobalLoading = authLoading || isSubmitting;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="flex items-center justify-center min-h-[80vh] container mx-auto px-4"
    >
      <Card className="w-full max-w-md shadow-2xl glassmorphism border-primary/10 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
        
        <CardHeader className="text-center space-y-1 pb-8">
          <motion.div 
            initial={{ y: -20 }}
            animate={{ y: 0 }}
            className="inline-block p-4 mx-auto rounded-2xl bg-primary/10 text-primary mb-4"
          >
            <LogInIcon className="w-10 h-10" />
          </motion.div>
          <CardTitle className="text-4xl font-extrabold tracking-tight gradient-text">
            Bienvenido
          </CardTitle>
          <CardDescription className="text-base">
            Ingresa tus credenciales de Goldent Co Work
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            <div className="space-y-2">
              <Label htmlFor="email" className="font-medium">Correo Electrónico</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="nombre@empresa.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`h-12 bg-background/50 focus:ring-2 transition-all ${errors.email ? 'border-red-500 ring-red-500/10' : 'border-primary/20'}`}
                disabled={isGlobalLoading}
              />
              {errors.email && <p className="text-xs text-red-500 font-medium">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="password">Contraseña</Label>
                <Link to="/forgot-password" size="sm" className="text-xs text-primary hover:opacity-80 transition-opacity">
                  ¿La olvidaste?
                </Link>
              </div>
              <div className="relative">
                <Input 
                  id="password" 
                  type={showPassword ? "text" : "password"} 
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`h-12 pr-12 bg-background/50 focus:ring-2 transition-all ${errors.password ? 'border-red-500 ring-red-500/10' : 'border-primary/20'}`}
                  disabled={isGlobalLoading}
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-500 font-medium">{errors.password}</p>}
            </div>
            
            <AnimatePresence mode="wait">
              {errors.form && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-4 text-sm text-red-800 bg-red-50 dark:bg-red-900/20 dark:text-red-300 rounded-xl border border-red-100 dark:border-red-800 flex items-center gap-3"
                >
                  <AlertCircle size={18} className="shrink-0" />
                  <span>{errors.form}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <Button 
              type="submit" 
              className="w-full h-12 text-lg font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all active:scale-[0.98]" 
              disabled={isGlobalLoading}
            >
              {isGlobalLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="animate-spin" size={20} />
                  <span>Verificando...</span>
                </div>
              ) : (
                'Iniciar Sesión'
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="bg-muted/30 py-6 border-t border-primary/5 flex justify-center">
          <p className="text-sm text-muted-foreground">
            ¿No tienes cuenta?{' '}
            <Link to="/register" className="font-bold text-primary hover:underline underline-offset-4">
              Crea una aquí
            </Link>
          </p>
        </CardFooter>
      </Card>
    </motion.div>
  );
};