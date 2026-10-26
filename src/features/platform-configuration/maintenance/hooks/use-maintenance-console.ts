import { useCallback, useRef, useState } from 'react';
import {
  useGetMaintenanceRunsQuery,
  useGetMaintenanceScriptsQuery,
  useRunMaintenanceScriptMutation,
} from '../services';
import { getErrorMessage } from '@/lib/TheAduseiErrorResponse';
import type { MaintenanceParams, MaintenanceRun } from '../types';
import { useAuthStore } from '@/stores/auth-store';

const EMPTY_RUNS: MaintenanceRun[] = [];
export function useMaintenanceConsole() {
  const catalog = useGetMaintenanceScriptsQuery();
  const user = useAuthStore((state) => state.user);
  const history = useGetMaintenanceRunsQuery({
    companyId: user?.company?.id ?? '',
    userId: user?.id ?? '',
  });
  const [runScript, request] = useRunMaintenanceScriptMutation();
  const [selectedId, setSelectedId] = useState('');
  const [params, setParams] = useState<MaintenanceParams>({});
  const [result, setResult] = useState<MaintenanceRun | null>(null);
  const [preview, setPreview] = useState<MaintenanceRun | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState('');
  const inFlight = useRef(false);
  const generation = useRef(0);
  const selected =
    catalog.data?.find((item) => item.id === selectedId) ?? catalog.data?.[0] ?? null;
  const selectScript = useCallback((id: string) => {
    if (inFlight.current) return;
    generation.current++;
    setSelectedId(id);
    setParams({});
    setResult(null);
    setPreview(null);
    setConfirmed(false);
    setError('');
  }, []);
  const updateParam = useCallback((name: string, value: string) => {
    generation.current++;
    setParams((current) => ({ ...current, [name]: value }));
    setPreview(null);
    setResult(null);
    setConfirmed(false);
    setError('');
  }, []);
  const run = useCallback(
    async (mode: 'preview' | 'execute') => {
      if (!selected || inFlight.current) return;
      if (mode === 'execute' && (!preview?.result?.readyToApply || !confirmed)) return;
      inFlight.current = true;
      const currentGeneration = generation.current;
      setError('');
      try {
        const completed = await runScript({
          operationId: selected.id,
          params,
          mode,
          ...(mode === 'execute'
            ? {
                previewRunId: preview!.id,
                ...(selected.id === 'repair-credit-print-payment'
                  ? { confirmNoCashReceived: confirmed }
                  : { confirmRepair: confirmed }),
              }
            : {}),
        }).unwrap();
        if (currentGeneration !== generation.current) return;
        setResult(completed);
        setPreview(mode === 'preview' && completed.result?.readyToApply ? completed : null);
        setConfirmed(false);
      } catch (failure) {
        if (currentGeneration === generation.current) {
          setError(
            getErrorMessage(failure, '') ||
              'The script could not complete. Run a fresh preview and try again.',
          );
          setPreview(null);
          setConfirmed(false);
        }
      } finally {
        inFlight.current = false;
        void history.refetch();
      }
    },
    [selected, params, preview, confirmed, runScript, history.refetch],
  );
  const canPreview = Boolean(
    selected &&
      selected.fields.every(
        (field) => !field.required || String(params[field.name] ?? '').trim(),
      ) &&
      !request.isLoading,
  );
  const showResult = useCallback((entry: MaintenanceRun) => {
    if (inFlight.current) return;
    setResult(entry);
    setPreview(null);
    setConfirmed(false);
    setError('');
  }, []);
  return {
    catalog,
    history,
    scripts: catalog.data ?? [],
    runs: history.data ?? EMPTY_RUNS,
    selected,
    params,
    result,
    confirmed,
    error,
    busy: request.isLoading,
    canPreview,
    canExecute: Boolean(preview?.result?.readyToApply && confirmed && !request.isLoading),
    hasExecutablePreview: Boolean(preview?.result?.readyToApply && result?.id === preview.id),
    selectScript,
    updateParam,
    setConfirmed,
    showResult,
    run,
  };
}
export type MaintenanceConsoleState = ReturnType<typeof useMaintenanceConsole>;
