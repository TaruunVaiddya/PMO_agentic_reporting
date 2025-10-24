"use client";

import React, { createContext, useContext, useState, useRef, ReactNode } from 'react';

interface SessionContextType {
  pendingQuery: string | null;
  setPendingQuery: (query: string | null) => void;
  newSessionId: React.MutableRefObject<string | null>;
  setNewSessionId: (id: string | null) => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

interface SessionProviderProps {
  children: ReactNode;
}

export function SessionProvider({ children }: SessionProviderProps) {
  const [pendingQuery, setPendingQuery] = useState<string | null>(null);
  const newSessionIdRef = useRef<string | null>(null);

  const setNewSessionId = (id: string | null) => {
    newSessionIdRef.current = id;
  };

  return (
    <SessionContext.Provider
      value={{
        pendingQuery,
        setPendingQuery,
        newSessionId: newSessionIdRef,
        setNewSessionId,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}
