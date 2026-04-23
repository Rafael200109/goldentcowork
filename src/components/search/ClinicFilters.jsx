import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { FiSearch, FiRefreshCcw, FiCalendar } from 'react-icons/fi';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/useDebounce';

const ALL_PROVINCES_VALUE = "all-provinces";
const ALL_MUNICIPIOS_VALUE = "all-municipios";
const ALL_SECTORS_VALUE = "all-sectors";

const ClinicFilters = ({
  searchTerm,
  setSearchTerm,
  selectedProvince,
  setSelectedProvince,
  allProvinces,
  selectedMunicipio,
  setSelectedMunicipio,
  municipiosForSelectedProvince,
  selectedSector,
  setSelectedSector,
  sectorsForSelectedMunicipio,
  priceSort,
  setPriceSort,
  availabilityDate,
  setAvailabilityDate,
  clearFilters
}) => {
  const [localSearch, setLocalSearch] = useState(searchTerm);
  const debouncedSearch = useDebounce(localSearch, 300);

  useEffect(() => {
    setSearchTerm(debouncedSearch);
  }, [debouncedSearch, setSearchTerm]);

  useEffect(() => {
    setLocalSearch(searchTerm);
  }, [searchTerm]);

  return (
    <Card className="p-4 md:p-6 glassmorphism shadow-lg mb-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 items-end">
        <div className="sm:col-span-2 lg:col-span-3 xl:col-span-5">
          <Label htmlFor="search-term" className="text-sm font-medium text-muted-foreground">Buscar por Nombre o Descripción</Label>
          <div className="relative mt-1">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              id="search-term"
              type="text"
              placeholder="Ej: Sonrisa Radiante, Rayos X..."
              className="pl-10 pr-4 py-2 text-base"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
            />
          </div>
        </div>
        
        <div>
          <Label htmlFor="province-select" className="text-sm font-medium text-muted-foreground">Provincia</Label>
          <Select value={selectedProvince} onValueChange={setSelectedProvince}>
            <SelectTrigger id="province-select" className="mt-1 w-full">
              <SelectValue placeholder="Seleccionar provincia" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px] overflow-y-auto">
              <SelectItem value={ALL_PROVINCES_VALUE}>Todas las provincias</SelectItem>
              {allProvinces.map(province => (
                <SelectItem key={province} value={province}>{province}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="municipio-select" className="text-sm font-medium text-muted-foreground">Municipio</Label>
          <Select 
            value={selectedMunicipio} 
            onValueChange={setSelectedMunicipio} 
            disabled={selectedProvince === ALL_PROVINCES_VALUE || municipiosForSelectedProvince.length === 0}
          >
            <SelectTrigger id="municipio-select" className="mt-1 w-full">
              <SelectValue placeholder={selectedProvince !== ALL_PROVINCES_VALUE ? "Seleccionar municipio" : "Primero elija provincia"} />
            </SelectTrigger>
            <SelectContent className="max-h-[300px] overflow-y-auto">
              <SelectItem value={ALL_MUNICIPIOS_VALUE}>Todos los municipios</SelectItem>
              {municipiosForSelectedProvince.map(municipio => (
                <SelectItem key={municipio} value={municipio}>{municipio}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="sector-select" className="text-sm font-medium text-muted-foreground">Sector</Label>
          <Select 
            value={selectedSector} 
            onValueChange={setSelectedSector} 
            disabled={selectedMunicipio === ALL_MUNICIPIOS_VALUE || sectorsForSelectedMunicipio.length === 0}
          >
            <SelectTrigger id="sector-select" className="mt-1 w-full">
              <SelectValue placeholder={selectedMunicipio !== ALL_MUNICIPIOS_VALUE ? "Seleccionar sector" : "Primero elija municipio"} />
            </SelectTrigger>
            <SelectContent className="max-h-[300px] overflow-y-auto">
              <SelectItem value={ALL_SECTORS_VALUE}>Todos los sectores</SelectItem>
              {sectorsForSelectedMunicipio.map(sector => (
                <SelectItem key={sector} value={sector}>{sector}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
            <Label htmlFor="price-sort-select" className="text-sm font-medium text-muted-foreground">Ordenar por Precio</Label>
            <Select value={priceSort} onValueChange={setPriceSort}>
                <SelectTrigger id="price-sort-select" className="mt-1 w-full">
                    <SelectValue placeholder="Ordenar por..." />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="default">Relevancia</SelectItem>
                    <SelectItem value="asc">Menor a mayor precio</SelectItem>
                    <SelectItem value="desc">Mayor a menor precio</SelectItem>
                </SelectContent>
            </Select>
        </div>
        
        <div>
            <Label htmlFor="availability-date" className="text-sm font-medium text-muted-foreground">Disponibilidad</Label>
            <Popover>
                <PopoverTrigger asChild>
                <Button
                    id="availability-date"
                    variant={"outline"}
                    className={cn(
                    "w-full justify-start text-left font-normal mt-1",
                    !availabilityDate && "text-muted-foreground"
                    )}
                >
                    <FiCalendar className="mr-2 h-4 w-4" />
                    {availabilityDate ? format(availabilityDate, "PPP", { locale: es }) : <span>Elige una fecha</span>}
                </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                <Calendar
                    mode="single"
                    selected={availabilityDate}
                    onSelect={setAvailabilityDate}
                    disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))}
                    initialFocus
                />
                </PopoverContent>
            </Popover>
        </div>

        <div className="flex items-end justify-end sm:col-span-2 lg:col-span-3 xl:col-span-5">
          <Button variant="ghost" onClick={clearFilters} className="text-primary hover:text-primary/80 flex items-center w-full md:w-auto mt-1 md:mt-0">
              <FiRefreshCcw className="w-4 h-4 mr-2" />
              Limpiar Filtros
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default ClinicFilters;