import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export function useCommunicationChatNavigation() {
  const navigate = useNavigate();
  const location = useLocation();

  const selectedThreadId = useMemo(() => {
    const match = location.pathname.match(/\/communication\/chat\/([^/]+)/);
    return match?.[1] ?? null;
  }, [location.pathname]);

  const selectedCallId = useMemo(() => {
    const match = location.pathname.match(/\/communication\/calls\/([^/]+)/);
    return match?.[1] ?? null;
  }, [location.pathname]);

  return {
    navigate,
    selectedThreadId,
    selectedCallId,
    navigateToWorkspace: () => navigate('/communication/chat'),
    navigateToCreate: () => navigate('/communication/chat/create'),
    navigateToThread: (threadId: string) => navigate(`/communication/chat/${threadId}`),
  };
}
