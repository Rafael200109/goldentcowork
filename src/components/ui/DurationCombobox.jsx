import React, { useState, useEffect } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useToast } from "@/components/ui/use-toast";

const predefinedDurations = [4, 5, 6, 7, 8, 9, 10, 11, 12];

export function DurationCombobox({ value, onChange, minHours = 4, maxHours = 12 }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const durationOptions = predefinedDurations
    .filter(d => d >= minHours && d <= maxHours)
    .map(d => ({ value: d, label: `${d} horas` }));

  useEffect(() => {
    const numericValue = Number(value);
    if (value === null || isNaN(numericValue) || numericValue < minHours || numericValue > maxHours) {
      if (value !== null) { 
        onChange(Math.max(minHours, Math.min(maxHours, numericValue || minHours)));
      }
    }
  }, [value, minHours, maxHours, onChange]);


  const handleSelect = (currentSelectionValue) => {
    setOpen(false);
    const numericValue = Number(currentSelectionValue);
    if (numericValue >= minHours && numericValue <= maxHours) {
      onChange(numericValue);
    } else {
      const adjustedValue = Math.max(minHours, Math.min(maxHours, numericValue));
      onChange(adjustedValue);
      toast({ title: "Duración Ajustada", description: `La duración se ajustó a ${adjustedValue} horas.`, variant: "default" });
    }
  };

  const displayLabel = () => {
    const numericValue = Number(value);
    const selectedOption = durationOptions.find((opt) => opt.value === numericValue);
    if (selectedOption) return selectedOption.label;
    if (value !== null && !isNaN(numericValue) && numericValue >= minHours && numericValue <= maxHours) {
      return `${numericValue} horas`;
    }
    return "Seleccionar...";
  };
  
  return (
    <div className="flex flex-col space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full sm:w-[200px] justify-between"
          >
            {displayLabel()}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full sm:w-[200px] p-0">
          <Command>
            <CommandInput placeholder="Buscar duración..." />
            <CommandList>
              <CommandEmpty>No se encontró la duración.</CommandEmpty>
              <CommandGroup>
                {durationOptions.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.label} 
                    onSelect={() => handleSelect(option.value)}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        Number(value) === option.value ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    {option.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}