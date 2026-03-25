import { withProtection } from '@/lib/hoc/withProtection';
import { AuthenticatedLayout } from '@/components/layouts/auth';
import { Outlet } from 'react-router-dom';
import { useBreadcrumbSync } from '@/hooks/useBreadcrumbSync';
import { useEffect } from 'react';
import { useGetCurrentUserPermissionsQuery } from '@/features/auth/api';
import { useAuthStore } from '@/stores/auth-store';

const MainLayout = () => {
  useBreadcrumbSync();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const updateUser = useAuthStore((state) => state.updateUser);
  const { data } = useGetCurrentUserPermissionsQuery(undefined, { skip: !isAuthenticated });

  useEffect(() => {
    if (!data?.permissions) return;
    updateUser({ permissions: data.permissions });
  }, [data, updateUser]);

  return (
    <AuthenticatedLayout>
      <Outlet />
    </AuthenticatedLayout>
  );
};

export default withProtection(MainLayout);
