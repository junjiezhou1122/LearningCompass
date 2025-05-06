import React from 'react';
import { cn } from '@/lib/utils';

const SPINNER_SIZES = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12',
};

export const Spinner = ({
  size = 'md',
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        'animate-spin rounded-full border-2 border-current border-t-transparent text-primary',
        SPINNER_SIZES[size] || SPINNER_SIZES.md,
        className
      )}
      {...props}
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export default Spinner;
