import React from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LogIn, UserPlus, Menu, Heart } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useUser } from '@/contexts/UserContext';
import { UserNav } from '@/components/layout/UserNav';
import { NotificationsPanel } from '@/components/layout/NotificationsPanel';
import { useFavoriteClinic } from '@/hooks/useFavoriteClinic';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose
} from "@/components/ui/sheet";

const NavItem = ({ to, children }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `transition-colors hover:text-primary ${isActive ? 'text-primary font-semibold' : 'text-muted-foreground'}`
    }
  >
    {children}
  </NavLink>
);

const MobileNavItem = ({ to, children, onNavigate }) => (
  <SheetClose asChild>
    <NavLink
      to={to}
      onClick={onNavigate}
      className={({ isActive }) =>
        `block py-2 text-lg transition-colors hover:text-primary ${isActive ? 'text-primary font-semibold' : 'text-muted-foreground'}`
      }
    >
      {children}
    </NavLink>
  </SheetClose>
);

const Navbar = () => {
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { profile } = useUser();
  const { favoriteCount } = useFavoriteClinic();
  const location = useLocation();

  React.useEffect(() => {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', 'light');
    document.body.style.fontFamily = "'Montserrat', sans-serif";
  }, []);

  const renderNavLinks = () => {
    const commonLinks = (
      <>
        <NavItem to="/search-clinics">Ver Clínicas</NavItem>
        <NavItem to="/policies">Políticas</NavItem>
      </>
    );

    if (!profile) return (
      <>
        {commonLinks}
        <NavItem to="/register-clinic-host">Ser Anfitrión</NavItem>
      </>
    );

    switch (profile.role) {
      case 'dentist':
        return (
          <>
            {commonLinks}
            <NavItem to="/my-bookings">Mis Reservas</NavItem>
          </>
        );
      case 'clinic_host':
        return (
          <>
            {commonLinks}
            <NavItem to="/clinic-dashboard">Mi Panel</NavItem>
          </>
        );
      case 'admin':
        return (
          <>
            {commonLinks}
            <NavItem to="/admin-dashboard">Panel Admin</NavItem>
            <NavItem to="/support-dashboard">Soporte</NavItem>
            <NavItem to="/dev-progress">Progreso</NavItem>
          </>
        );
      case 'support':
        return (
          <>
            {commonLinks}
            <NavItem to="/support-dashboard">Panel Soporte</NavItem>
          </>
        );
      default:
        return (
          <>
            {commonLinks}
            <NavItem to="/register-clinic-host">Ser Anfitrión</NavItem>
          </>
        );
    }
  };

  const renderMobileNavLinks = () => {
    const commonLinks = (
        <>
            <MobileNavItem to="/search-clinics" onNavigate={() => setIsSheetOpen(false)}>Ver Clínicas</MobileNavItem>
            <MobileNavItem to="/policies" onNavigate={() => setIsSheetOpen(false)}>Políticas</MobileNavItem>
        </>
    );
    
     const favoritesLink = user && (
        <MobileNavItem to="/favorite-clinics" onNavigate={() => setIsSheetOpen(false)}>
            Favoritos ({favoriteCount})
        </MobileNavItem>
     );

     if (!profile) return (
      <>
        {commonLinks}
        <MobileNavItem to="/register-clinic-host" onNavigate={() => setIsSheetOpen(false)}>Ser Anfitrión</MobileNavItem>
      </>
    );

    switch (profile.role) {
      case 'dentist':
        return (
          <>
            {commonLinks}
            {favoritesLink}
             <MobileNavItem to="/my-bookings" onNavigate={() => setIsSheetOpen(false)}>Mis Reservas</MobileNavItem>
             <MobileNavItem to="/support" onNavigate={() => setIsSheetOpen(false)}>Soporte</MobileNavItem>
          </>
        );
      case 'clinic_host':
        return (
          <>
            {commonLinks}
            {favoritesLink}
            <MobileNavItem to="/clinic-dashboard" onNavigate={() => setIsSheetOpen(false)}>Mi Panel</MobileNavItem>
          </>
        );
      case 'admin':
        return (
          <>
            {commonLinks}
            {favoritesLink}
            <MobileNavItem to="/admin-dashboard" onNavigate={() => setIsSheetOpen(false)}>Panel Admin</MobileNavItem>
            <MobileNavItem to="/support-dashboard" onNavigate={() => setIsSheetOpen(false)}>Soporte</MobileNavItem>
            <MobileNavItem to="/dev-progress" onNavigate={() => setIsSheetOpen(false)}>Progreso</MobileNavItem>
          </>
        );
      case 'support':
        return (
          <>
            {commonLinks}
            <MobileNavItem to="/support-dashboard" onNavigate={() => setIsSheetOpen(false)}>Panel Soporte</MobileNavItem>
          </>
        );
      default:
        return (
          <>
            {commonLinks}
            {favoritesLink}
            <MobileNavItem to="/register-clinic-host" onNavigate={() => setIsSheetOpen(false)}>Ser Anfitrión</MobileNavItem>
          </>
        );
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex items-center justify-between h-16 max-w-screen-2xl px-4 sm:px-6">
        <div className="flex items-center">
          <Link to="/" className="flex items-center space-x-2">
            <span className="font-bold text-lg sm:text-xl gradient-text">Goldent Co Work</span>
          </Link>
        </div>

        <nav className="hidden md:flex flex-1 justify-center items-center space-x-6 text-sm font-medium">
          <NavItem to="/">Inicio</NavItem>
          {renderNavLinks()}
        </nav>

        <div className="flex items-center justify-end space-x-2">
          
          {user ? (
            <div className="flex items-center space-x-3">
              <Link to="/favorite-clinics" className="hidden md:flex relative text-muted-foreground hover:text-primary transition-colors">
                 <Heart className="w-5 h-5" />
                 {favoriteCount > 0 && (
                     <Badge variant="destructive" className="absolute -top-2 -right-2 h-4 w-4 p-0 flex items-center justify-center text-[10px] rounded-full">
                         {favoriteCount}
                     </Badge>
                 )}
              </Link>
              <NotificationsPanel />
              <UserNav />
            </div>
          ) : (
            <div className="hidden md:flex items-center space-x-2">
              <Button variant="outline" size="sm" asChild>
                <Link to="/login"><LogIn className="w-4 h-4 mr-2" /> Iniciar Sesión</Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/register"><UserPlus className="w-4 h-4 mr-2" /> Registrarse</Link>
              </Button>
            </div>
          )}

          <div className="md:hidden">
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Abrir menú</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <nav className="flex flex-col space-y-4 mt-8">
                  <MobileNavItem to="/" onNavigate={() => setIsSheetOpen(false)}>Inicio</MobileNavItem>
                  {renderMobileNavLinks()}
                  
                  <div className="border-t pt-4 space-y-2">
                    {user ? (
                      <div className="flex items-center justify-between">
                         <div className="flex gap-4">
                            <NotificationsPanel />
                            <Link to="/favorite-clinics" onClick={() => setIsSheetOpen(false)} className="relative text-muted-foreground hover:text-primary transition-colors flex items-center">
                                <Heart className="w-5 h-5" />
                                {favoriteCount > 0 && (
                                    <Badge variant="destructive" className="ml-1 h-5 min-w-5 px-1 flex items-center justify-center text-[10px] rounded-full">
                                        {favoriteCount}
                                    </Badge>
                                )}
                            </Link>
                         </div>
                        <UserNav />
                      </div>
                    ) : (
                      <>
                        <SheetClose asChild>
                          <Button variant="outline" className="w-full" asChild>
                            <Link to="/login">Iniciar Sesión</Link>
                          </Button>
                        </SheetClose>
                        <SheetClose asChild>
                          <Button className="w-full" asChild>
                            <Link to="/register">Registrarse</Link>
                          </Button>
                        </SheetClose>
                      </>
                    )}
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;