import React from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { LogOut, Loader2 } from 'lucide-react';

const QuickDashboard = () => {
  const { cachedUser, signOut } = useAuth();
  
  if (!cachedUser) {
    return (
        <div className="min-h-[100dvh] w-full flex items-center justify-center bg-background">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
  }

  const getInitials = (name) => {
      return name ? name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase() : 'U';
  };

  const getRoleLabel = (role) => {
    switch (role) {
        case 'dentist': return 'Odontólogo';
        case 'clinic_host': return 'Anfitrión';
        case 'admin': return 'Admin';
        default: return 'Usuario';
    }
  };

  return (
    // Task 5: Ensures no conflicting styles and proper responsiveness
    <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center p-4">
       <div className="w-full max-w-md space-y-8 text-center animate-in fade-in duration-300">
          <div className="flex justify-center">
            <div className="relative">
                <Avatar className="h-24 w-24 border-4 border-primary/10">
                    <AvatarImage src={cachedUser.avatar_url} />
                    <AvatarFallback className="text-xl bg-primary/5 text-primary">
                        {getInitials(cachedUser.full_name)}
                    </AvatarFallback>
                </Avatar>
                {/* No red circles or black overlays found; green status badge is intentional */}
                <div className="absolute bottom-0 right-0">
                    <span className="flex h-4 w-4 rounded-full bg-green-500 border-2 border-background"></span>
                </div>
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Hola, {cachedUser.full_name.split(' ')[0]}</h1>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground"><span>{cachedUser.email}</span></div>
            <div className="pt-2">
                 <Badge variant="outline" className="px-3 py-1 border-primary/20 text-primary">{getRoleLabel(cachedUser.role)}</Badge>
            </div>
          </div>
          <div className="p-4 rounded-lg bg-muted/50 border border-border/50 text-sm text-muted-foreground">
            <div className="flex items-center justify-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Sincronizando tus datos más recientes...</span>
            </div>
          </div>
          <div className="pt-8">
             <Button variant="ghost" className="text-muted-foreground hover:text-destructive" onClick={signOut}>
                <LogOut className="mr-2 h-4 w-4" /> Cerrar Sesión
             </Button>
          </div>
       </div>
    </div>
  );
};
export default QuickDashboard;