import { useEffect, useRef, useCallback, useState } from 'react';
import { sessionService } from '../services/session.service';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface AutoSaveOptions {
  sessionId:            string;
  questionId:           string;
  text:                 string;
  timeSpent:            number;
  currentQuestionIndex: number;
  enabled:              boolean;
  intervalMs?:          number;
}

export function useAutoSave({
  sessionId,
  questionId,
  text,
  timeSpent,
  currentQuestionIndex,
  enabled,
  intervalMs = 15000,
}: AutoSaveOptions) {
  const [status, setStatus]     = useState<SaveStatus>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const lastSavedText = useRef('');
  const isSaving      = useRef(false);
  const pendingRef    = useRef(false);

  const save = useCallback(async (force = false) => {
    if (!enabled || !sessionId || !questionId) return;
    if (isSaving.current) { pendingRef.current = true; return; }
    if (!force && text === lastSavedText.current) return;

    isSaving.current = true;
    setStatus('saving');

    try {
      await sessionService.saveAnswer(sessionId, {
        questionId,
        text,
        timeSpent,
        currentQuestionIndex,
      });

      lastSavedText.current = text;
      setStatus('saved');
      setLastSaved(new Date());

      // Process any pending save that came in while we were saving
      if (pendingRef.current) {
        pendingRef.current = false;
        isSaving.current   = false;
        await save(true);
        return;
      }
    } catch {
      setStatus('error');
    } finally {
      isSaving.current = false;
    }
  }, [sessionId, questionId, text, timeSpent, currentQuestionIndex, enabled]);

  // Interval save
  useEffect(() => {
    if (!enabled) return;
    const id = setInterval(() => save(), intervalMs);
    return () => clearInterval(id);
  }, [save, enabled, intervalMs]);

  // Save on question change (force = true)
  const prevIdx = useRef(currentQuestionIndex);
  useEffect(() => {
    if (prevIdx.current !== currentQuestionIndex) {
      prevIdx.current = currentQuestionIndex;
      save(true);
    }
  }, [currentQuestionIndex, save]);

  // Reset status badge after 3s
  useEffect(() => {
    if (status !== 'saved') return;
    const t = setTimeout(() => setStatus('idle'), 3000);
    return () => clearTimeout(t);
  }, [status, lastSaved]);

  // Beacon on tab close
  useEffect(() => {
    const onUnload = () => {
      if (!sessionId || text === lastSavedText.current) return;
      navigator.sendBeacon(
        `/api/sessions/${sessionId}/answer`,
        JSON.stringify({ questionId, text, timeSpent, currentQuestionIndex })
      );
    };
    window.addEventListener('beforeunload', onUnload);
    return () => window.removeEventListener('beforeunload', onUnload);
  }, [sessionId, questionId, text, timeSpent, currentQuestionIndex]);

  return { save, status, lastSaved };
}