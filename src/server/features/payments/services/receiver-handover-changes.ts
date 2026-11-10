type Scope = { companyId: string; branchId: string };

const bootId = crypto.randomUUID();
const branches = new Map<string, { version: number; listeners: Set<() => void> }>();

function branchChanges({ companyId, branchId }: Scope) {
  const key = `${companyId}:${branchId}`;
  let state = branches.get(key);
  if (!state) {
    state = { version: 0, listeners: new Set() };
    branches.set(key, state);
  }
  return state;
}

export function signalReceiverHandoverChange(scope: Scope) {
  const state = branchChanges(scope);
  state.version += 1;
  for (const listener of state.listeners) listener();
}

export async function waitForReceiverHandoverChange(
  scope: Scope,
  since?: string,
  signal?: AbortSignal,
) {
  const state = branchChanges(scope);
  const revision = () => `${bootId}:${state.version}`;
  if (since === revision() && !signal?.aborted) {
    await new Promise<void>((resolve) => {
      const finish = () => {
        clearTimeout(timer);
        state.listeners.delete(finish);
        signal?.removeEventListener('abort', finish);
        resolve();
      };
      const timer = setTimeout(finish, 4_000);
      state.listeners.add(finish);
      signal?.addEventListener('abort', finish, { once: true });
    });
  }
  return { revision: revision() };
}
