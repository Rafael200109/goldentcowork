import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import DashboardView from '@/components/admin/financials/DashboardView';
import PayoutsFlow from '@/components/admin/financials/PayoutsFlow';
import PayoutBatchDetails from '@/components/admin/financials/PayoutBatchDetails';

const FinancialDashboardPage = () => {
    const [view, setView] = useState('dashboard'); // 'dashboard', 'payouts', 'batchDetails'
    const [currentBatchId, setCurrentBatchId] = useState(null);

    const handleNavigateToNewPayout = useCallback(() => {
        setView('payouts');
    }, []);

    const handleNavigateToBatchDetails = useCallback((batchId) => {
        setCurrentBatchId(batchId);
        setView('batchDetails');
    }, []);

    const handleBackToDashboard = useCallback(() => {
        setView('dashboard');
        setCurrentBatchId(null);
    }, []);

    const renderContent = () => {
        switch (view) {
            case 'payouts':
                return <PayoutsFlow onBack={handleBackToDashboard} onBatchCreated={handleNavigateToBatchDetails} />;
            case 'batchDetails':
                return <PayoutBatchDetails batchId={currentBatchId} onBack={handleBackToDashboard} />;
            case 'dashboard':
            default:
                return <DashboardView onNavigateToNewPayout={handleNavigateToNewPayout} onNavigateToBatchDetails={handleNavigateToBatchDetails} />;
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
        >
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold gradient-text">Gestión Financiera</h1>
                    <p className="text-muted-foreground">Supervisa, gestiona y liquida las finanzas de la plataforma.</p>
                </div>
            </div>
            
            {renderContent()}

        </motion.div>
    );
};

export default FinancialDashboardPage;