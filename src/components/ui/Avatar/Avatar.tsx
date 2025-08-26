import React from 'react';
import { User } from '@/types/auth';

export interface AvatarProps {
  user: User | null;
  size?: 'sm' | 'md' | 'lg';
  showStatus?: boolean;
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  user,
  size = 'md',
  showStatus = false,
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-8',
    md: 'w-12',
    lg: 'w-24',
  };

  return (
    <div className={`avatar ${showStatus ? 'online' : ''} ${className}`}>
      <div className={`${sizeClasses[size]} rounded-full`}>
        {user?.avatarUrl ? (
          <img src={user.avatarUrl} alt={user.displayName} />
        ) : (
          <div className="bg-neutral-focus text-neutral-content flex items-center justify-center">
            {user?.displayName?.charAt(0) || 'U'}
          </div>
        )}
      </div>
    </div>
  );
};