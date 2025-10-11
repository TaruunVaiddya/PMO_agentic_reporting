"use client";

import React, { createContext, useContext, useState, useCallback } from 'react';

interface SidebarContextType {
  isCollapsed: boolean;
  collapse: () => void;
  expand: () => void;
  toggle: () => void;
}

const SidebarContext = createContext<SidebarContextType | null>(null);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within SidebarProvider');
  }
  return context;
};

interface SidebarProviderProps {
  children: React.ReactNode;
}

export const SidebarProvider: React.FC<SidebarProviderProps> = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const collapse = useCallback(() => {
    setIsCollapsed(true);
  }, []);

  const expand = useCallback(() => {
    setIsCollapsed(false);
  }, []);

  const toggle = useCallback(() => {
    setIsCollapsed(prev => !prev);
  }, []);

  const value: SidebarContextType = {
    isCollapsed,
    collapse,
    expand,
    toggle
  };

  return (
    <SidebarContext.Provider value={value}>
      {children}
    </SidebarContext.Provider>
  );
};
