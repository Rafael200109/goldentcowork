import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Minus, Plus } from 'lucide-react';

const DurationSelector = ({ id, value, onChange, min = 1, max = 12 }) => {
  const handleIncrement = () => {
    onChange(Math.min(max, value + 1));
  };

  const handleDecrement = () => {
    onChange(Math.max(min, value - 1));
  };

  const handleInputChange = (e) => {
    const newValue = parseInt(e.target.value, 10);
    if (!isNaN(newValue)) {
      onChange(Math.max(min, Math.min(max, newValue)));
    } else if (e.target.value === '') {
      onChange(min);
    }
  };

  return (
    <div className="space-y-2">
      <div className="relative flex items-center justify-center">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-10 w-10 rounded-full"
          onClick={handleDecrement}
          disabled={value <= min}
        >
          <Minus className="h-4 w-4" />
        </Button>
        <div className="text-center w-24">
            <p className="font-bold text-lg">{value}</p>
            <p className="text-xs text-muted-foreground">{value === 1 ? "Hora" : "Horas"}</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-10 w-10 rounded-full"
          onClick={handleIncrement}
          disabled={value >= max}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      
    </div>
  );
};

export default DurationSelector;