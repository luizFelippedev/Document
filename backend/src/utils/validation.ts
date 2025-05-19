// Funções utilitárias para validação

// Verificar se string é um email válido
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/;
  return emailRegex.test(email);
};

// Verificar se string é um URL válido
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
};

// Verificar se string é uma data válida
export const isValidDate = (dateString: string): boolean => {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
};

// Sanitizar string contra XSS
export const sanitizeString = (str: string): string => {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

// Validar tamanho de arquivo (em bytes)
export const isValidFileSize = (size: number, maxSize: number): boolean => {
  return size <= maxSize;
};

// Validar extensão de arquivo
export const isValidFileType = (
  filename: string,
  allowedExtensions: string[]
): boolean => {
  const extension = filename.split('.').pop()?.toLowerCase() || '';
  return allowedExtensions.includes(extension);
};

// Validar senha (pelo menos 8 caracteres, incluindo letras, números e caracteres especiais)
export const isStrongPassword = (password: string): boolean => {
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

// Validar CPF (Brasil)
export const isValidCPF = (cpf: string): boolean => {
  cpf = cpf.replace(/[^\d]/g, '');
  
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) {
    return false;
  }
  
  let sum = 0;
  let remainder;
  
  for (let i = 1; i <= 9; i++) {
    sum += parseInt(cpf.substring(i - 1, i)) * (11 - i);
  }
  
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) {
    remainder = 0;
  }
  
  if (remainder !== parseInt(cpf.substring(9, 10))) {
    return false;
  }
  
  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(cpf.substring(i - 1, i)) * (12 - i);
  }
  
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) {
    remainder = 0;
  }
  
  if (remainder !== parseInt(cpf.substring(10, 11))) {
    return false;
  }
  
  return true;
};