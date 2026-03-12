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
          ? "bg-[#1a2456] text-white border-[#1a2456] shadow-sm"
          : "bg-white text-slate-700 hover:text-[#1a2456] hover:bg-slate-50 border-slate-200 hover:border-slate-300 shadow-sm",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
