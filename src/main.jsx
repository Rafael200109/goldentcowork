
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import App from '@/App.jsx';
import '@/index.css';
import 'leaflet/dist/leaflet.css';
import { AppProviders } from '@/contexts/AppProviders.jsx';
import { logSupabaseDebugInfo } from '@/lib/supabaseValidator';

// Log Supabase debug info on startup (development only)
if (import.meta.env.DEV) {
  logSupabaseDebugInfo();
}

// Register Service Worker for Image Caching Strategy
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(
      (registration) => {
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
      },
      (err) => {
        console.log('ServiceWorker registration failed: ', err);
      }
    );
  });
}

// Mobile Debugging Setup
if (import.meta.env.DEV) {
  console.log('[MOBILE-DEBUG] Application mounting...');
  console.log('[MOBILE-DEBUG] Viewport:', {
    width: window.innerWidth,
    height: window.innerHeight,
    userAgent: navigator.userAgent,
    pixelRatio: window.devicePixelRatio,
    fillAvailable: window.getComputedStyle(document.documentElement).getPropertyValue('height')
  });

  window.addEventListener('resize', () => {
    console.log('[MOBILE-DEBUG] Resize:', window.innerWidth, 'x', window.innerHeight);
  });
}

if (window.location.search.includes('debug_css=true')) {
  document.body.classList.add('debug-mobile');
}

// Global error handler for Supabase-related errors
window.addEventListener('error', (event) => {
  if (event.message?.includes('supabase') || event.message?.includes('Supabase')) {
    console.error('🚨 [Global Error Handler] Supabase-related error detected:', event);
  }
});

window.addEventListener('unhandledrejection', (event) => {
  if (event.reason?.message?.includes('supabase') || event.reason?.message?.includes('Supabase')) {
    console.error('🚨 [Global Error Handler] Unhandled Supabase promise rejection:', event.reason);
  }
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <>
    <Router>
      <AppProviders>
        <App />
      </AppProviders>
    </Router>
  </>
);
