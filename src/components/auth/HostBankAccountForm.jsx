import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Landmark, User, Hash, CreditCard, FileText } from 'lucide-react';
import { 
  APPROVED_BANKS, 
  validateBankName, 
  validateAccountNumber, 
  validateAccountHolder, 
  validateAccountType, 
  validateDocumentType, 
  validateDocumentNumber 
} from '@/lib/bankAccountValidation';

const HostBankAccountForm = ({ initialData, onSubmit, onCancel, isLoading }) => {
  const [formData, setFormData] = useState({
    bank_name: '',
    account_holder_name: '',
    account_number: '',
    account_type: 'savings',
    document_type: 'cedula',
    document_number: ''
  });

  const [errors, setErrors] = useState({});
  const [isFormValid, setIsFormValid] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        bank_name: initialData.bank_name || '',
        account_holder_name: initialData.account_holder_name || '',
        account_number: initialData.account_number || '',
        account_type: initialData.account_type || 'savings',
        document_type: initialData.document_type || 'cedula',
        document_number: initialData.document_number || ''
      });
    }
  }, [initialData]);

  useEffect(() => {
    // Validate on change
    const newErrors = {
      bank_name: validateBankName(formData.bank_name),
      account_holder_name: validateAccountHolder(formData.account_holder_name),
      account_number: validateAccountNumber(formData.account_number),
      account_type: validateAccountType(formData.account_type),
      document_type: validateDocumentType(formData.document_type),
      document_number: validateDocumentNumber(formData.document_number, formData.document_type)
    };
    
    setErrors(newErrors);
    
    // Check if there are no string errors
    const valid = !Object.values(newErrors).some(err => err !== null);
    setIsFormValid(valid);
  }, [formData]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isFormValid) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="bank_name" className="flex items-center gap-2">
          <Landmark className="w-4 h-4 text-muted-foreground" /> Banco
        </Label>
        <Select value={formData.bank_name} onValueChange={(val) => handleChange('bank_name', val)}>
          <SelectTrigger className={errors.bank_name ? 'border-destructive' : ''}>
            <SelectValue placeholder="Selecciona un banco" />
          </SelectTrigger>
          <SelectContent>
            {APPROVED_BANKS.map(bank => (
              <SelectItem key={bank} value={bank}>{bank}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.bank_name && <p className="text-xs text-destructive">{errors.bank_name}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="account_holder_name" className="flex items-center gap-2">
          <User className="w-4 h-4 text-muted-foreground" /> Titular de la Cuenta
        </Label>
        <Input 
          id="account_holder_name"
          placeholder="Ej. Juan Pérez"
          value={formData.account_holder_name}
          onChange={(e) => handleChange('account_holder_name', e.target.value)}
          className={errors.account_holder_name ? 'border-destructive focus-visible:ring-destructive' : ''}
        />
        {errors.account_holder_name && <p className="text-xs text-destructive">{errors.account_holder_name}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="account_number" className="flex items-center gap-2">
            <Hash className="w-4 h-4 text-muted-foreground" /> Número de Cuenta
          </Label>
          <Input 
            id="account_number"
            placeholder="Ej. 123456789"
            value={formData.account_number}
            onChange={(e) => handleChange('account_number', e.target.value.replace(/\D/g, ''))}
            className={errors.account_number ? 'border-destructive focus-visible:ring-destructive' : ''}
            maxLength={20}
          />
          {errors.account_number && <p className="text-xs text-destructive">{errors.account_number}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="account_type" className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-muted-foreground" /> Tipo de Cuenta
          </Label>
          <Select value={formData.account_type} onValueChange={(val) => handleChange('account_type', val)}>
            <SelectTrigger className={errors.account_type ? 'border-destructive' : ''}>
              <SelectValue placeholder="Tipo de cuenta" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="savings">Ahorros</SelectItem>
              <SelectItem value="checking">Corriente</SelectItem>
            </SelectContent>
          </Select>
          {errors.account_type && <p className="text-xs text-destructive">{errors.account_type}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="document_type" className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-muted-foreground" /> Tipo Documento (Opcional)
          </Label>
          <Select value={formData.document_type} onValueChange={(val) => handleChange('document_type', val)}>
            <SelectTrigger>
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cedula">Cédula</SelectItem>
              <SelectItem value="passport">Pasaporte</SelectItem>
              <SelectItem value="rnc">RNC</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="document_number">Número de Documento</Label>
          <Input 
            id="document_number"
            placeholder="Ej. 40212345678"
            value={formData.document_number}
            onChange={(e) => handleChange('document_number', e.target.value)}
            className={errors.document_number ? 'border-destructive focus-visible:ring-destructive' : ''}
          />
          {errors.document_number && <p className="text-xs text-destructive">{errors.document_number}</p>}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={!isFormValid || isLoading}>
          {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Guardar Cuenta
        </Button>
      </div>
    </form>
  );
};

export default HostBankAccountForm;