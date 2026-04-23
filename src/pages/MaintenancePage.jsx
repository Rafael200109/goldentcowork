import React from 'react';
import { AlertTriangle, Hammer, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const MaintenancePage = () => {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 p-4">
      <Card className="max-w-md w-full shadow-lg border-t-4 border-t-yellow-500">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
            <Hammer className="w-8 h-8 text-yellow-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">En Mantenimiento</CardTitle>
          <CardDescription className="text-base mt-2">
            Estamos realizando mejoras en nuestra plataforma.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="bg-muted/50 p-4 rounded-lg flex items-start gap-3 text-left">
            <AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">
              Goldent Co Work no está disponible en este momento. Por favor, intenta acceder nuevamente en unos minutos.
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>Tiempo estimado: 30-60 minutos</span>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center pt-2">
           <Button variant="outline" onClick={() => window.location.reload()}>
             Verificar Estado
           </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default MaintenancePage;