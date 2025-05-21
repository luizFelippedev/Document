// components/ui/Button.tsx (exemplo de correção)
import React from 'react';
import { Spinner } from './Spinner';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'link';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean; // Adicionada esta prop
  loadingText?: string; // Adicionada esta prop
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  loadingText,
  children,
  className = '',
  ...props
}) => {
  // Classes base para o botão
  const baseClasses =
    'inline-flex items-center justify-center font-medium rounded focus:outline-none transition-colors';

  // Classes por variante
  const variantClasses = {
    primary:
      'bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
    secondary:
      'bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-2 focus:ring-gray-400 focus:ring-offset-2',
    outline:
      'border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-gray-400 focus:ring-offset-2',
    ghost:
      'text-gray-700 hover:bg-gray-100 focus:ring-2 focus:ring-gray-400 focus:ring-offset-2',
    link: 'text-blue-600 hover:underline focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
  };

  // Classes por tamanho
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-base',
  };

  // Classes para largura completa
  const widthClasses = fullWidth ? 'w-full' : '';

  // Classes para quando o botão está desabilitado
  const disabledClasses = props.disabled ? 'opacity-50 cursor-not-allowed' : '';

  const allClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClasses} ${disabledClasses} ${className}`;

  return (
    <button
      className={allClasses}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && <Spinner className="mr-2" />}
      {loading && loadingText ? loadingText : children}
    </button>
  );
};
