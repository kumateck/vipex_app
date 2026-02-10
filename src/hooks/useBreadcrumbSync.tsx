import { useBreadcrumbStore } from '@/stores/route-store';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const useBreadcrumbSync = () => {
  const { url, syncFromUrl } = useBreadcrumbStore();
  const location = useLocation();

  useEffect(() => {
    // Get current path from router (adjust based on your router)
    const currentPath = location.pathname;

    // Only sync if stored URL doesn't match current path
    if (url !== currentPath) {
      syncFromUrl(currentPath);
    }
  }, [url, syncFromUrl]);
};
