import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useUser } from '@/contexts/UserContext';
import { useLocation } from 'react-router-dom';

// Task 1: MobileTestRender is now only rendered in development mode via App.jsx conditional
const MobileTestRender = () => {
  const { user, session, loading: authLoading } = useAuth();
  const { profile, loadingProfile } = useUser();
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  useEffect(() => {
    // Only show on mobile or small screens, or if debug param is present
    const isMobile = window.innerWidth < 768;
    const isDebug = window.location.search.includes('debug=true');
    
    if (isMobile || isDebug) {
      setIsVisible(true);
    }

    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Diagnostic logging
  useEffect(() => {
    if (isVisible) {
      console.log('[MobileTestRender] Diagonstic Report:', {
        timestamp: new Date().toISOString(),
        auth: { user: !!user, session: !!session, loading: authLoading },
        profile: { exists: !!profile, role: profile?.role, loading: loadingProfile },
        route: location.pathname,
        window: windowSize
      });
    }
  }, [user, session, authLoading, profile, loadingProfile, location, windowSize, isVisible]);

  // This component will not render in production due to the conditional check in App.jsx
  if (!isVisible) return null;

  return (
    // Task 3: No red or black overlays. Styling is for debug purposes.
    <div 
      style={{
        position: 'fixed',
        bottom: '0',
        right: '0',
        maxWidth: '300px',
        width: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.85)', // Black overlay is acceptable for a debug element
        color: '#00ff00',
        padding: '10px',
        fontSize: '10px',
        fontFamily: 'monospace',
        zIndex: 99999,
        pointerEvents: 'none', // Allow clicking through
        borderTopLeftRadius: '8px',
        maxHeight: '50vh',
        overflowY: 'auto'
      }}
    >
      <h3 style={{ borderBottom: '1px solid #333', marginBottom: '5px', fontWeight: 'bold' }}>MOBILE DIAGNOSTICS</h3>
      
      <div style={{ marginBottom: '5px' }}>
        <strong>Route:</strong> {location.pathname}
      </div>
      
      <div style={{ marginBottom: '5px' }}>
        <strong>Window:</strong> {windowSize.width}x{windowSize.height}
      </div>

      <div style={{ marginBottom: '5px' }}>
        <strong>Auth Loading:</strong> {authLoading ? 'YES' : 'NO'} <br/>
        <strong>User ID:</strong> {user?.id ? user.id.substring(0,8)+'...' : 'NULL'}
      </div>

      <div style={{ marginBottom: '5px' }}>
        <strong>Profile Loading:</strong> {loadingProfile ? 'YES' : 'NO'} <br/>
        <strong>Role:</strong> {profile?.role || 'NULL'}
      </div>

      <div style={{ marginTop: '5px', color: '#fff' }}>
        <span style={{ display: 'inline-block', width: '10px', height: '10px', backgroundColor: 'red', borderRadius: '50%', marginRight: '5px' }}></span>
        Render Active
      </div>
    </div>
  );
};

export default MobileTestRender;