export const APPROVED_BANKS = [
  'Banco Popular Dominicano',
  'Banco de Reservas (Banreservas)',
  'Scotiabank',
  'Banco BHD',
  'Asociación Popular de Ahorros y Préstamos (APAP)',
  'Banco Promerica',
  'Banco Santa Cruz',
  'Banco Caribe',
  'Citibank',
  'Qik Banco Digital'
];

export const validateBankName = (name) => {
  if (!name) return 'El banco es requerido';
  if (!APPROVED_BANKS.includes(name)) return 'Banco no admitido en nuestra red';
  return null;
};

export const validateAccountNumber = (number) => {
  if (!number) return 'El número de cuenta es requerido';
  if (!/^\d{8,20}$/.test(number)) return 'El número debe contener entre 8 y 20 dígitos numéricos';
  return null;
};

export const validateAccountHolder = (name) => {
  if (!name) return 'El nombre del titular es requerido';
  if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{3,100}$/.test(name)) return 'Use solo letras y espacios (3 a 100 caracteres)';
  return null;
};

export const validateAccountType = (type) => {
  if (!type) return 'El tipo de cuenta es requerido';
  if (!['checking', 'savings'].includes(type)) return 'Tipo de cuenta inválido';
  return null;
};

export const validateDocumentType = (type) => {
  if (type && !['cedula', 'passport', 'rnc'].includes(type)) return 'Tipo de documento inválido';
  return null;
};

export const validateDocumentNumber = (number, type) => {
  if (!number) return null; // Optional field initially
  if (type === 'cedula' && !/^\d{11}$/.test(number.replace(/-/g, ''))) return 'La cédula debe tener 11 dígitos';
  if (type === 'rnc' && !/^\d{9,11}$/.test(number.replace(/-/g, ''))) return 'El RNC debe tener 9 u 11 dígitos';
  return null;
};