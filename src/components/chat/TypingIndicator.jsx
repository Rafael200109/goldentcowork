import React from 'react';
import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

const TypingIndicator = ({ userName, userAvatar, className }) => {
  const dotVariants = {
    initial: { y: 0 },
    animate: { y: -8 }
  };

  const dotTransition = {
    duration: 0.5,
    repeat: Infinity,
    repeatType: "reverse",
    ease: "easeInOut"
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className={cn("flex gap-3 items-center p-2", className)}
    >
      <Avatar className="w-7 h-7">
        <AvatarImage src={userAvatar} alt={userName} />
        <AvatarFallback className="text-xs">
          {userName?.[0] || '?'}
        </AvatarFallback>
      </Avatar>

      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground font-medium">
          {userName || 'Usuario'} está escribiendo
        </span>
        <div className="flex gap-1 items-center h-4">
          {[0, 1, 2].map((index) => (
            <motion.div
              key={index}
              className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full"
              variants={dotVariants}
              initial="initial"
              animate="animate"
              transition={{
                ...dotTransition,
                delay: index * 0.15
              }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default TypingIndicator;