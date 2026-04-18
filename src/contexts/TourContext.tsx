'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { HelpRoleKey } from '@/app/help/content';
import { TOUR_STEPS, TourStep } from '@/components/Tour/tourSteps';

type TourContextValue = {
  isRunning: boolean;
  stepIndex: number;
  steps: TourStep[];
  start: (roleKey: HelpRoleKey) => void;
  stop: () => void;
  next: () => void;
  prev: () => void;
};

const TourContext = createContext<TourContextValue | null>(null);

export const TourProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [steps, setSteps] = useState<TourStep[]>([]);
  const [stepIndex, setStepIndex] = useState(0);

  const start = useCallback((roleKey: HelpRoleKey) => {
    setSteps(TOUR_STEPS[roleKey]);
    setStepIndex(0);
    setIsRunning(true);
  }, []);

  const stop = useCallback(() => {
    setIsRunning(false);
    setStepIndex(0);
  }, []);

  const next = useCallback(() => {
    setStepIndex((i) => {
      if (i >= steps.length - 1) {
        setIsRunning(false);
        return 0;
      }
      return i + 1;
    });
  }, [steps.length]);

  const prev = useCallback(() => {
    setStepIndex((i) => Math.max(0, i - 1));
  }, []);

  const value = useMemo(
    () => ({ isRunning, stepIndex, steps, start, stop, next, prev }),
    [isRunning, stepIndex, steps, start, stop, next, prev]
  );

  return <TourContext.Provider value={value}>{children}</TourContext.Provider>;
};

export const useTour = (): TourContextValue => {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error('useTour must be used within a TourProvider');
  return ctx;
};
