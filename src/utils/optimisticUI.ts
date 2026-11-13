import { useState, useCallback } from 'react';

/**
 * Hook para Mutaciones Optimistas de UI
 * Actualiza el estado visual de inmediato; si el servidor falla, revierte automáticamente
 */
export function useOptimisticAction<T>(
  initialState: T,
  onCommitServer: (optimisticData: T) => Promise<any>
) {
  const [state, setState] = useState<T>(initialState);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const executeOptimistic = useCallback(
    async (updater: (prev: T) => T) => {
      const previousState = state;
      const optimisticState = updater(previousState);

      // 1. Actualización visual instantánea en 0ms
      setState(optimisticState);
      setIsPending(true);
      setError(null);

      // 2. Ejecutar la llamada al servidor en segundo plano
      try {
        await onCommitServer(optimisticState);
      } catch (err: any) {
        // 3. Rollback inmediato al estado anterior en caso de fallo
        console.error('[OptimisticUI] Error en servidor, revirtiendo estado:', err);
        setState(previousState);
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setIsPending(false);
      }
    },
    [state, onCommitServer]
  );

  return {
    state,
    setState,
    executeOptimistic,
    isPending,
    error,
  };
}
