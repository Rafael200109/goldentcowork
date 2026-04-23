import React, { Suspense } from 'react';
import { Outlet, Link } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar.jsx';
import AuthRedirector from '@/components/auth/AuthRedirector.jsx';
import SupportChatWidget from '@/components/support/SupportChatWidget.jsx';
import { useAuth } from '@/contexts/SupabaseAuthContext.jsx';
import { useUser } from '@/contexts/UserContext.jsx';
import { Instagram, Loader2 } from 'lucide-react'; // Only import Instagram

const MainLayout = () => {
  const { user } = useAuth();
  const { profile } = useUser();

  return (
    <div className="flex flex-col min-h-[100dvh] bg-background font-sans">
      <Navbar />
      <AuthRedirector />
      
      {/* 
         Unified content wrapper.
         - Flex grow ensures footer stays at bottom.
         - Container centers content.
         - Responsive padding handles mobile vs desktop spacing.
      */}
      <main className="flex-grow container max-w-screen-2xl mx-auto py-4 sm:py-6 md:py-8 px-4 sm:px-6 relative z-0 flex flex-col">
        <Suspense fallback={
            <div className="flex items-center justify-center flex-grow min-h-[50vh]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        }>
          <Outlet />
        </Suspense>
      </main>

      <footer className="py-8 sm:py-12 mt-auto border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container max-w-screen-2xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
            <div className="flex flex-col items-start max-w-xs">
              <span className="font-semibold text-sm sm:text-base text-foreground mb-2">Goldent Co Work</span>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Conectando odontólogos y clínicas en República Dominicana.
              </p>
            </div>

            <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm text-muted-foreground">
              <Link to="/policies" className="hover:text-primary transition-colors">Términos</Link>
              <Link to="/policies" className="hover:text-primary transition-colors">Privacidad</Link>
              <Link to="/register-clinic-host" className="hover:text-primary transition-colors">Ser Anfitrión</Link>
              <Link to="/support" className="hover:text-primary transition-colors">Soporte</Link>
            </div>

            <div className="flex items-center gap-4">
              {/* Only Instagram icon and link */}
              <a href="https://www.instagram.com/goldentcowork.rd?igsh=bng2MHY0enA0NHo0" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>
          <div className="text-center text-xs sm:text-sm text-muted-foreground mt-8 pt-8 border-t">
            <p>&copy; {new Date().getFullYear()} Goldent Co Work. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
      
      {user && profile && profile.role !== 'admin' && <SupportChatWidget />}
    </div>
  );
};

export default MainLayout;