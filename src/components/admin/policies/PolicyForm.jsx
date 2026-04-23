import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import RichTextEditor from '@/components/ui/RichTextEditor';
import { Loader2 } from 'lucide-react';

const PolicyForm = ({ initialData, onSubmit, onCancel, isLoading }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        content: '',
        order: 0
    });
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (initialData) {
            setFormData({
                title: initialData.title || '',
                description: initialData.description || '',
                content: initialData.content || '',
                order: initialData.order || 0
            });
        }
    }, [initialData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'order' ? parseInt(value) || 0 : value
        }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleContentChange = (content) => {
        setFormData(prev => ({ ...prev, content }));
        if (errors.content) {
            setErrors(prev => ({ ...prev, content: '' }));
        }
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.title.trim()) newErrors.title = 'El título es requerido';
        if (!formData.description.trim()) newErrors.description = 'La descripción es requerida';
        if (!formData.content || formData.content === '<p></p>') newErrors.content = 'El contenido es requerido';
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validateForm()) {
            onSubmit(formData);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="title">Título</Label>
                <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="Ej. Política de Privacidad"
                    className={errors.title ? "border-destructive focus-visible:ring-destructive" : ""}
                />
                {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
            </div>

            <div className="space-y-2">
                <Label htmlFor="description">Descripción Corta</Label>
                <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Breve resumen de la política..."
                    className={errors.description ? "border-destructive focus-visible:ring-destructive" : ""}
                />
                {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
            </div>

            <div className="space-y-2">
                <Label htmlFor="content">Contenido Completo</Label>
                <div className={errors.content ? "border border-destructive rounded-md p-1" : ""}>
                    <RichTextEditor
                        value={formData.content}
                        onChange={handleContentChange}
                        placeholder="Escribe el contenido detallado de la política aquí..."
                        maxLength={50000}
                    />
                </div>
                {errors.content && <p className="text-sm text-destructive">{errors.content}</p>}
            </div>

            <div className="space-y-2">
                <Label htmlFor="order">Orden de Visualización (Opcional)</Label>
                <Input
                    id="order"
                    name="order"
                    type="number"
                    value={formData.order}
                    onChange={handleChange}
                    placeholder="0"
                />
            </div>

            <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
                    Cancelar
                </Button>
                <Button type="submit" disabled={isLoading}>
                    {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Guardar Política
                </Button>
            </div>
        </form>
    );
};

export default PolicyForm;