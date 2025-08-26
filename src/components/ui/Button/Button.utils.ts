import { ButtonProps } from './Button.types';

export const getButtonClasses = ({ 
  variant = 'primary', 
  size = 'md', 
  loading = false, 
  className = '' 
}: Pick<ButtonProps, 'variant' | 'size' | 'loading' | 'className'>) => {
  const baseClasses = 'btn transition-all duration-200 hover:scale-105 active:scale-95';
  const variantClasses = `btn-${variant}`;
  const sizeClasses = `btn-${size}`;
  const loadingClasses = loading ? 'loading' : '';
  
  return [baseClasses, variantClasses, sizeClasses, loadingClasses, className]
    .filter(Boolean)
    .join(' ');
};