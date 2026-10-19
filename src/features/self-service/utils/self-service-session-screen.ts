type SessionScreen = 'limit' | 'invalid' | 'loading' | 'expired' | 'error' | null;

export function getSelfServiceSessionScreen(input: {
  branchId: string;
  status: string;
  serverExpired: boolean;
  fetchingBranch: boolean;
  hasBranch: boolean;
  branchError: boolean;
}): SessionScreen {
  if (!input.branchId) return 'invalid';
  if (input.status === 'limit') return 'limit';
  if (input.status === 'starting') return 'loading';
  if (input.status === 'expired' || input.serverExpired) return 'expired';
  if (input.status === 'error') return 'error';
  if (input.fetchingBranch && !input.hasBranch) return 'loading';
  return input.branchError || !input.hasBranch ? 'invalid' : null;
}
