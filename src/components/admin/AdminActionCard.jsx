import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

const AdminActionCard = ({ icon, title, description, actionText, onClick }) => {
  const cardVariants = {
    rest: { y: 0, boxShadow: '0 4px 6px rgba(0,0,0,0.05)' },
    hover: { y: -5, boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }
  };
  
  return (
    <motion.div
      variants={cardVariants}
      initial="rest"
      whileHover="hover"
      animate="rest"
      transition={{ type: 'spring', stiffness: 300 }}
      className="h-full"
    >
      <Card className="h-full flex flex-col glassmorphism overflow-hidden">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-lg text-primary">
              {React.cloneElement(icon, { className: 'w-6 h-6' })}
            </div>
            <CardTitle className="text-xl">{title}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex-grow">
          <CardDescription>{description}</CardDescription>
        </CardContent>
        <div className="p-6 pt-0 mt-auto">
          <Button className="w-full group" onClick={onClick}>
            {actionText}
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>
      </Card>
    </motion.div>
  );
};

export default AdminActionCard;