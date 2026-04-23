
import React, { useEffect, useState, Suspense, lazy } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { useSystemConfig } from '@/contexts/SystemConfigContext.jsx';
import { useUser } from '@/contexts/UserContext.jsx';
import { useAuth } from '@/contexts/SupabaseAuthContext.jsx';
import ErrorBoundary from '@/components/ui/ErrorBoundary.jsx';
import MainLayout from '@/layouts/MainLayout.jsx';
import FocusedLayout from '@/layouts/FocusedLayout.jsx';
import { AppProviders } from '@/contexts/AppProviders.jsx';
import { Loader2, AlertTriangle, AlertCircle, RefreshCw } from 'lucide-react';
import LoadingFallback from '@/components/ui/LoadingFallback.jsx';
import { initPerformanceMonitoring } from '@/lib/performanceMonitor';
import { initVitalsMonitoring } from '@/lib/imagePerformanceMonitor';
import { perfMetrics } from '@/lib/performanceMetrics';
import ImageLoadingMonitor from '@/components/ImageLoadingMonitor.jsx';
import { imageCache } from '@/lib/imageCache';
import { isSupabaseConfigured, getSupabaseError } from '@/config/supabaseConfig';
import { validateSupabaseConnection } from '@/lib/supabaseValidator';
import { SupabaseDebugPanel } from '@/components/SupabaseDebugPanel.jsx';
import { Button } from '@/components/ui/button';

// Lazy loaded pages
const Home = lazy(() => import('@/pages/GuestHome.jsx').then(m => ({ default: m.GuestHome })));
const LoggedInHome = lazy(() => import('@/pages/LoggedInHome.jsx').then(m => ({ default: m.LoggedInHome })));
const Login = lazy(() => import('@/pages/Login.jsx').then(m => ({ default: m.Login })));
const Register = lazy(() => import('@/pages/Register.jsx').then(m => ({ default: m.Register })));
const SearchClinics = lazy(() => import('@/pages/SearchClinics.jsx').then(m => ({ default: m.SearchClinics })));
const ClinicBookingPage = lazy(() => import('@/pages/ClinicBookingPage.jsx').then(m => ({ default: m.ClinicBookingPage })));
const ClinicDashboard = lazy(() => import('@/pages/ClinicDashboard.jsx').then(m => ({ default: m.ClinicDashboard })));
const AdminDashboard = lazy(() => import('@/pages/AdminDashboard.jsx'));
const ChatManagementPage = lazy(() => import('@/pages/admin/ChatManagementPage.jsx'));
const SupportDashboard = lazy(() => import('@/pages/SupportDashboard.jsx'));
const MyBookingsPage = lazy(() => import('@/pages/MyBookingsPage.jsx').then(m => ({ default: m.MyBookingsPage })));
const ProfilePage = lazy(() => import('@/pages/ProfilePage.jsx'));
const FavoriteClinicsPage = lazy(() => import('@/pages/FavoriteClinicsPage.jsx'));
const ClinicHostRegistrationFlow = lazy(() => import('@/pages/ClinicHostRegistrationFlow.jsx'));
const PolicyPage = lazy(() => import('@/pages/PolicyPage.jsx'));
const DevProgressPage = lazy(() => import('@/pages/DevProgressPage.jsx'));
const NotificationsPage = lazy(() => import('@/pages/NotificationsPage.jsx').then(m => ({ default: m.NotificationsPage })));
const SupportPage = lazy(() => import('@/pages/SupportPage.jsx'));
const MaintenancePage = lazy(() => import('@/pages/MaintenancePage.jsx'));
const ForgotPasswordPage = lazy(() => import('@/pages/ForgotPassword.jsx'));
const UpdatePasswordPage = lazy(() => import('@/pages/UpdatePassword.jsx'));
const AwaitingVerificationPage = lazy(() => import('@/pages/AwaitingVerificationPage.jsx'));
const BecomeHostPage = lazy(() => import('@/pages/BecomeHostPage.jsx'));
const InvoicePage = lazy(() => import('@/pages/InvoicePage.jsx'));
const EditClinicPage = lazy(() => import('@/pages/clinic/EditClinicPage.jsx'));
const ClinicStatisticsPage = lazy(() => import('@/pages/clinic/ClinicStatisticsPage.jsx'));
const UserManagementPage = lazy(() => import('@/pages/admin/UserManagementPage.jsx'));
const UserDocumentsPage = lazy(() => import('@/pages/admin/UserDocumentsPage.jsx'));
const ClinicValidationPage = lazy(() => import('@/pages/admin/ClinicValidationPage.jsx'));
const ClinicManagementPage = lazy(() => import('@/pages/admin/ClinicManagementPage.jsx'));
const HostRequestValidationPage = lazy(() => import('@/pages/admin/HostRequestValidationPage.jsx'));
const StatisticsDashboard = lazy(() => import('@/pages/admin/StatisticsDashboard.jsx'));
const FinancialDashboardPage = lazy(() => import('@/pages/admin/FinancialDashboardPage.jsx'));
const BookingConfirmationPage = lazy(() => import('@/pages/admin/BookingConfirmationPage.jsx'));
const EmailManagementPage = lazy(() => import('@/pages/admin/EmailManagementPage.jsx'));
const PerformanceDashboard = lazy(() => import('@/pages/admin/PerformanceDashboard.jsx'));
const AdminPoliciesPage = lazy(() => import('@/pages/admin/AdminPoliciesPage.jsx'));
import ProtectedRoute from '@/components/auth/ProtectedRoute.jsx';

