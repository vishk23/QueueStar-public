import React from 'react';

export interface LoadingSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  center?: boolean;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  center = false,
  className = '',
}) => {
  const centerClasses = center ? 'flex justify-center items-center min-h-32' : '';
  
  return (
    <div className={`${centerClasses} ${className}`}>
      <span className={`loading loading-spinner loading-${size}`}></span>
    </div>
  );
};