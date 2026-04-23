import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';

const InfoSection = ({ title, icon, items }) => {
  if (!items || items.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="py-6 border-t"
    >
      <h3 className="text-xl font-semibold mb-4 flex items-center text-primary dark:text-foreground">
        {React.cloneElement(icon, { className: 'w-6 h-6 mr-3' })}
        {title}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
        {items.map((item, index) => (
          <div key={index} className="flex items-center">
            {item.icon && React.cloneElement(item.icon, { className: 'w-5 h-5 mr-3 text-muted-foreground' })}
            <span className="text-foreground">{item.name}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default InfoSection;