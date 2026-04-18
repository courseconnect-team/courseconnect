'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

type BugReportContextValue = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
};

const BugReportContext = createContext<BugReportContextValue | null>(null);

export const BugReportProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  const value = useMemo(() => ({ isOpen, open, close }), [isOpen, open, close]);

  return (
    <BugReportContext.Provider value={value}>
      {children}
    </BugReportContext.Provider>
  );
};

export const useBugReport = (): BugReportContextValue => {
  const ctx = useContext(BugReportContext);
  if (!ctx)
    throw new Error('useBugReport must be used within a BugReportProvider');
  return ctx;
};
