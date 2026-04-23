import React, { useState } from 'react';
import { useCheckInCheckOut } from '@/hooks/useCheckInCheckOut';
import CheckInStatus from './CheckInStatus';
import CheckInHistory from './CheckInHistory';
import CheckInCheckOutModal from './CheckInCheckOutModal';

const PresenceManager = () => {
  const { 
    activeCheckIn, 
    history, 
    totalHistoryCount, 
    loading, 
    loadingHistory, 
    actionLoading, 
    createCheckIn, 
    createCheckOut, 
    fetchHistory 
  } = useCheckInCheckOut();

  const [modalState, setModalState] = useState({ isOpen: false, mode: 'check_in' });

  const handleOpenCheckIn = () => {
    setModalState({ isOpen: true, mode: 'check_in' });
  };

  const handleOpenCheckOut = () => {
    setModalState({ isOpen: true, mode: 'check_out' });
  };

  const handleCloseModal = () => {
    setModalState({ ...modalState, isOpen: false });
  };

  const handleConfirmAction = async (id, notes) => {
    if (modalState.mode === 'check_in') {
      return await createCheckIn(id, notes); // id is clinic_id
    } else {
      return await createCheckOut(id, notes); // id is check_in_id
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Estado de Presencia</h2>
        <p className="text-muted-foreground">Gestiona tus horarios de llegada y salida de las clínicas.</p>
      </div>

      <CheckInStatus 
        activeCheckIn={activeCheckIn} 
        loading={loading} 
        onOpenCheckIn={handleOpenCheckIn} 
        onOpenCheckOut={handleOpenCheckOut} 
      />

      <CheckInHistory 
        history={history} 
        loading={loadingHistory} 
        totalCount={totalHistoryCount} 
        fetchHistory={fetchHistory} 
      />

      <CheckInCheckOutModal 
        isOpen={modalState.isOpen}
        mode={modalState.mode}
        activeCheckIn={activeCheckIn}
        onClose={handleCloseModal}
        onConfirm={handleConfirmAction}
        actionLoading={actionLoading}
      />
    </div>
  );
};

export default PresenceManager;