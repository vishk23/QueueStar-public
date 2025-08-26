import React from 'react';
import Link from 'next/link';
import { ButtonProps } from './Button.types';
import { getButtonClasses } from './Button.utils';

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  asLink = false,
  href,
  onClick,
  className = '',
  ...props
}) => {
  const buttonClasses = getButtonClasses({ variant, size, loading, className });

  if (asLink && href) {
    return (
      <Link href={href} className={buttonClasses}>
        {loading ? (
          <span className="loading loading-spinner loading-sm"></span>
        ) : (
          children
        )}
      </Link>
    );
  }

  return (
    <button
      className={buttonClasses}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading ? (
        <span className="loading loading-spinner loading-sm"></span>
      ) : (
        children
      )}
    </button>
  );
};