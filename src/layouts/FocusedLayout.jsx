import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const FocusedLayout = () => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.7 }}
      className="flex flex-col min-h-screen bg-gradient-to-br from-background to-blue-50/50 dark:from-background dark:to-blue-900/20 font-sans"
    >
      <header className="py-4 px-4 sm:px-6">
        <Link to="/" className="flex items-center space-x-2 w-fit">
          <img alt="Goldent Co Work Small Logo" className="h-8 w-auto" src="https://storage.googleapis.com/hostinger-horizons-assets-prod/63ef2070-7e9f-47c2-85b6-42a10bded4a0/13b7a79bee570a0a14cc2cb114de4e4d.png" />
          <span className="font-semibold text-lg gradient-text">Goldent Co Work</span>
        </Link>
      </header>
      <main className="flex-grow flex items-center justify-center">
        <Outlet />
      </main>
      <footer className="py-4 text-center">
        <p className="text-xs text-muted-foreground">&copy; {new Date().getFullYear()} Goldent Co Work. Todos los derechos reservados.</p>
      </footer>
    </motion.div>
  );
};

export default FocusedLayout;