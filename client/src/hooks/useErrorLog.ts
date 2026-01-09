import { useState, useEffect, useCallback } from 'react';

export interface ErrorLog {
  id: string;
  timestamp: string;
  message: string;
  details?: string;
  source: string; // 'client' | 'edge-function' | 'database' | 'network'
  functionName?: string;
  status: 'new' | 'investigating' | 'resolved' | 'ignored';
  resolvedAt?: string;
  resolvedBy?: string;
  notes?: string;
  stack?: string;
  url?: string;
  userAgent?: string;
}

const STORAGE_KEY = 'werewolf_error_logs';
const MAX_LOGS = 500; // Keep last 500 errors

export function useErrorLog() {
  const [errors, setErrors] = useState<ErrorLog[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load errors from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as ErrorLog[];
        setErrors(parsed);
      }
    } catch (error) {
      console.error('Failed to load error logs:', error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save errors to localStorage whenever they change
  useEffect(() => {
    if (isLoaded) {
      try {
        // Keep only the most recent MAX_LOGS errors
        const logsToSave = errors.slice(-MAX_LOGS);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(logsToSave));
      } catch (error) {
        console.error('Failed to save error logs:', error);
      }
    }
  }, [errors, isLoaded]);

  const logError = useCallback((
    message: string,
    options?: {
      details?: string;
      source?: ErrorLog['source'];
      functionName?: string;
      stack?: string;
      url?: string;
    }
  ) => {
    const errorLog: ErrorLog = {
      id: `error_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      timestamp: new Date().toISOString(),
      message,
      details: options?.details,
      source: options?.source || 'client',
      functionName: options?.functionName,
      status: 'new',
      stack: options?.stack,
      url: options?.url || window.location.href,
      userAgent: navigator.userAgent,
    };

    setErrors((prev) => [...prev, errorLog]);
    
    // Also log to console for immediate debugging
    console.error('[Error Log]', errorLog);
    
    return errorLog.id;
  }, []);

  const updateErrorStatus = useCallback((
    id: string,
    status: ErrorLog['status'],
    notes?: string
  ) => {
    setErrors((prev) =>
      prev.map((error) =>
        error.id === id
          ? {
              ...error,
              status,
              notes: notes || error.notes,
              resolvedAt: status === 'resolved' ? new Date().toISOString() : error.resolvedAt,
              resolvedBy: status === 'resolved' ? 'user' : error.resolvedBy,
            }
          : error
      )
    );
  }, []);

  const deleteError = useCallback((id: string) => {
    setErrors((prev) => prev.filter((error) => error.id !== id));
  }, []);

  const clearAllErrors = useCallback(() => {
    setErrors([]);
  }, []);

  const getErrorsByStatus = useCallback((status: ErrorLog['status']) => {
    return errors.filter((error) => error.status === status);
  }, [errors]);

  const getNewErrorsCount = useCallback(() => {
    return errors.filter((error) => error.status === 'new').length;
  }, [errors]);

  const exportErrors = useCallback(() => {
    const dataStr = JSON.stringify(errors, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `error-logs-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [errors]);

  return {
    errors,
    isLoaded,
    logError,
    updateErrorStatus,
    deleteError,
    clearAllErrors,
    getErrorsByStatus,
    getNewErrorsCount,
    exportErrors,
  };
}
