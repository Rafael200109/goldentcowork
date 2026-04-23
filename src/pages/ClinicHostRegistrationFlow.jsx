import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import ClinicHostRegistrationStep1 from '@/components/auth/ClinicHostRegistrationStep1';

const ClinicHostRegistrationFlow = ({ isEmbedded = false, onComplete }) => {
  const FlowContent = (
    <ClinicHostRegistrationStep1 onComplete={onComplete} />
  );

  if (isEmbedded) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {FlowContent}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex items-center justify-center min-h-[calc(100vh-200px)] py-6 md:py-12"
    >
      <Card className="w-full max-w-lg shadow-2xl glassmorphism">
        <CardContent className="p-6 md:p-8">
          {FlowContent}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ClinicHostRegistrationFlow;