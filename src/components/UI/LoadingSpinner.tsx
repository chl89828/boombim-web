import React from 'react';
import clsx from 'clsx';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'white' | 'gray';
  className?: string;
  text?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'primary',
  className = '',
  text
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const colorClasses = {
    primary: 'border-primary-orange border-t-transparent',
    white: 'border-white border-t-transparent',
    gray: 'border-gray-400 border-t-transparent'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  return (
    <div className={clsx('flex flex-col items-center gap-3', className)}>
      <div
        className={clsx(
          'animate-spin rounded-full border-2',
          sizeClasses[size],
          colorClasses[color]
        )}
        role="status"
        aria-label="로딩 중"
      />
      {text && (
        <div className={clsx('text-gray-600', textSizeClasses[size])}>
          {text}
        </div>
      )}
    </div>
  );
};

export default LoadingSpinner;