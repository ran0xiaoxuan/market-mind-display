
import { useState, useCallback } from 'react';

export interface BacktestProgress {
  stage: string;
  progress: number;
  message: string;
}

export const useBacktestProgress = () => {
  const [progress, setProgress] = useState<BacktestProgress | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const startProgress = useCallback(() => {
    setIsRunning(true);
    setProgress({ stage: 'starting', progress: 0, message: 'Initializing backtest...' });
  }, []);

  const updateProgress = useCallback((newProgress: BacktestProgress) => {
    setProgress(newProgress);
  }, []);

  const completeProgress = useCallback(() => {
    setProgress({ stage: 'complete', progress: 100, message: 'Backtest completed successfully!' });
    setTimeout(() => {
      setIsRunning(false);
      setProgress(null);
    }, 2000);
  }, []);

  const resetProgress = useCallback(() => {
    setIsRunning(false);
    setProgress(null);
  }, []);

  return {
    progress,
    isRunning,
    startProgress,
    updateProgress,
    completeProgress,
    resetProgress
  };
};
