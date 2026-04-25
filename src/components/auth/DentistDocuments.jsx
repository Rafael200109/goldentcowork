import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { supabaseClient } from '@/config/supabaseConfig';
import { Loader2, Upload, CheckCircle, AlertCircle, X, FileText, ShieldCheck, BadgeCheck, Replace } from 'lucide-react';
import { sanitizeFileName } from '@/lib/utils';
import { motion } from 'framer-motion';

const documentTypes = [
  { id: 'id_document', label: 'Cédula o Documento de Identidad', required: true, bucketKey: 'id_document_url' },
  { id: 'professional_title', label: 'Título Profesional', required: true, bucketKey: 'professional_title_document_url' },
  { id: 'exequatur', label: 'Exequatur', required: true, bucketKey: 'exequatur_document_url' },
  { id: 'dental_college_certificate', label: 'Certificado Colegio de Odontólogos', required: true, bucketKey: 'dental_college_certificate_url' },
  { id: 'liability_insurance', label: 'Seguro de Responsabilidad Profesional', required: false, bucketKey: 'liability_insurance_url' },
];

const FileUploadRow = ({ docType, file, onFileSelect, onClear, onUpload, uploading, uploadedDoc, onUpdateRequest }) => {
  const [isUpdating, setIsUpdating] = useState(false);

  const getStatusInfo = () => {
    if (!uploadedDoc) return { icon: null, text: '', color: '' };
    switch (uploadedDoc.status) {
      case 'approved':
        return { icon: <CheckCircle className="h-5 w-5 text-green-500" />, text: 'Aprobado', color: 'text-green-500' };
      case 'pending_review':
        return { icon: <FileText className="h-5 w-5 text-yellow-500" />, text: 'En Revisión', color: 'text-yellow-500' };
      case 'rejected':
        return { icon: <AlertCircle className="h-5 w-5 text-red-500" />, text: `Rechazado: ${uploadedDoc.rejection_reason || 'Sin motivo'}`, color: 'text-red-500' };
      default:
        return { icon: null, text: '', color: '' };
    }
  };
  const statusInfo = getStatusInfo();

  const handleUpdateClick = () => {
    setIsUpdating(true);
    onUpdateRequest(docType.id);
  };

  const handleCancelUpdate = () => {
    setIsUpdating(false);
    onClear(docType.id);
  };

  const handleFileUpload = (e) => {
    onFileSelect(docType.id, e.target.files[0]);
  };

  const handleUploadClick = () => {
    onUpload(docType.id);
    setIsUpdating(false);
  };

  return (
    <motion.div 
      className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center py-4 border-b last:border-b-0 border-border rounded-md"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div>
        <Label htmlFor={docType.id} className="font-medium flex items-center">
          {docType.label}
          {uploadedDoc?.status === 'approved' && <CheckCircle className="h-4 w-4 text-green-500 ml-2" />}
        </Label>
        {!docType.required && <span className="text-xs text-muted-foreground ml-2">(Opcional)</span>}
      </div>
      
      <div className="flex items-center gap-2">
        {uploadedDoc && !isUpdating ? (
          <div className="flex items-center gap-2 text-sm text-primary truncate">
            <FileText className="h-5 w-5 flex-shrink-0" />
            <span className="truncate" title={sanitizeFileName(uploadedDoc.file_url.split('/').pop())}>
              {sanitizeFileName(uploadedDoc.file_url.split('/').pop(), 20)}
            </span>
          </div>
        ) : (
          <>
            <Input
              id={docType.id}
              type="file"
              accept=".pdf,image/*"
              onChange={handleFileUpload}
              className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer rounded-md"
              disabled={uploading}
            />
            {file && (
              <Button variant="ghost" size="icon" onClick={isUpdating ? handleCancelUpdate : () => onClear(docType.id)} className="h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            )}
          </>
        )}
      </div>

      <div className="flex items-center justify-end gap-2">
        {statusInfo.icon && !isUpdating && (
            <div className={`flex items-center gap-1 text-sm ${statusInfo.color}`} title={statusInfo.text}>
              {statusInfo.icon} 
              <span className="hidden sm:inline truncate">{statusInfo.text.split(':')[0]}</span>
            </div>
        )}
        {uploadedDoc && !isUpdating && (
          <Button variant="outline" size="sm" onClick={handleUpdateClick} className="rounded-md">
            <Replace className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        )}
        {(!uploadedDoc || isUpdating) && (
          <Button
            size="sm"
            onClick={handleUploadClick}
            disabled={!file || uploading}
            className="rounded-md"
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            <span className="ml-2 hidden sm:inline">{isUpdating ? 'Reemplazar' : 'Subir'}</span>
          </Button>
        )}
      </div>
    </motion.div>
  );
};

const DentistDocuments = ({ user, onUploadComplete }) => {
  const { toast } = useToast();
  const [files, setFiles] = useState({});
  const [uploading, setUploading] = useState({});
  const [uploadedDocuments, setUploadedDocuments] = useState({});
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(null);

  const fetchUploadedDocuments = useCallback(async () => {
    if (!user) return;
    setLoadingDocs(true);
    
    // Fetch specific documents
    const { data: docsData, error: docsError } = await supabase
      .from('dentist_documents')
      .select('*')
      .eq('user_id', user.id);

    if (docsError) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudieron cargar tus documentos subidos.',
      });
    } else {
      const docsMap = docsData.reduce((acc, doc) => {
        acc[doc.document_type] = doc;
        return acc;
      }, {});
      setUploadedDocuments(docsMap);
    }

    // Fetch user profile status for the main button
    const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('documentation_status')
        .eq('id', user.id)
        .single();
    
    if (!profileError && profileData) {
        setCurrentStatus(profileData.documentation_status);
    }

    setLoadingDocs(false);
  }, [user, toast]);

  useEffect(() => {
    fetchUploadedDocuments();
  }, [fetchUploadedDocuments]);
  
  const allRequiredDocsUploaded = useMemo(() => {
    return documentTypes
      .filter(dt => dt.required)
      .every(dt => !!uploadedDocuments[dt.id]);
  }, [uploadedDocuments]);

  // Calculate if the button should be disabled
  const isSubmissionDisabled = useMemo(() => {
    // Must have uploaded all required docs
    if (!allRequiredDocsUploaded) return true;
    // Cannot submit if already submitting
    if (isSubmitting) return true;
    
    // If status is 'approved' or 'pending_review', disable it unless they specifically need to re-trigger (which is rare here)
    // Usually, once pending review, you wait. Once approved, you are done.
    if (currentStatus === 'approved' || currentStatus === 'pending_review') {
        return true;
    }

    return false;
  }, [allRequiredDocsUploaded, isSubmitting, currentStatus]);


  const handleFileSelect = (docId, file) => {
    setFiles((prev) => ({ ...prev, [docId]: file }));
  };

  const handleClearFile = (docId) => {
    setFiles((prev) => {
      const newFiles = { ...prev };
      delete newFiles[docId];
      return newFiles;
    });
    const input = document.getElementById(docId);
    if (input) input.value = '';
  };

  const handleUpload = async (docId) => {
    const file = files[docId];
    if (!file || !user) return;

    setUploading((prev) => ({ ...prev, [docId]: true }));

    try {
      const docType = documentTypes.find(d => d.id === docId);
      if (!docType) throw new Error("Tipo de documento inválido");
      
      const fileName = sanitizeFileName(file.name);
      const filePath = `${user.id}/${docType.id}_${Date.now()}_${fileName}`;

      const { error: uploadError } = await supabaseClient.storage
        .from('dentist_documents')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabaseClient.storage
        .from('dentist_documents')
        .getPublicUrl(filePath);
      
      if (!publicUrlData.publicUrl) {
        throw new Error("No se pudo obtener la URL pública del archivo.");
      }

      const { error: dbError } = await supabase
        .from('dentist_documents')
        .upsert({
          user_id: user.id,
          document_type: docId,
          file_url: publicUrlData.publicUrl,
          status: 'pending_review',
          uploaded_at: new Date().toISOString(),
          rejection_reason: null,
          reviewed_at: null,
        }, { onConflict: 'user_id,document_type' });

      if (dbError) throw dbError;
      
      const { error: profileUpdateError } = await supabase
        .from('profiles')
        .update({ 
          [docType.bucketKey]: publicUrlData.publicUrl,
          // If we are uploading a new doc, maybe we should set status back to something like 'incomplete' or allow re-submission?
          // For now, let's just upload. The user hits "Finalizar" to set status to pending_review.
        })
        .eq('id', user.id);

      if (profileUpdateError) throw profileUpdateError;


      toast({
        title: '¡Éxito!',
        description: `El documento "${docType.label}" se ha subido y está en revisión.`,
      });
      handleClearFile(docId);
      await fetchUploadedDocuments();

    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error al subir el archivo',
        description: error.message,
      });
    } finally {
      setUploading((prev) => ({ ...prev, [docId]: false }));
    }
  };

  const handleFinishUploads = async () => {
    if (isSubmissionDisabled || !user) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ documentation_status: 'pending_review' })
        .eq('id', user.id);

      if (error) throw error;
      
      // Update local state to reflect change immediately
      setCurrentStatus('pending_review');

      toast({
        title: '¡Documentos enviados!',
        description: 'Tus documentos han sido enviados para revisión.',
      });

      if(onUploadComplete) {
        onUploadComplete();
      }

    } catch(error) {
       toast({
        variant: 'destructive',
        title: 'Error al finalizar',
        description: 'No se pudo actualizar tu estado. ' + error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <Card className="mt-6 border border-border bg-card rounded-lg">
      <CardHeader>
        <CardTitle className="flex items-center"><ShieldCheck className="mr-2 text-primary"/> Documentos Profesionales</CardTitle>
        <CardDescription>
          Sube tus documentos para que podamos verificar tu perfil. Una vez aprobados, podrás acceder a todas las funcionalidades.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loadingDocs ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-2">
            {documentTypes.map((docType) => (
              <FileUploadRow
                key={docType.id}
                docType={docType}
                file={files[docType.id]}
                onFileSelect={handleFileSelect}
                onClear={handleClearFile}
                onUpload={handleUpload}
                uploading={uploading[docType.id]}
                uploadedDoc={uploadedDocuments[docType.id]}
                onUpdateRequest={handleClearFile}
              />
            ))}
          </div>
        )}
        {onUploadComplete && (
            <div className="mt-8 flex justify-end flex-col items-end gap-2">
                <Button 
                    onClick={handleFinishUploads}
                    disabled={isSubmissionDisabled}
                    className="rounded-md"
                >
                    {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <BadgeCheck className="h-4 w-4 mr-2"/> }
                    {currentStatus === 'pending_review' 
                        ? 'Documentos en Revisión' 
                        : currentStatus === 'approved' 
                            ? 'Documentación Aprobada' 
                            : 'Finalizar y Enviar a Revisión'
                    }
                </Button>
                {currentStatus === 'pending_review' && (
                    <p className="text-xs text-muted-foreground text-right max-w-xs">
                        Ya has enviado tus documentos. Si necesitas hacer cambios, actualiza los archivos individualmente.
                    </p>
                )}
                {currentStatus === 'approved' && (
                    <p className="text-xs text-green-600 font-medium text-right max-w-xs">
                        ¡Tu perfil está verificado!
                    </p>
                )}
            </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DentistDocuments;