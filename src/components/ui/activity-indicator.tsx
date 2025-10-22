import React from 'react';
import { cn } from '@/utils/core';

export type ActivityLevel = 'low' | 'medium' | 'high';

interface ActivityIndicatorProps {
  level: ActivityLevel;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const getActivityColor = (level: ActivityLevel) => {
  switch (level) {
    case 'high':
      return 'bg-red-500 shadow-red-500/50';
    case 'medium':
      return 'bg-yellow-500 shadow-yellow-500/50';
    case 'low':
      return 'bg-green-500 shadow-green-500/50';
    default:
      return 'bg-gray-500 shadow-gray-500/50';
  }
};

const getSizeClasses = (size: 'sm' | 'md' | 'lg') => {
  switch (size) {
    case 'sm':
      return 'w-2 h-2';
    case 'md':
      return 'w-3 h-3';
    case 'lg':
      return 'w-4 h-4';
    default:
      return 'w-3 h-3';
  }
};

export const ActivityIndicator: React.FC<ActivityIndicatorProps> = ({
  level,
  size = 'md',
  className,
}) => {
  const colorClasses = getActivityColor(level);
  const sizeClasses = getSizeClasses(size);

  return (
    <div
      className={cn(
        'rounded-full animate-pulse shadow-lg',
        colorClasses,
        sizeClasses,
        className,
      )}
    />
  );
};
