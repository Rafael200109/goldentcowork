import React, { useState, useEffect } from 'react';
import { supabaseClient } from '@/config/supabaseConfig';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, differenceInMinutes } from 'date-fns';
import { es } from 'date-fns/locale';
import { Loader2, LogIn, LogOut, Clock, MapPin } from 'lucide-react';

const CheckInCheckOutModal = ({ isOpen, onClose, mode, activeCheckIn, onConfirm, actionLoading }) => {
  const { user } = useAuth();
  const [clinics, setClinics] = useState([]);
  const [loadingClinics, setLoadingClinics] = useState(false);
  
  const [selectedClinic, setSelectedClinic] = useState('');
  const [notes, setNotes] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    let timer;
    if (isOpen) {
      setCurrentTime(new Date());
      timer = setInterval(() => setCurrentTime(new Date()), 60000);
      setNotes('');
      if (mode === 'check_in') {
        fetchHostClinics();
      }
    }
    return () => clearInterval(timer);
  }, [isOpen, mode]);

  const fetchHostClinics = async () => {
    if (!user) return;
    setLoadingClinics(true);
    try {
      const { data, error } = await supabase
        .from('clinics')
        .select('id, name')
        .eq('host_id', user.id)
        .eq('status', 'published');
        
      if (!error && data) {
        setClinics(data);
        if (data.length === 1) {
          setSelectedClinic(data[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching clinics:', err);
    } finally {
      setLoadingClinics(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (mode === 'check_in' && !selectedClinic) return;
    
    let success = false;
    if (mode === 'check_in') {
      success = await onConfirm(selectedClinic, notes);
    } else {
      success = await onConfirm(activeCheckIn?.id, notes);
    }
    
    if (success) onClose();
  };

  const isCheckIn = mode === 'check_in';
  const duration = !isCheckIn && activeCheckIn 
    ? differenceInMinutes(currentTime, new Date(activeCheckIn.check_in_time)) 
    : 0;

  const formatDuration = (minutes) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins} minutos`;
  };

  const isValid = isCheckIn ? !!selectedClinic && notes.length <= 500 : notes.length <= 500;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isCheckIn ? <LogIn className="text-status-checked-in" /> : <LogOut className="text-destructive" />}
            {isCheckIn ? 'Registrar Llegada' : 'Registrar Salida'}
          </DialogTitle>
          <DialogDescription>
            {isCheckIn 
              ? 'Confirma tu llegada para iniciar tu tiempo de presencia en la clínica.' 
              : 'Confirma tu salida para detener el contador de tiempo.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 py-4">
          
          <div className="bg-muted/50 p-4 rounded-lg flex items-center justify-between border">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Hora Actual</p>
                <p className="text-lg font-bold text-foreground">{format(currentTime, 'h:mm a', { locale: es })}</p>
              </div>
            </div>
            {!isCheckIn && (
              <div className="text-right border-l pl-4 border-border">
                 <p className="text-xs font-medium text-muted-foreground uppercase">Duración</p>
                 <p className="text-lg font-bold text-primary">{formatDuration(duration)}</p>
              </div>
            )}
          </div>

          {isCheckIn && (
            <div className="space-y-2">
              <Label htmlFor="clinic" className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                Clínica <span className="text-destructive">*</span>
              </Label>
              {loadingClinics ? (
                <div className="h-10 w-full bg-muted animate-pulse rounded-md"></div>
              ) : clinics.length > 0 ? (
                <Select value={selectedClinic} onValueChange={setSelectedClinic}>
                  <SelectTrigger id="clinic" className={!selectedClinic ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Selecciona la clínica donde te encuentras" />
                  </SelectTrigger>
                  <SelectContent>
                    {clinics.map(clinic => (
                      <SelectItem key={clinic.id} value={clinic.id}>{clinic.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm text-destructive">No tienes clínicas publicadas disponibles.</p>
              )}
            </div>
          )}

          {!isCheckIn && activeCheckIn && (
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Clínica Actual</Label>
              <p className="font-medium flex items-center gap-2 bg-background border px-3 py-2 rounded-md">
                <MapPin className="w-4 h-4 text-primary" />
                {activeCheckIn.clinic?.name}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Notas (Opcional)</Label>
            <Textarea 
              id="notes" 
              placeholder={isCheckIn ? "¿Alguna observación al llegar?" : "¿Alguna observación al salir?"}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="resize-none"
              rows={3}
              maxLength={500}
            />
            <div className="flex justify-end">
              <span className={`text-xs ${notes.length > 500 ? 'text-destructive' : 'text-muted-foreground'}`}>
                {notes.length}/500
              </span>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={onClose} disabled={actionLoading}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={!isValid || actionLoading || (isCheckIn && clinics.length === 0)}
              variant={isCheckIn ? 'default' : 'destructive'}
              className={isCheckIn ? 'bg-status-checked-in hover:bg-status-checked-in/90' : ''}
            >
              {actionLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isCheckIn ? 'Confirmar Llegada' : 'Confirmar Salida'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CheckInCheckOutModal;