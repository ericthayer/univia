import { useState, useEffect, useCallback } from 'react';

interface ChecklistProgress {
  [itemId: string]: {
    completed: boolean;
    notes: string;
    completedAt?: string;
  };
}

const WCAG_PROGRESS_KEY = 'wcag_checklist_progress';

export function useWCAGProgress() {
  const [progress, setProgress] = useState<ChecklistProgress>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = useCallback(() => {
    try {
      const savedProgress = localStorage.getItem(WCAG_PROGRESS_KEY);
      if (savedProgress) {
        setProgress(JSON.parse(savedProgress));
      }
    } catch (error) {
      console.error('Error loading WCAG progress from localStorage:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveProgress = useCallback((newProgress: ChecklistProgress) => {
    try {
      localStorage.setItem(WCAG_PROGRESS_KEY, JSON.stringify(newProgress));
      setProgress(newProgress);
    } catch (error) {
      console.error('Error saving WCAG progress to localStorage:', error);
    }
  }, []);

  const toggleItem = useCallback((itemId: string, completed: boolean) => {
    const newProgress = {
      ...progress,
      [itemId]: {
        completed,
        notes: progress[itemId]?.notes || '',
        completedAt: completed ? new Date().toISOString() : undefined,
      },
    };
    saveProgress(newProgress);
  }, [progress, saveProgress]);

  const updateNotes = useCallback((itemId: string, notes: string) => {
    const newProgress = {
      ...progress,
      [itemId]: {
        ...progress[itemId],
        notes,
        completed: progress[itemId]?.completed || false,
      },
    };
    saveProgress(newProgress);
  }, [progress, saveProgress]);

  const resetProgress = useCallback(() => {
    localStorage.removeItem(WCAG_PROGRESS_KEY);
    setProgress({});
  }, []);

  return {
    progress,
    loading,
    toggleItem,
    updateNotes,
    resetProgress,
  };
}
