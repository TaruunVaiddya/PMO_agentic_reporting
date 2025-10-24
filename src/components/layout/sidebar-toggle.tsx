"use client";

import React from 'react';
import { PanelLeftClose, PanelLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/contexts/sidebar-context'

interface SidebarToggleProps {
  className?: string;
}

export const SidebarToggle: React.FC<SidebarToggleProps> = ({
  className
}) => {
  const { isCollapsed, toggle } = useSidebar();
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={()=>toggle}
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
