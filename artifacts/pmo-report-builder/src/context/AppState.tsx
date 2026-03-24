import React, { createContext, useContext, useState, useCallback } from 'react';

interface AppStateContextValue {
  ngiSubmitted: boolean;
  markNGISubmitted: () => void;
  executiveSent: boolean;
  markExecutiveSent: () => void;
}

const AppStateContext = createContext<AppStateContextValue>({
  ngiSubmitted: false,
  markNGISubmitted: () => {},
  executiveSent: false,
  markExecutiveSent: () => {},
});

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [ngiSubmitted, setNGISubmitted] = useState(() => {
    try { return localStorage.getItem('ngi_submitted') === 'true'; } catch { return false; }
  });
  const [executiveSent, setExecutiveSent] = useState(() => {
    try { return localStorage.getItem('executive_sent') === 'true'; } catch { return false; }
  });

  const markNGISubmitted = useCallback(() => {
    setNGISubmitted(true);
    try { localStorage.setItem('ngi_submitted', 'true'); } catch {}
  }, []);

  const markExecutiveSent = useCallback(() => {
    setExecutiveSent(true);
    try { localStorage.setItem('executive_sent', 'true'); } catch {}
  }, []);

  return (
    <AppStateContext.Provider value={{ ngiSubmitted, markNGISubmitted, executiveSent, markExecutiveSent }}>
      {children}
    </AppStateContext.Provider>
  );
}

export const useAppState = () => useContext(AppStateContext);
