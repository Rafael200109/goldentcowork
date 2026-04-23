import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, Wallet } from 'lucide-react';

const icons = {
  volume: <DollarSign className="h-5 w-5 text-muted-foreground" />,
  revenue: <TrendingUp className="h-5 w-5 text-muted-foreground" />,
  pending: <Wallet className="h-5 w-5 text-muted-foreground" />,
};

const StatCard = ({ title, value, description, type }) => (
  <motion.div whileHover={{ y: -5, scale: 1.02 }} transition={{ type: 'spring', stiffness: 300 }}>
    <Card className="glassmorphism border-border/20 hover:border-primary/50 transition-all duration-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {icons[type]}
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold gradient-text">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  </motion.div>
);

export default StatCard;