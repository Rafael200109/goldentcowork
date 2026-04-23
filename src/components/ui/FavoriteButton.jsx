import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFavoriteClinic } from '@/hooks/useFavoriteClinic';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import LoginPromptModal from '@/components/auth/LoginPromptModal';
import { Button } from '@/components/ui/button';

const FavoriteButton = ({ clinicId, className, size = "default" }) => {
  const { user } = useAuth();
  const { isFavorite, toggleFavorite, loading } = useFavoriteClinic(clinicId);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const handleClick = async (e) => {
    e.stopPropagation(); // Prevent card click event
    e.preventDefault();

    if (!user) {
      setShowLoginModal(true);
      return;
    }

    await toggleFavorite();
  };

  const buttonSizeClasses = {
    sm: "w-8 h-8",
    default: "w-10 h-10",
    lg: "w-12 h-12"
  };

  const iconSizeClasses = {
    sm: "w-4 h-4",
    default: "w-5 h-5",
    lg: "w-6 h-6"
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "rounded-full bg-white/70 hover:bg-white backdrop-blur-sm transition-all duration-300 shadow-sm border border-transparent hover:border-border",
          isFavorite && "text-red-500 hover:text-red-600 bg-white border-red-100",
          buttonSizeClasses[size],
          className
        )}
        onClick={handleClick}
        disabled={loading}
      >
        <AnimatePresence mode="wait">
          {loading ? (
             <Loader2 className={cn("animate-spin text-muted-foreground", iconSizeClasses[size])} />
          ) : (
            <motion.div
              key={isFavorite ? 'filled' : 'outline'}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Heart 
                className={cn(
                    iconSizeClasses[size], 
                    isFavorite ? "fill-current" : ""
                )} 
                strokeWidth={2.5}
              />
            </motion.div>
          )}
        </AnimatePresence>
        <span className="sr-only">
            {isFavorite ? "Quitar de favoritos" : "Añadir a favoritos"}
        </span>
      </Button>

      <LoginPromptModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)} 
      />
    </>
  );
};

export default FavoriteButton;