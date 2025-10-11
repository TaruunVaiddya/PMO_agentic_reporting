"use client";

import React from 'react';
import { PanelLeftClose, PanelLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SidebarToggleProps {
  isCollapsed: boolean;
  onToggle: () => void;
  className?: string;
}

export const SidebarToggle: React.FC<SidebarToggleProps> = ({
  isCollapsed,
  onToggle,
  className
}) => {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onToggle}
      className={cn(
        'h-8 w-8 rounded-md hover:bg-accent transition-colors cursor-pointer',
        className
      )}
      title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
    >
      {isCollapsed ? (
        <PanelLeft className="h-4 w-4" />
      ) : (
        <PanelLeftClose className="h-4 w-4" />
      )}
    </Button>
  );
};
