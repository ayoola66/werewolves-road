import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface ErrorLog {
  id: string;
  timestamp: string;
  message: string;
  details?: string;
  source: 'client' | 'edge-function' | 'database' | 'network';
  function_name?: string;
  status: 'new' | 'investigating' | 'resolved' | 'ignored';
  resolved_at?: string;
  resolved_by?: string;
  notes?: string;
  stack?: string;
  url?: string;
  user_agent?: string;
  game_code?: string;
  player_id?: string;
  created_at: string;
  updated_at: string;
}

export function useErrorLog() {
  const [errors, setErrors] = useState<ErrorLog[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Load errors from Supabase database
  useEffect(() => {
    const loadErrors = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('error_logs')
          .select('*')
          .order('timestamp', { ascending: false })
          .limit(500); // Limit to most recent 500 errors

        if (error) {
          console.error('Failed to load error logs:', error);
          // Fallback: try to load from localStorage if database fails
          try {
            const stored = localStorage.getItem('werewolf_error_logs_fallback');
            if (stored) {
              const parsed = JSON.parse(stored) as ErrorLog[];
              setErrors(parsed);
            }
          } catch (e) {
            console.error('Failed to load from localStorage fallback:', e);
          }
        } else {
          setErrors(data || []);
        }
      } catch (error) {
        console.error('Error loading error logs:', error);
      } finally {
        setIsLoaded(true);
        setIsLoading(false);
      }
    };

    loadErrors();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('error_logs_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'error_logs',
        },
        () => {
          // Reload errors when changes occur
          loadErrors();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const logError = useCallback(async (
    message: string,
    options?: {
      details?: string;
      source?: ErrorLog['source'];
      functionName?: string;
      stack?: string;
      url?: string;
      gameCode?: string;
      playerId?: string;
    }
  ) => {
    const errorLog: Omit<ErrorLog, 'id' | 'created_at' | 'updated_at'> = {
      timestamp: new Date().toISOString(),
      message,
      details: options?.details,
      source: options?.source || 'client',
      function_name: options?.functionName,
      status: 'new',
      stack: options?.stack,
      url: options?.url || window.location.href,
      user_agent: navigator.userAgent,
      game_code: options?.gameCode,
      player_id: options?.playerId,
    };

    try {
      // Insert into database
      const { data, error } = await supabase
        .from('error_logs')
        .insert(errorLog)
        .select()
        .single();

      if (error) {
        console.error('Failed to save error log to database:', error);
        // Fallback: save to localStorage
        try {
          const stored = localStorage.getItem('werewolf_error_logs_fallback') || '[]';
          const parsed = JSON.parse(stored) as ErrorLog[];
          const fallbackLog = {
            ...errorLog,
            id: `fallback_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          parsed.unshift(fallbackLog);
          localStorage.setItem('werewolf_error_logs_fallback', JSON.stringify(parsed.slice(0, 100)));
        } catch (e) {
          console.error('Failed to save to localStorage fallback:', e);
        }
      } else if (data) {
        // Add to local state
        setErrors((prev) => [data, ...prev]);
      }

      // Also log to console for immediate debugging
      console.error('[Error Log]', errorLog);
    } catch (error) {
      console.error('Failed to log error:', error);
    }
  }, []);

  const updateErrorStatus = useCallback(async (
    id: string,
    status: ErrorLog['status'],
    notes?: string
  ) => {
    const updateData: Partial<ErrorLog> = {
      status,
      notes: notes || undefined,
      updated_at: new Date().toISOString(),
    };

    if (status === 'resolved') {
      updateData.resolved_at = new Date().toISOString();
      updateData.resolved_by = 'user'; // Could be enhanced to track actual user
    } else if (status !== 'resolved' && status !== 'ignored') {
      // Clear resolved_at if status changes away from resolved
      updateData.resolved_at = undefined;
      updateData.resolved_by = undefined;
    }

    try {
      const { data, error } = await supabase
        .from('error_logs')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Failed to update error log:', error);
        throw error;
      }

      if (data) {
        setErrors((prev) =>
          prev.map((error) => (error.id === id ? data : error))
        );
      }
    } catch (error) {
      console.error('Error updating error log status:', error);
      throw error;
    }
  }, []);

  const deleteError = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('error_logs')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Failed to delete error log:', error);
        throw error;
      }

      setErrors((prev) => prev.filter((error) => error.id !== id));
    } catch (error) {
      console.error('Error deleting error log:', error);
      throw error;
    }
  }, []);

  const clearAllErrors = useCallback(async () => {
    try {
      // Delete all errors older than 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { error } = await supabase
        .from('error_logs')
        .delete()
        .lt('timestamp', thirtyDaysAgo.toISOString());

      if (error) {
        console.error('Failed to clear old error logs:', error);
        throw error;
      }

      // Reload remaining errors
      const { data } = await supabase
        .from('error_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(500);

      setErrors(data || []);
    } catch (error) {
      console.error('Error clearing error logs:', error);
      throw error;
    }
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
    isLoading,
    logError,
    updateErrorStatus,
    deleteError,
    clearAllErrors,
    getErrorsByStatus,
    getNewErrorsCount,
    exportErrors,
  };
}
