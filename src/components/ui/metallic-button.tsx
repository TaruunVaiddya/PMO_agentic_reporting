import React from 'react';
import { cn } from '@/lib/utils';

interface MetallicButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  isActive?: boolean;
  variant?: 'default' | 'compact';
}

export function MetallicButton({
  children,
  isActive = false,
  variant = 'default',
  className,
  ...props
}: MetallicButtonProps) {
  return (
    <button
      className={cn(
        "flex items-center gap-2 rounded-lg transition-colors font-medium cursor-pointer border",
        variant === 'compact' ? "px-2.5 py-1.5 text-xs gap-1.5" : "px-4 py-2 text-sm",
        isActive
          ? "bg-white/10 text-white border-white/20"
          : "bg-black/10 text-white/70 hover:text-white hover:bg-white/5 border-white/10 hover:border-white/15",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
