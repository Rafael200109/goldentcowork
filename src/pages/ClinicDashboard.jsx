import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building, Calendar, DollarSign, PlusSquare, Menu, X, SlidersHorizontal, ListChecks, Landmark, Clock } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import MyClinics from '@/components/clinic-dashboard/MyClinics';
import BookingsCalendar from '@/components/clinic-dashboard/BookingsCalendar';
import Financials from '@/components/clinic-dashboard/Financials';
import PublishClinic from '@/components/clinic-dashboard/PublishClinic';
import AvailabilityManager from '@/components/clinic-dashboard/AvailabilityManager';
import ReservationsList from '@/components/clinic-dashboard/ReservationsList';
import BankAccountsManager from '@/components/clinic-dashboard/BankAccountsManager';
import PresenceManager from '@/components/clinic-dashboard/PresenceManager';
import { Loader2 } from 'lucide-react';

const menuItems = [
  { id: 'presence', label: 'Presencia', icon: Clock, component: PresenceManager },
  { id: 'bookings', label: 'Calendario', icon: Calendar, component: BookingsCalendar },
  { id: 'reservations', label: 'Mis Reservas', icon: ListChecks, component: ReservationsList },
  { id: 'availability', label: 'Disponibilidad', icon: SlidersHorizontal, component: AvailabilityManager },
  { id: 'my-clinics', label: 'Mis Clínicas', icon: Building, component: MyClinics },
  { id: 'financials', label: 'Finanzas', icon: DollarSign, component: Financials },
  { id: 'bank-accounts', label: 'Cuentas Bancarias', icon: Landmark, component: BankAccountsManager },
  { id: 'publish', label: 'Publicar Clínica', icon: PlusSquare, component: PublishClinic },
];

export const ClinicDashboard = () => {
  const { profile, loadingProfile } = useUser();
  const [activeTab, setActiveTab] = useState('presence');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const ActiveComponent = menuItems.find(item => item.id === activeTab)?.component || PresenceManager;

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    if (isSidebarOpen) setIsSidebarOpen(false);
  }

  if (loadingProfile) {
    return (
      <div className="flex items-center justify-center flex-grow min-h-[50vh]">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8 flex-grow container max-w-screen-2xl px-4 sm:px-6">
      {/* Mobile Header and Sidebar Toggle */}
      <div className="lg:hidden flex justify-between items-center mb-4">
        <div>
           <h1 className="text-2xl font-bold gradient-text">Panel de Anfitrión</h1>
           <p className="text-muted-foreground text-sm">Bienvenido, {profile?.full_name || profile?.email}.</p>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
          <span className="sr-only">Abrir menú</span>
          {isSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      {/* Sidebar Backdrop for Mobile */}
      <AnimatePresence>
        {isSidebarOpen && (
           <motion.div key="mobile-sidebar-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-30 lg:hidden" onClick={() => setIsSidebarOpen(false)} />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={cn("fixed top-0 left-0 h-full w-72 bg-background/80 backdrop-blur-xl z-40 transform transition-transform duration-300 ease-in-out lg:static lg:w-72 lg:transform-none lg:bg-transparent lg:h-auto flex-shrink-0", isSidebarOpen ? 'translate-x-0' : '-translate-x-full')}>
        <div className="h-full lg:border-r lg:border-border/40 p-6">
          <div className="mb-8 hidden lg:block">
            <h1 className="text-3xl font-bold gradient-text">Panel de Anfitrión</h1>
            <p className="text-muted-foreground text-sm">Bienvenido, {profile?.full_name || profile?.email}.</p>
          </div>
          <nav className="flex flex-col gap-2">
            {menuItems.map((item) => (
              <Button key={item.id} variant={activeTab === item.id ? 'secondary' : 'ghost'} className="justify-start text-base h-12 px-4" onClick={() => handleTabClick(item.id)}>
                <item.icon className="mr-3 h-5 w-5" />
                {item.label}
              </Button>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 w-full pt-4 lg:pt-0">
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
            <ActiveComponent />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

export default ClinicDashboard;