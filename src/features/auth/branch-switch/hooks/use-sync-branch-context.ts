import { useEffect } from 'react';
import { sessionBranchKey } from '@/shared/auth/branch-switch';
import { AUTH_STORAGE_KEY, useAuthStore, type AuthUser } from '@/stores/auth-store';

export function useSyncBranchContext() {
  useEffect(() => {
    function onSessionStorage(event: StorageEvent) {
      if (event.key !== AUTH_STORAGE_KEY || !event.newValue) return;
      try {
        const nextUser = (JSON.parse(event.newValue) as { state?: { user?: AuthUser } }).state
          ?.user;
        const currentUser = useAuthStore.getState().user;
        if (
          nextUser &&
          nextUser.id === currentUser?.id &&
          sessionBranchKey(nextUser) !== sessionBranchKey(currentUser)
        ) {
          window.location.replace('/');
        }
      } catch {
        // Other storage consumers may write incomplete entries.
      }
    }
    window.addEventListener('storage', onSessionStorage);
    return () => window.removeEventListener('storage', onSessionStorage);
  }, []);
}
