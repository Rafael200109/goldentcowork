import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useUser } from '@/contexts/UserContext';
import { Loader2 } from 'lucide-react';

const AuthRedirector = () => {
  // Task 2: Use cachedUser for immediate decision making
  const { user, cachedUser, loading: authLoading } = useAuth();
  const { profile, loadingProfile } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const attemptedRedirect = useRef(false);
  const [showRedirectingSpinner, setShowRedirectingSpinner] = useState(false);

  // Dashboards by role
  const roleDashboards = {
    admin: '/admin-dashboard',
    clinic_host: '/clinic-dashboard',
    dentist: '/search-clinics',
    support: '/support-dashboard',
    default: '/profile',
  };

  const logRedirect = (msg, data) => {
    if (import.meta.env.DEV) {
       console.log(`[AuthRedirector] ${new Date().toISOString()} - ${msg}`, data || '');
    }
  };

  useEffect(() => {
    // 1. Identify if we are on an Auth Page
    const authPages = ['/login', '/register', '/forgot-password', '/awaiting-verification'];
    const isAuthPage = authPages.includes(location.pathname);

    // 2. If not on auth page, reset redirect flag
    if (!isAuthPage) {
        if (attemptedRedirect.current) {
            attemptedRedirect.current = false;
        }
        return;
    }

    // 3. Task 2: Check cache OR real user to determine if we should redirect
    // We prioritize the profile if loaded, but fallback to cachedUser to speed up mobile perception
    const effectiveUser = profile || cachedUser;
    
    // Only use cachedUser if it has a role property (essential for routing)
    const hasValidIdentity = effectiveUser && effectiveUser.role;

    // Log the decision factors
    logRedirect('Checking Redirect', { 
        hasValidIdentity, 
        role: effectiveUser?.role, 
        source: profile ? 'Profile (DB)' : cachedUser ? 'Cache (Local)' : 'None' 
    });

    if (hasValidIdentity) {
      if (attemptedRedirect.current) return;

      const targetDashboard = roleDashboards[effectiveUser.role] || roleDashboards.default;
      
      // Prevent loops
      if (location.pathname === targetDashboard) return;

      logRedirect(`Redirecting immediately to ${targetDashboard}`);
      
      attemptedRedirect.current = true;
      setShowRedirectingSpinner(true);
      
      // Immediate redirect using cache - don't wait for "stabilization" if we have cache
      navigate(targetDashboard, { replace: true });
    }
  }, [user, cachedUser, profile, navigate, location.pathname]);

  if (showRedirectingSpinner) {
      return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
             <Loader2 className="h-10 w-10 animate-spin text-primary mb-2" />
             <p className="text-sm font-medium text-muted-foreground">Redirigiendo a tu espacio...</p>
        </div>
      );
  }

  return null;
};

export default AuthRedirector;