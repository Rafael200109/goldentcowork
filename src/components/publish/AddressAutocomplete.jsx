import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Loader2, MapPin } from 'lucide-react';

const AddressAutocomplete = ({ onAddressSelect, initialAddress = '' }) => {
  const [query, setQuery] = useState(initialAddress);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    setQuery(initialAddress);
  }, [initialAddress]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchAddress = async (searchQuery) => {
    if (!searchQuery || searchQuery.length < 3) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      
      if (apiKey) {
        // Use Google Maps Geocoding API
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(searchQuery)}&key=${apiKey}`
        );
        const data = await response.json();
        
        if (data.status === 'OK') {
          const results = data.results.map(item => ({
            place_id: item.place_id,
            display_name: item.formatted_address,
            lat: item.geometry.location.lat,
            lon: item.geometry.location.lng,
          }));
          setSuggestions(results);
          setIsOpen(true);
        } else {
          setSuggestions([]);
        }
      } else {
        // Fallback to OpenStreetMap Nominatim
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5`
        );
        const data = await response.json();
        const results = data.map(item => ({
          place_id: item.place_id,
          display_name: item.display_name,
          lat: parseFloat(item.lat),
          lon: parseFloat(item.lon),
        }));
        setSuggestions(results);
        setIsOpen(true);
      }
    } catch (err) {
      setError('Error al buscar dirección');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      searchAddress(val);
    }, 500);
  };

  const handleSelect = (suggestion) => {
    setQuery(suggestion.display_name);
    setIsOpen(false);
    
    // Validate coordinates
    const lat = parseFloat(suggestion.lat);
    const lng = parseFloat(suggestion.lon);
    
    if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      onAddressSelect({
        address: suggestion.display_name,
        latitude: lat,
        longitude: lng
      });
    } else {
      setError('Coordenadas inválidas devueltas por el servicio');
    }
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div className="relative">
        <Input
          type="text"
          value={query}
          onChange={handleInputChange}
          placeholder="Busca una dirección o lugar..."
          className="w-full pr-10"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-destructive mt-1">{error}</p>
      )}

      {isOpen && suggestions.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-md max-h-60 overflow-auto">
          {suggestions.map((suggestion) => (
            <li
              key={suggestion.place_id}
              onClick={() => handleSelect(suggestion)}
              className="px-4 py-2 hover:bg-accent hover:text-accent-foreground cursor-pointer flex items-start gap-2 text-sm"
            >
              <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
              <span className="truncate">{suggestion.display_name}</span>
            </li>
          ))}
        </ul>
      )}
      {isOpen && suggestions.length === 0 && !loading && query.length >= 3 && (
        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-md p-4 text-center text-sm text-muted-foreground">
          Dirección no encontrada
        </div>
      )}
    </div>
  );
};

export default AddressAutocomplete;