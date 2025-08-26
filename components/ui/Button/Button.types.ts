import { ButtonVariant, ButtonSize } from '@/types/ui';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  asLink?: boolean;
  href?: string;
  className?: string;
}