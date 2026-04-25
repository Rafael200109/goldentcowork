import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useUser } from '@/contexts/UserContext';
import { Loader2 } from 'lucide-react';
import { supabaseClient } from '@/config/supabaseConfig';
import { storageManager } from '@/lib/storageManager';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading: authLoading } = useAuth();
  const { profile, loadingProfile } = useUser();
  const [isSessionValidating, setIsSessionValidating] = useState(true);
  const [sessionValid, setSessionValid] = useState(true);
  const location = useLocation();

  useEffect(() => {
    let mounted = true;
    
    const validateSession = async () => {
      try {
        // Only run deep validation if we think we have a user
        if (!user && !authLoading) {
          if (mounted) {
            setSessionValid(false);
            setIsSessionValidating(false);
          }
          return;
        }

        const { data, error } = await supabaseClient.auth.getSession();
        
        if (mounted) {
          if (error || !data.session) {
            if (error && (error.status === 403 || error.message?.includes('403'))) {
              console.warn('[ProtectedRoute] 403 Forbidden: Session invalid or expired.');
            }
            // Clear local data if session is invalid
            storageManager.clearSessionData();
            setSessionValid(false);
          } else {
            setSessionValid(true);
          }
          setIsSessionValidating(false);
        }
      } catch (err) {
        console.warn('[ProtectedRoute] Session validation error:', err);
        if (mounted) {
          storageManager.clearSessionData();
          setSessionValid(false);
          setIsSessionValidating(false);
        }
      }
    };

    if (!authLoading) {
      validateSession();
    }

    return () => {
      mounted = false;
    };
  }, [user, authLoading, location.pathname]);

  const isLoading = authLoading || loadingProfile || isSessionValidating;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] w-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Redirect to login if user object is missing or session validation failed
  if (!user || !sessionValid) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (allowedRoles && (!profile || !allowedRoles.includes(profile.role))) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;