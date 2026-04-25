import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from 'lucide-react';
import { supabaseClient } from '@/config/supabaseConfig';
import FileUploadItem from '@/components/auth/FileUploadItem';
import { sanitizeFileName } from '@/lib/utils';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const ClinicHostRegistrationStep2 = ({ onComplete, step1Data }) => {
  const { toast } = useToast();
  const { signUp } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const [rncFile, setRncFile] = useState(null);
  const [rncFileName, setRncFileName] = useState('');
  const [cedulaFile, setCedulaFile] = useState(null);
  const [cedulaFileName, setCedulaFileName] = useState('');

  const handleFileChange = (event, setFile, setName) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({ title: "Archivo Demasiado Grande", description: "Por favor, sube un archivo menor a 5MB.", variant: "destructive" });
        event.target.value = null; 
        return;
      }
      setFile(file);
      setName(file.name);
    }
  };

  const clearFile = (setFile, setName) => {
    setFile(null);
    setName('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (!rncFile || !cedulaFile) {
      toast({ title: "Documentos requeridos", description: "Por favor, sube los dos documentos solicitados.", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    if (!step1Data) {
      toast({ title: "Error de registro", description: "Faltan los datos del paso 1. Por favor, vuelve a empezar.", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    const { email, password, fullName, phone } = step1Data;
    
    try {
      const { data: signUpResponse, error: signUpError } = await signUp(
        email,
        password,
        {
          data: {
            role: 'clinic_host',
            full_name: fullName,
            phone: phone,
            documentation_status: 'pending_documents',
          },
        }
      );

      if (signUpError) throw signUpError;
      if (!signUpResponse || !signUpResponse.user) {
        throw new Error("No se pudo crear el usuario. Es posible que el correo ya esté en uso o haya ocurrido un error.");
      }

      const user = signUpResponse.user;

      const uploadTasks = [
        { file: rncFile, name: `rnc_${user.id}_${sanitizeFileName(rncFile.name)}` },
        { file: cedulaFile, name: `cedula_representante_${user.id}_${sanitizeFileName(cedulaFile.name)}` },
      ];

      const uploadPromises = uploadTasks.map(task => 
        supabaseClient.storage.from('user_documents').upload(`${user.id}/${task.name}`, task.file, { upsert: true })
      );

      const uploadResults = await Promise.all(uploadPromises);

      for (const result of uploadResults) {
        if (result.error) {
          console.error("Error subiendo archivo:", result.error.message);
          throw new Error(`Error al subir el archivo: ${result.error.message}`);
        }
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ documentation_status: 'in_review' })
        .eq('id', user.id);

      if (updateError) throw updateError;
      
      await supabaseClient.auth.signOut();

      if (onComplete) onComplete();

    } catch (error) {
      toast({ title: "Error en el registro", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-primary">Paso 2: Verificación de Documentos</h3>
        <p className="text-muted-foreground mt-1">Sube los documentos de tu clínica para completar el registro.</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-4 border border-dashed rounded-lg bg-accent/50 dark:bg-slate-800/50 space-y-4">
          <FileUploadItem
            id="rncFile"
            label="Registro Nacional de Contribuyente (RNC)"
            onFileChange={(e) => handleFileChange(e, setRncFile, setRncFileName)}
            fileName={rncFileName}
            onClear={() => clearFile(setRncFile, setRncFileName)}
          />
          <FileUploadItem
            id="cedulaFile"
            label="Cédula del Representante Legal"
            onFileChange={(e) => handleFileChange(e, setCedulaFile, setCedulaFileName)}
            fileName={cedulaFileName}
            onClear={() => clearFile(setCedulaFile, setCedulaFileName)}
          />
        </div>
        <Button type="submit" className="w-full text-lg py-3 shadow-lg" disabled={isLoading}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Finalizar Registro
        </Button>
      </form>
    </motion.div>
  );
};

export default ClinicHostRegistrationStep2;