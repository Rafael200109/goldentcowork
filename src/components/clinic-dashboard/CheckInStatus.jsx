import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, LogIn, LogOut, MapPin } from 'lucide-react';
import { format, differenceInMinutes } from 'date-fns';
import { es } from 'date-fns/locale';

const CheckInStatus = ({ activeCheckIn, loading, onOpenCheckIn, onOpenCheckOut }) => {
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    let interval;
    if (activeCheckIn) {
      // Initial calculation
      setDuration(differenceInMinutes(new Date(), new Date(activeCheckIn.check_in_time)));
      
      // Update every minute
      interval = setInterval(() => {
        setDuration(differenceInMinutes(new Date(), new Date(activeCheckIn.check_in_time)));
      }, 60000);
    } else {
      setDuration(0);
    }
    return () => clearInterval(interval);
  }, [activeCheckIn]);

  const formatDuration = (minutes) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}m`;
  };

  if (loading) {
    return (
      <Card className="glassmorphism animate-pulse">
        <CardContent className="p-6 h-32 flex items-center justify-center">
          <div className="h-6 w-32 bg-muted rounded"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="overflow-hidden border-border/40 shadow-sm hover:shadow-md transition-shadow relative">
        <div className={`absolute top-0 left-0 w-1.5 h-full ${activeCheckIn ? 'bg-status-checked-in' : 'bg-status-checked-out'}`}></div>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                {activeCheckIn ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                    <span className="w-2 h-2 mr-1.5 rounded-full bg-green-500 animate-pulse"></span>
                    Dentro del consultorio
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
                    <span className="w-2 h-2 mr-1.5 rounded-full bg-gray-400"></span>
                    Fuera del consultorio
                  </span>
                )}
              </div>

              {activeCheckIn ? (
                <div>
                  <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary" />
                    {activeCheckIn.clinic?.name || 'Clínica actual'}
                  </h3>
                  <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <LogIn className="w-4 h-4" />
                      Llegada: {format(new Date(activeCheckIn.check_in_time), 'h:mm a', { locale: es })}
                    </div>
                    <div className="flex items-center gap-1 font-medium text-foreground">
                      <Clock className="w-4 h-4 text-primary" />
                      Tiempo transcurrido: {formatDuration(duration)}
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <h3 className="text-lg font-semibold text-muted-foreground">No tienes presencia activa</h3>
                  <p className="text-sm text-muted-foreground mt-1">Registra tu llegada cuando estés en tus instalaciones.</p>
                </div>
              )}
            </div>

            <div className="flex-shrink-0">
              {activeCheckIn ? (
                <Button 
                  size="lg" 
                  variant="destructive" 
                  onClick={onOpenCheckOut}
                  className="w-full md:w-auto shadow-sm group"
                >
                  <LogOut className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
                  Registrar Salida
                </Button>
              ) : (
                <Button 
                  size="lg" 
                  onClick={onOpenCheckIn}
                  className="w-full md:w-auto shadow-sm bg-status-checked-in hover:bg-status-checked-in/90 text-white group"
                >
                  <LogIn className="w-5 h-5 mr-2 group-hover:translate-x-1 transition-transform" />
                  Registrar Llegada
                </Button>
              )}
            </div>

          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default CheckInStatus;