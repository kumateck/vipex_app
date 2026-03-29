import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export type BaseOption = Record<string, unknown>;

export type CreatableComboboxLogicProps<T extends BaseOption> = {
  options?: T[];
  fetchOptions?: (query: string) => Promise<T[]>;
  onCreate?: (input: string) => Promise<T>;
  getLabel: (item: T) => string;
  getValue: (item: T) => string;
  debounceMs?: number;
};

const DEFAULT_DEBOUNCE_MS = 300;

function normalize(input: string) {
  return input.trim().toLowerCase();
}

function dedupeOptions<T extends BaseOption>(items: T[], getValue: (item: T) => string): T[] {
  const seen = new Set<string>();
  const deduped: T[] = [];

  for (const item of items) {
    const key = normalize(getValue(item));
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    deduped.push(item);
  }

  return deduped;
}

export function useCreatableCombobox<T extends BaseOption>({
  options,
  fetchOptions,
  onCreate,
  getLabel,
  getValue,
  debounceMs = DEFAULT_DEBOUNCE_MS,
}: CreatableComboboxLogicProps<T>) {
  const isAsync = Boolean(fetchOptions);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [fetchedOptions, setFetchedOptions] = useState<T[]>([]);
  const [extraOptions, setExtraOptions] = useState<T[]>([]);
  const [localOptions, setLocalOptions] = useState<T[]>(options ?? []);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!isAsync) {
      setLocalOptions(options ?? []);
      return;
    }

    if (options?.length) {
      setExtraOptions((prev) => dedupeOptions([...prev, ...options], getValue));
    }
  }, [getValue, isAsync, options]);

  useEffect(() => {
    if (!isAsync || !fetchOptions) {
      return;
    }

    const currentRequestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);

    const timer = window.setTimeout(async () => {
      try {
        const next = await fetchOptions(input);

        if (requestIdRef.current !== currentRequestId) {
          return;
        }

        setFetchedOptions(Array.isArray(next) ? next : []);
      } catch {
        if (requestIdRef.current !== currentRequestId) {
          return;
        }

        setFetchedOptions([]);
        setError('Could not load options. Please try again.');
      } finally {
        if (requestIdRef.current === currentRequestId) {
          setLoading(false);
        }
      }
    }, debounceMs);

    return () => {
      clearTimeout(timer);
    };
  }, [debounceMs, fetchOptions, input, isAsync]);

  const filteredOptions = useMemo(() => {
    const normalizedInput = normalize(input);
    if (!normalizedInput) {
      return localOptions;
    }

    return localOptions.filter((option) => {
      const label = normalize(getLabel(option));
      const value = normalize(getValue(option));
      return label.includes(normalizedInput) || value.includes(normalizedInput);
    });
  }, [getLabel, getValue, input, localOptions]);

  const mergedOptions = useMemo(() => {
    return isAsync
      ? dedupeOptions([...extraOptions, ...fetchedOptions], getValue)
      : dedupeOptions(filteredOptions, getValue);
  }, [extraOptions, fetchedOptions, filteredOptions, getValue, isAsync]);

  const normalizedInput = normalize(input);

  const hasExactMatch = useMemo(() => {
    if (!normalizedInput) {
      return false;
    }

    return mergedOptions.some((option) => {
      const label = normalize(getLabel(option));
      const value = normalize(getValue(option));
      return label === normalizedInput || value === normalizedInput;
    });
  }, [getLabel, getValue, mergedOptions, normalizedInput]);

  const canCreate = Boolean(onCreate && normalizedInput && !hasExactMatch && !creating);

  const create = useCallback(async () => {
    if (!onCreate || !normalizedInput || creating) {
      return undefined;
    }

    try {
      setCreating(true);
      setError(null);
      const created = await onCreate(input.trim());

      if (isAsync) {
        setExtraOptions((prev) => dedupeOptions([created, ...prev], getValue));
      } else {
        setLocalOptions((prev) => dedupeOptions([...prev, created], getValue));
      }

      return created;
    } catch {
      setError('Could not create option. Please try again.');
      return undefined;
    } finally {
      setCreating(false);
    }
  }, [creating, getValue, input, isAsync, normalizedInput, onCreate]);

  return {
    canCreate,
    create,
    creating,
    error,
    hasExactMatch,
    input,
    isAsync,
    loading,
    mergedOptions,
    normalizedInput,
    setInput,
  };
}
