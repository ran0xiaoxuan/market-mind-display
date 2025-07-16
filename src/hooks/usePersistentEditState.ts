
import { useState, useEffect, useCallback } from 'react';
import { Inequality } from '@/components/strategy-detail/types';

interface EditState {
  inequalityId: string;
  localInequality: Inequality;
  isEditing: boolean;
  timestamp: number;
}

const STORAGE_KEY_PREFIX = 'strategy_edit_state_';
const STORAGE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

export const usePersistentEditState = (strategyId: string, inequalityId: string) => {
  const storageKey = `${STORAGE_KEY_PREFIX}${strategyId}_${inequalityId}`;

  const loadEditState = useCallback((): EditState | null => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (!stored) return null;

      const editState: EditState = JSON.parse(stored);
      
      // Check if the stored state has expired
      if (Date.now() - editState.timestamp > STORAGE_EXPIRY) {
        localStorage.removeItem(storageKey);
        return null;
      }

      return editState;
    } catch (error) {
      console.error('Error loading edit state:', error);
      localStorage.removeItem(storageKey);
      return null;
    }
  }, [storageKey]);

  const saveEditState = useCallback((localInequality: Inequality, isEditing: boolean) => {
    try {
      const editState: EditState = {
        inequalityId,
        localInequality,
        isEditing,
        timestamp: Date.now()
      };
      localStorage.setItem(storageKey, JSON.stringify(editState));
    } catch (error) {
      console.error('Error saving edit state:', error);
    }
  }, [storageKey, inequalityId]);

  const clearEditState = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.error('Error clearing edit state:', error);
    }
  }, [storageKey]);

  const clearAllEditStates = useCallback(() => {
    try {
      // Clear all edit states for this strategy
      const keys = Object.keys(localStorage);
      const strategyKeys = keys.filter(key => key.startsWith(`${STORAGE_KEY_PREFIX}${strategyId}_`));
      strategyKeys.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.error('Error clearing all edit states:', error);
    }
  }, [strategyId]);

  return {
    loadEditState,
    saveEditState,
    clearEditState,
    clearAllEditStates
  };
};