// Supabase Configuration Error Component
const SupabaseConfigError = () => {
  const configError = getSupabaseError();
  const [retrying, setRetrying] = useState(false);

  const handleRetry = async () => {
    setRetrying(true);
    const { isConnected } = await validateSupabaseConnection();
    if (isConnected) {
      window.location.reload();
    } else {
      setRetrying(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-red-50 dark:bg-red-950 p-4">
      <div className="max-w-2xl w-full bg-white dark:bg-gray-900 rounded-lg shadow-lg p-8">
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle className="w-8 h-8 text-red-600" />
          <h1 className="text-2xl font-bold text-red-600">
            Supabase Configuration Error
          </h1>
        </div>

        <p className="text-gray-700 dark:text-gray-300 mb-4">
          The application cannot start because Supabase is not properly configured.
        </p>

        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-4 mb-4">
          <h2 className="font-semibold text-red-700 dark:text-red-400 mb-2">Configuration Issues:</h2>
          <ul className="list-disc list-inside space-y-1">
            {configError?.errors?.map((error, index) => (
              <li key={index} className="text-red-600 dark:text-red-400 text-sm">
                {error}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded p-4 mb-4">
          <h2 className="font-semibold text-blue-700 dark:text-blue-400 mb-2">Required Environment Variables:</h2>
          <ul className="list-disc list-inside space-y-1 text-blue-600 dark:text-blue-400 text-sm">
            <li>VITE_SUPABASE_URL</li>
            <li>VITE_SUPABASE_ANON_KEY</li>
          </ul>
        </div>

        <div className="space-y-3">
          <Button
            onClick={handleRetry}
            disabled={retrying}
            className="w-full"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${retrying ? 'animate-spin' : ''}`} />
            {retrying ? 'Retrying...' : 'Retry Connection'}
          </Button>
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
          <strong>For Developers:</strong> Configure these variables in your Horizons/Vercel environment settings and redeploy.
        </p>
      </div>
    </div>
  );
};

const MaintenanceGuard = ({ children }) => {
  const { isMaintenanceActive, loading } = useSystemConfig();
  const { profile, loadingProfile } = useUser();
  const { loading: authLoading, user } = useAuth();
  const location = useLocation();

  const isAppLoading = loading || authLoading || (user !== null && profile === null && loadingProfile);

  if (isAppLoading) {
    return (
      <div className="flex h-[100dvh] w-full items-center justify-center bg-background fixed inset-0 z-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (isMaintenanceActive && (!profile || profile.role !== 'admin') && location.pathname !== '/login') {
    return <Suspense fallback={<LoadingFallback/>}><MaintenancePage /></Suspense>;
  }

  return children;
};

const AppRoutes = () => {
  const location = useLocation();
  const { user } = useAuth();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    if (!user) {
      imageCache.clear();
    }
  }, [user]);

  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route element={<FocusedLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/update-password" element={<UpdatePasswordPage />} />
          <Route path="/awaiting-verification" element={<AwaitingVerificationPage />} />
        </Route>

        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/home" element={<ProtectedRoute><LoggedInHome /></ProtectedRoute>} />
          <Route path="/search-clinics" element={<SearchClinics />} />
          <Route path="/register-clinic-host" element={<ClinicHostRegistrationFlow />} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/policies" element={<PolicyPage />} />
          <Route path="/dev-progress" element={<DevProgressPage />} />
          <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
          <Route path="/support" element={<ProtectedRoute><SupportPage /></ProtectedRoute>} />
          <Route path="/favorite-clinics" element={<ProtectedRoute><FavoriteClinicsPage /></ProtectedRoute>} />

          <Route path="/clinic-dashboard" element={<ProtectedRoute allowedRoles={['clinic_host', 'admin']}><ClinicDashboard /></ProtectedRoute>} />
          <Route path="/clinic-dashboard/edit/:clinicId" element={<ProtectedRoute allowedRoles={['clinic_host', 'admin']}><EditClinicPage /></ProtectedRoute>} />
          <Route path="/clinic-dashboard/statistics/:clinicId" element={<ProtectedRoute allowedRoles={['clinic_host', 'admin']}><ClinicStatisticsPage /></ProtectedRoute>} />
          
          <Route path="/admin-dashboard" element={<ProtectedRoute allowedRoles={['admin', 'accountant']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/chat-management" element={<ProtectedRoute allowedRoles={['admin', 'support']}><ChatManagementPage /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['admin']}><UserManagementPage /></ProtectedRoute>} />
          <Route path="/admin/users/:userId/documents" element={<ProtectedRoute allowedRoles={['admin']}><UserDocumentsPage /></ProtectedRoute>} />
          <Route path="/admin/clinic-validation" element={<ProtectedRoute allowedRoles={['admin']}><ClinicValidationPage /></ProtectedRoute>} />
          <Route path="/admin/clinic-management" element={<ProtectedRoute allowedRoles={['admin']}><ClinicManagementPage /></ProtectedRoute>} />
          <Route path="/admin/host-requests" element={<ProtectedRoute allowedRoles={['admin']}><HostRequestValidationPage /></ProtectedRoute>} />
          <Route path="/admin/statistics" element={<ProtectedRoute allowedRoles={['admin']}><StatisticsDashboard /></ProtectedRoute>} />
          <Route path="/admin/financials" element={<ProtectedRoute allowedRoles={['admin', 'accountant']}><FinancialDashboardPage /></ProtectedRoute>} />
          <Route path="/admin/booking-confirmation" element={<ProtectedRoute allowedRoles={['admin', 'accountant']}><BookingConfirmationPage /></ProtectedRoute>} />
          <Route path="/admin/emails" element={<ProtectedRoute allowedRoles={['admin']}><EmailManagementPage /></ProtectedRoute>} />
          <Route path="/admin/performance" element={<ProtectedRoute allowedRoles={['admin']}><PerformanceDashboard /></ProtectedRoute>} />
          <Route path="/admin/policies" element={<ProtectedRoute allowedRoles={['admin']}><AdminPoliciesPage /></ProtectedRoute>} />

          <Route path="/support-dashboard" element={<ProtectedRoute allowedRoles={['support', 'admin']}><SupportDashboard /></ProtectedRoute>} />

          <Route path="/book-clinic/:clinicId" element={<ProtectedRoute><ClinicBookingPage /></ProtectedRoute>} />
          <Route path="/my-bookings" element={<ProtectedRoute allowedRoles={['dentist', 'admin']}><MyBookingsPage /></ProtectedRoute>} />
          <Route path="/invoice/:bookingId" element={<ProtectedRoute><InvoicePage /></ProtectedRoute>} />
          <Route path="/become-host" element={<ProtectedRoute allowedRoles={['dentist']}><BecomeHostPage /></ProtectedRoute>} />

          <Route path="*" element={<div className="p-8 text-center"><AlertTriangle className="mx-auto w-12 h-12 text-muted-foreground"/><h1 className="text-2xl mt-4">404</h1></div>} />
        </Route>
      </Routes>
    </Suspense>
  );
};

const App = () => {
  const [connectionStatus, setConnectionStatus] = useState({
    configured: false,
    connected: false,
    error: null,
    checking: true
  });

  useEffect(() => {
    initPerformanceMonitoring();
    initVitalsMonitoring();
    perfMetrics.initNetworkDetection();

    // Validate Supabase configuration on mount
    const checkSupabase = async () => {
      if (import.meta.env.DEV) {
        console.log('🔍 [App] Validating Supabase configuration...');
      }

      const configured = isSupabaseConfigured();
      
      if (!configured) {
        const error = getSupabaseError();
        setConnectionStatus({
          configured: false,
          connected: false,
          error: error?.message || 'Supabase not configured',
          checking: false
        });
        return;
      }

      const { isConnected, error } = await validateSupabaseConnection();
      
      setConnectionStatus({
        configured: true,
        connected: isConnected,
        error: error,
        checking: false
      });

      if (import.meta.env.DEV) {
        if (isConnected) {
          console.log('✅ [App] Supabase connection validated successfully');
        } else {
          console.error('❌ [App] Supabase connection failed:', error);
        }
      }
    };

    checkSupabase();
  }, []);

  // Show configuration error if Supabase is not configured
  if (!connectionStatus.checking && !connectionStatus.configured) {
    return <SupabaseConfigError />;
  }

  return (
    <ErrorBoundary>
      <AppProviders>
        <MaintenanceGuard>
          <AppRoutes />
          <ImageLoadingMonitor />
          <SupabaseDebugPanel />
        </MaintenanceGuard>
      </AppProviders>
    </ErrorBoundary>
  );
};

export default App;
