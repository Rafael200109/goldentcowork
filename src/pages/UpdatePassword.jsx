import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from "@/components/ui/use-toast.js";
import { KeyRound, Loader2, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient.js';

const UpdatePasswordPage = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    setError('');
    setLoading(true);

    // The user is in a password recovery state, so we can update the password.
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setLoading(false);
      toast({
        title: "Error",
        description: updateError.message || "No se pudo actualizar la contraseña. El enlace puede haber expirado.",
        variant: "destructive",
      });
    } else {
      // IMPORTANT: Sign out to destroy the recovery session
      await supabase.auth.signOut();
      setLoading(false);
      toast({
        title: "¡Éxito!",
        description: "Tu contraseña ha sido actualizada. Ahora puedes iniciar sesión.",
      });
      navigate('/login');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex items-center justify-center py-12 px-4"
    >
      <Card className="w-full max-w-md shadow-2xl glassmorphism">
        <CardHeader className="text-center">
          <div className="inline-block p-3 mx-auto rounded-full bg-primary/20 text-primary mb-4">
            <KeyRound className="w-10 h-10" />
          </div>
          <CardTitle className="text-3xl font-bold gradient-text">Crear Nueva Contraseña</CardTitle>
          <CardDescription>
            Ingresa una nueva contraseña segura para tu cuenta.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Nueva Contraseña</Label>
              <div className="relative">
                <Input 
                  id="password" 
                  type={showPassword ? "text" : "password"} 
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                  className="bg-background/70"
                  disabled={loading}
                />
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmar Contraseña</Label>
              <Input 
                id="confirm-password" 
                type="password" 
                placeholder="••••••••" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required 
                className="bg-background/70"
                disabled={loading}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full text-lg py-6 shadow-lg hover:shadow-primary/50 transition-shadow duration-300" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Actualizando...
                </>
              ) : (
                'Guardar Contraseña'
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
           <Button variant="ghost" asChild>
            <Link to="/login">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a Iniciar Sesión
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export default UpdatePasswordPage;