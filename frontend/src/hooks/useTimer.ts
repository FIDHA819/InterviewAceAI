import { useState, useEffect, useRef, useCallback } from 'react';

interface UseTimerOptions {
  initialSeconds: number;
  onExpire?: () => void;
  autoStart?: boolean;
}

export function useTimer({ initialSeconds, onExpire, autoStart = true }: UseTimerOptions) {
  const [timeLeft, setTimeLeft]   = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(autoStart);
  const intervalRef               = useRef<ReturnType<typeof setInterval> | null>(null);
  const expiredRef                = useRef(false);

  const clear = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const start  = useCallback(() => { expiredRef.current = false; setIsRunning(true);  }, []);
  const pause  = useCallback(() => setIsRunning(false), []);
  const reset  = useCallback((seconds?: number) => {
    expiredRef.current = false;
    setTimeLeft(seconds ?? initialSeconds);
    setIsRunning(true);
  }, [initialSeconds]);

  useEffect(() => {
    if (!isRunning) { clear(); return; }

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clear();
          setIsRunning(false);
          if (!expiredRef.current) {
            expiredRef.current = true;
            onExpire?.();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return clear;
  }, [isRunning, onExpire]);

  // Re-sync when initialSeconds changes (new question)
  useEffect(() => {
    expiredRef.current = false;
    setTimeLeft(initialSeconds);
    if (autoStart) setIsRunning(true);
  }, [initialSeconds]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const display = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const pct     = initialSeconds > 0 ? (timeLeft / initialSeconds) * 100 : 0;
  const urgent  = timeLeft <= 30 && timeLeft > 0;
  const expired = timeLeft === 0;

  return { timeLeft, display, pct, urgent, expired, isRunning, start, pause, reset };
}