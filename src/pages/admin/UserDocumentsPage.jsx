import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, ArrowLeft, User, FileText, Download, AlertTriangle, BadgeCheck, Eye } from 'lucide-react';
import DocumentValidationActions from '@/components/admin/DocumentValidationActions';
import { Badge } from '@/components/ui/badge';
import { sanitizeFileName } from '@/lib/utils';

const documentTypeLabels = {
  'id_document': 'Cédula o Documento de Identidad',
  'professional_title': 'Título Profesional',
  'exequatur': 'Exequatur',
  'dental_college_certificate': 'Certificado Colegio de Odontólogos',
  'liability_insurance': 'Seguro de Responsabilidad Profesional',
};

const UserDocumentsPage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [user, setUser] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(null);
  const [viewing, setViewing] = useState(null);

  const fetchUserData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError) throw userError;
      setUser(userData);

      const { data: docData, error: docError } = await supabase
        .from('dentist_documents')
        .select('*')
        .eq('user_id', userId);

      if (docError) throw docError;
      setDocuments(docData);

    } catch (err) {
      setError(err.message);
      toast({
        variant: 'destructive',
        title: 'Error al cargar datos',
        description: 'No se pudieron cargar los datos del usuario y sus documentos.',
      });
    } finally {
      setLoading(false);
    }
  }, [userId, toast]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);
  
  const getFilePathFromUrl = (url) => {
    try {
      const urlObject = new URL(url);
      return urlObject.pathname.split('/dentist_documents/').pop();
    } catch (e) {
      return null;
    }
  };

  const handleDownload = async (doc) => {
    setDownloading(doc.id);
    try {
      const filePath = getFilePathFromUrl(doc.file_url);
      if (!filePath) throw new Error("URL de archivo inválida.");
      
      const { data, error } = await supabase
        .storage
        .from('dentist_documents')
        .download(filePath);

      if (error) throw error;

      const blob = new Blob([data], { type: data.type });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = sanitizeFileName(doc.file_url.split('/').pop());
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Error al descargar',
        description: 'No se pudo descargar el archivo. ' + err.message,
      });
    } finally {
      setDownloading(null);
    }
  };
  
  const handleView = async (doc) => {
    setViewing(doc.id);
    try {
      const filePath = getFilePathFromUrl(doc.file_url);
      if (!filePath) throw new Error("URL de archivo inválida.");
      
      const { data, error } = await supabase
        .storage
        .from('dentist_documents')
        .createSignedUrl(filePath, 60); // URL válida por 60 segundos

      if (error) throw error;
      
      window.open(data.signedUrl, '_blank');

    } catch(err) {
        toast({
        variant: 'destructive',
        title: 'Error al visualizar',
        description: 'No se pudo generar la vista previa del archivo. ' + err.message,
      });
    } finally {
      setViewing(null);
    }
  };


  const handleValidationComplete = () => {
    fetchUserData();
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'verified':
        return <Badge variant="success" className="text-sm"><BadgeCheck className="mr-2 h-4 w-4"/>Verificado</Badge>;
      case 'pending_review':
        return <Badge variant="warning" className="text-sm"><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Pendiente</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="text-sm"><AlertTriangle className="mr-2 h-4 w-4"/>Rechazado</Badge>;
      default:
        return <Badge variant="outline" className="text-sm">{status}</Badge>;
    }
  };


  if (loading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (error) {
    return <div className="text-red-500 text-center p-4">{error}</div>;
  }

  return (
    <div className="container mx-auto py-10">
      <div className="mb-6">
        <Button variant="outline" onClick={() => navigate('/admin/users')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a Gestión de Usuarios
        </Button>
      </div>

      {user && (
        <Card className="mb-8 glassmorphism">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center text-2xl">
                <User className="mr-3 h-8 w-8 text-primary" />
                Validación de Documentos
              </CardTitle>
              <CardDescription>
                Revisa y valida los documentos de <strong>{user.full_name}</strong> ({user.email}).
              </CardDescription>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-muted-foreground mb-1">Estado General</p>
              {getStatusBadge(user.documentation_status)}
            </div>
          </CardHeader>
        </Card>
      )}

      {documents.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {documents.map((doc) => (
            <Card key={doc.id} className="flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <FileText className="mr-2 h-5 w-5" />
                  {documentTypeLabels[doc.document_type] || doc.document_type}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-grow flex flex-col justify-between">
                <div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleView(doc)} disabled={viewing === doc.id}>
                      {viewing === doc.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <Eye className="mr-2 h-4 w-4" />}
                      Ver Documento
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDownload(doc)} disabled={downloading === doc.id}>
                      {downloading === doc.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <Download className="mr-2 h-4 w-4" />}
                      Descargar
                    </Button>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t">
                  <DocumentValidationActions 
                    document={doc} 
                    userId={userId}
                    onActionComplete={handleValidationComplete} 
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Este usuario no ha subido ningún documento aún.</p>
        </div>
      )}
    </div>
  );
};

export default UserDocumentsPage;