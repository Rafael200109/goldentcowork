import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Save, Eye, Code } from 'lucide-react';

const EmailTemplateEditor = () => {
  const { toast } = useToast();
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ name: '', subject: '', html_content: '', variables: '[]' });
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  useEffect(() => {
    if (selectedTemplateId) {
      const template = templates.find(t => t.id === selectedTemplateId);
      if (template) {
        setFormData({
          name: template.name,
          subject: template.subject,
          html_content: template.html_content,
          variables: JSON.stringify(template.variables || [], null, 2)
        });
      }
    } else {
        setFormData({ name: '', subject: '', html_content: '', variables: '[]' });
    }
  }, [selectedTemplateId, templates]);

  const fetchTemplates = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('email_templates').select('*').order('name');
    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron cargar las plantillas' });
    } else {
      setTemplates(data);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
        let variablesJson = [];
        try {
            variablesJson = JSON.parse(formData.variables);
        } catch (e) {
            throw new Error("El formato de las variables debe ser un JSON válido.");
        }

        const payload = {
            name: formData.name,
            subject: formData.subject,
            html_content: formData.html_content,
            variables: variablesJson,
            updated_at: new Date()
        };

        let error;
        if (selectedTemplateId) {
            const { error: updateError } = await supabase
                .from('email_templates')
                .update(payload)
                .eq('id', selectedTemplateId);
            error = updateError;
        } else {
            const { error: insertError } = await supabase
                .from('email_templates')
                .insert(payload);
            error = insertError;
        }

        if (error) throw error;

        toast({ title: "Guardado", description: "Plantilla actualizada correctamente." });
        fetchTemplates();
    } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
        setSaving(false);
    }
  };

  const insertVariable = (variable) => {
      setFormData(prev => ({
          ...prev,
          html_content: prev.html_content + ` {{${variable}}} `
      }));
  };

  const availableVariables = formData.variables ? JSON.parse(formData.variables || '[]') : [];

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1 space-y-4">
        <Card>
            <CardHeader>
                <CardTitle>Plantillas</CardTitle>
                <CardDescription>Selecciona una para editar o crear nueva.</CardDescription>
            </CardHeader>
            <CardContent>
                <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                    <SelectTrigger>
                        <SelectValue placeholder="Seleccionar plantilla..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={null}>+ Nueva Plantilla</SelectItem>
                        {templates.map(t => (
                            <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-2">
        <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>{selectedTemplateId ? 'Editar Plantilla' : 'Nueva Plantilla'}</CardTitle>
                    <CardDescription>Diseña el contenido HTML y asunto.</CardDescription>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setPreviewMode(!previewMode)}>
                        {previewMode ? <Code className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                        {previewMode ? 'Editar Código' : 'Vista Previa'}
                    </Button>
                    <Button size="sm" onClick={handleSave} disabled={saving}>
                        {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        <Save className="w-4 h-4 mr-2" /> Guardar
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {!previewMode ? (
                    <>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Nombre Interno (Slug)</Label>
                                <Input 
                                    value={formData.name} 
                                    onChange={e => setFormData({...formData, name: e.target.value})} 
                                    placeholder="ej: welcome_email"
                                    disabled={!!selectedTemplateId} 
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Variables (JSON Array)</Label>
                                <Input 
                                    value={formData.variables} 
                                    onChange={e => setFormData({...formData, variables: e.target.value})} 
                                    placeholder='["name", "date"]'
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Asunto del Correo</Label>
                            <Input 
                                value={formData.subject} 
                                onChange={e => setFormData({...formData, subject: e.target.value})} 
                                placeholder="Asunto visible para el usuario"
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <Label>Contenido HTML</Label>
                                <div className="text-xs text-muted-foreground space-x-2">
                                    <span>Variables disponibles:</span>
                                    {availableVariables.map(v => (
                                        <button 
                                            key={v}
                                            onClick={() => insertVariable(v)}
                                            className="px-1.5 py-0.5 bg-muted rounded hover:bg-muted/80 transition"
                                        >
                                            {`{{${v}}}`}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <Textarea 
                                className="font-mono min-h-[400px] text-sm"
                                value={formData.html_content} 
                                onChange={e => setFormData({...formData, html_content: e.target.value})} 
                            />
                        </div>
                    </>
                ) : (
                    <div className="border rounded-md p-4 min-h-[500px] bg-white text-black overflow-auto">
                        <div className="mb-4 pb-2 border-b">
                            <p className="text-sm text-gray-500">Asunto: <span className="text-black font-medium">{formData.subject}</span></p>
                        </div>
                        <div dangerouslySetInnerHTML={{ __html: formData.html_content }} />
                    </div>
                )}
            </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EmailTemplateEditor;