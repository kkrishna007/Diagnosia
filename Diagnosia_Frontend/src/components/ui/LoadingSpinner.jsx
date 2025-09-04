import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingSpinner = ({ 
  size = 'md', 
  text = '', 
  centered = false,
  overlay = false,
  className = '' 
}) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
  };

  const spinner = (
    <div className={`flex items-center gap-3 ${centered ? 'justify-center' : ''} ${className}`}>
      <Loader2 className={`${sizes[size]} animate-spin text-primary-600`} />
      {text && (
        <span className={`text-gray-600 ${textSizes[size]}`}>
          {text}
        </span>
      )}
    </div>
  );

  if (overlay) {
    return (
      <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-40">
        {spinner}
      </div>
    );
  }

  if (centered) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        {spinner}
      </div>
    );
  }

  return spinner;
};

export default LoadingSpinner;