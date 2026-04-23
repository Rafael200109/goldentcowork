import React from 'react';
import { motion } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { Button } from './button';

const TimeSlotGrid = ({ allSlots, availableSlots, selectedSlot, onSlotSelect, disabled, isFetching }) => {
    
    if (disabled) {
        return (
            <div className="flex items-center justify-center h-48 border-2 border-dashed rounded-lg bg-background/50">
                <p className="text-muted-foreground text-sm text-center">
                    Selecciona una fecha para ver los horarios.
                </p>
            </div>
        )
    }
    
    if (isFetching) {
        return (
            <div className="flex items-center justify-center h-48 border-2 border-dashed rounded-lg bg-background/50">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
        )
    }

    if (!availableSlots.length) {
        return (
            <div className="flex items-center justify-center h-48 border-2 border-dashed rounded-lg bg-background/50">
                <p className="text-muted-foreground text-sm text-center">
                    No hay horas disponibles para este día y duración.
                </p>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-3 gap-2">
            {allSlots.map((time, index) => {
                const availableSlot = availableSlots.find(slot => format(parseISO(slot), 'HH:mm') === time);
                const isAvailable = !!availableSlot;
                const isSelected = selectedSlot === availableSlot;

                return (
                    <motion.div
                        key={time}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.03 }}
                    >
                        <Button
                            variant={isSelected ? 'secondary' : 'outline'}
                            className={cn(
                                "w-full transition-all duration-200",
                                !isAvailable && "bg-muted text-muted-foreground/50 border-dashed cursor-not-allowed",
                                isSelected && "ring-2 ring-primary ring-offset-2"
                            )}
                            onClick={() => isAvailable && onSlotSelect(availableSlot)}
                            disabled={!isAvailable}
                        >
                            {format(parseISO(`2000-01-01T${time}:00.000Z`), 'hh:mm a', { locale: es })}
                        </Button>
                    </motion.div>
                );
            })}
        </div>
    );
};

export default TimeSlotGrid;