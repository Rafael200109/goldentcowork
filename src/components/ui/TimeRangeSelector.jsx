import React from 'react';
    import {
      Select,
      SelectContent,
      SelectItem,
      SelectTrigger,
      SelectValue,
    } from "@/components/ui/select";
    import { Loader2 } from 'lucide-react';
    import { format, parse, differenceInHours } from 'date-fns';
    import { es } from 'date-fns/locale';
    
    const TimeRangeSelector = ({ availableSlots, startTime, setStartTime, endTime, setEndTime, disabled, isFetching, minBookingHours }) => {
    
      const handleStartTimeChange = (value) => {
        setStartTime(value);
        setEndTime(null);
      };
    
      const getFilteredEndTimes = () => {
        if (!startTime) return [];
    
        const allPossibleSlots = Array.from({ length: 15 }, (_, i) => `${String(i + 7).padStart(2, '0')}:00:00`);
    
        const startDateTime = parse(startTime, 'HH:mm:ss', new Date());
        const startIndex = allPossibleSlots.findIndex(slot => slot === startTime);
    
        if (startIndex === -1) return [];
    
        let potentialEndTimes = [];
    
        // Iterate through all possible end slots after the start time
        for (let i = startIndex + 1; i < allPossibleSlots.length; i++) {
          const endSlot = allPossibleSlots[i];
          const endDateTime = parse(endSlot, 'HH:mm:ss', new Date());
          const duration = differenceInHours(endDateTime, startDateTime);
    
          if (duration < minBookingHours) continue;
    
          // Check if all intermediate slots are available
          let allIntermediateSlotsAvailable = true;
          for (let j = startIndex; j < i; j++) {
            const intermediateSlot = allPossibleSlots[j];
            const isSlotAvailable = availableSlots.some(s => s.time_slot === intermediateSlot && s.is_available);
            if (!isSlotAvailable) {
              allIntermediateSlotsAvailable = false;
              break;
            }
          }
    
          if (allIntermediateSlotsAvailable) {
            potentialEndTimes.push(endSlot);
          } else {
            break;
          }
        }
        
        return potentialEndTimes;
      };
    
      if (disabled) {
        return (
          <div className="flex items-center justify-center h-24 border-2 border-dashed rounded-lg bg-background/50">
            <p className="text-muted-foreground text-sm text-center">
              Selecciona una fecha para ver los horarios.
            </p>
          </div>
        );
      }
    
      if (isFetching) {
        return (
          <div className="flex items-center justify-center h-24 border-2 border-dashed rounded-lg bg-background/50">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        );
      }
    
      const startOptions = availableSlots.filter(slot => slot.is_available);
      const endOptions = getFilteredEndTimes();
    
      return (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Select value={startTime || ''} onValueChange={handleStartTimeChange} disabled={startOptions.length === 0}>
              <SelectTrigger>
                <SelectValue placeholder="Inicio" />
              </SelectTrigger>
              <SelectContent>
                {startOptions.length > 0 ? startOptions.map(slot => (
                  <SelectItem key={`start-${slot.time_slot}`} value={slot.time_slot}>
                    {format(parse(slot.time_slot, 'HH:mm:ss', new Date()), 'hh:mm a', { locale: es })}
                  </SelectItem>
                )) : <SelectItem value="disabled" disabled>No hay horas disponibles</SelectItem>}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Select value={endTime || ''} onValueChange={setEndTime} disabled={!startTime || endOptions.length === 0}>
              <SelectTrigger>
                <SelectValue placeholder="Fin" />
              </SelectTrigger>
              <SelectContent>
                {endOptions.length > 0 ? endOptions.map(slot => (
                  <SelectItem key={`end-${slot}`} value={slot}>
                    {format(parse(slot, 'HH:mm:ss', new Date()), 'hh:mm a', { locale: es })}
                  </SelectItem>
                )) : <SelectItem value="disabled" disabled>Selecciona un inicio</SelectItem>}
              </SelectContent>
            </Select>
          </div>
        </div>
      );
    };
    
    export default TimeRangeSelector;