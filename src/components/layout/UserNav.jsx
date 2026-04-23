import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useUser } from '@/contexts/UserContext';
import { useToast } from '@/components/ui/use-toast';
import { useSupportChat } from '@/contexts/SupportChatContext';
import { User, LogOut, LayoutDashboard, Home, MessageSquare, Loader2 } from 'lucide-react';
import { storageManager } from '@/lib/storageManager';

export function UserNav() {
  const { user, signOut } = useAuth();
  const { profile, clearUser } = useUser();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { openChat } = useSupportChat();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleSignOut = async (e) => {
    e.preventDefault();
    if (isLoggingOut) return;
    
    setIsLoggingOut(true);
    try {
      console.log('[UserNav] Inciando proceso de cierre de sesión...');
      
      // Async call to robust signOut in AuthContext
      await signOut();
      
      // Clear Local User Context
      clearUser();
      
      // Double check clearing local storage
      storageManager.clearSessionData();
      
      // Immediate redirect to login
      navigate('/login', { replace: true });
      
      toast({
        title: 'Sesión cerrada',
        description: 'Has cerrado sesión exitosamente.',
      });
      console.log('[UserNav] Cierre de sesión exitoso.');
    } catch (error) {
      console.warn('[UserNav] Error capturado durante el logout:', error);
      
      // Fallback: Ensure clearing state and redirecting even if an unexpected error leaks
      clearUser();
      storageManager.clearSessionData();
      navigate('/login', { replace: true });
      
      // Determine error type and show appropriate message
      let errorTitle = 'Error al cerrar sesión';
      let errorDescription = 'Hubo un problema, pero tu sesión se cerró localmente.';
      
      if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
        errorTitle = 'Sin conexión';
        errorDescription = 'No hay conexión a internet, pero tu sesión se cerró localmente.';
      } else if (error.status === 403 || error.message?.includes('403')) {
        errorTitle = 'Sesión expirada';
        errorDescription = 'Tu sesión ya había expirado, pero se cerró correctamente.';
      }
      
      toast({
        title: errorTitle,
        description: errorDescription,
        variant: 'destructive',
      });
    } finally {
      setIsLoggingOut(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    const names = name.split(' ');
    return names.map((n) => n[0]).join('').toUpperCase();
  };

  const getDashboardLink = () => {
    if (!profile) return '/';
    switch (profile.role) {
      case 'clinic_host':
        return '/clinic-dashboard';
      case 'admin':
        return '/admin-dashboard';
      case 'support':
        return '/support-dashboard';
      default:
        return '/';
    }
  };

  // Only render if we have valid user and profile, and we aren't completely logged out
  if (!user || !profile) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full focus-visible:ring-2">
          <Avatar className="h-10 w-10 transition-opacity hover:opacity-80">
            <AvatarImage src={profile.avatar_url} alt={profile.full_name || 'Usuario'} />
            <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
              {getInitials(profile.full_name)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none truncate" title={profile.full_name}>
              {profile.full_name}
            </p>
            <p className="text-xs leading-none text-muted-foreground truncate" title={user.email}>
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link to="/profile" className="cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              <span>Perfil</span>
            </Link>
          </DropdownMenuItem>
          {profile.role !== 'dentist' && (
            <DropdownMenuItem asChild>
              <Link to={getDashboardLink()} className="cursor-pointer">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                <span>Mi Panel</span>
              </Link>
            </DropdownMenuItem>
          )}
          {profile.role === 'dentist' && (
            <DropdownMenuItem asChild>
              <Link to="/become-host" className="cursor-pointer">
                <Home className="mr-2 h-4 w-4" />
                <span>Ser Anfitrión</span>
              </Link>
            </DropdownMenuItem>
          )}
           <DropdownMenuItem onClick={openChat} className="cursor-pointer">
              <MessageSquare className="mr-2 h-4 w-4" />
              <span>Soporte</span>
            </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={handleSignOut} 
          disabled={isLoggingOut}
          className="text-destructive focus:text-destructive cursor-pointer"
        >
          {isLoggingOut ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <LogOut className="mr-2 h-4 w-4" />
          )}
          <span>{isLoggingOut ? 'Cerrando...' : 'Cerrar sesión'}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}