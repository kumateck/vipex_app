import { withProtection } from '@/lib/hoc/withProtection';
import { AuthenticatedLayout } from '@/components/layouts/auth';
import { Outlet, useLocation } from 'react-router-dom';
import { useBreadcrumbSync } from '@/hooks/useBreadcrumbSync';
import { useEffect, useMemo } from 'react';
import { useGetCurrentUserPermissionsQuery } from '@/features/auth/api';
import { useListCompanyModulesQuery } from '@/features/company-modules/api';
import { useAuthStore } from '@/stores/auth-store';
import NoAccess from '@/components/permissions/no-access';
import { inferRequiredPermissionByPath } from '@/shared/permissions/path-access';

const MainLayout = () => {
  useBreadcrumbSync();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const userPermissions = useAuthStore((state) => state.user?.permissions ?? []);
  const updateUser = useAuthStore((state) => state.updateUser);
  const location = useLocation();
  const { data, isFetching } = useGetCurrentUserPermissionsQuery(undefined, {
    skip: !isAuthenticated,
  });
  const { data: companyModules } = useListCompanyModulesQuery(undefined, {
    skip: !isAuthenticated,
  });
  const grantedPermissions = useMemo(() => new Set(userPermissions), [userPermissions]);
  const requiredPermission = inferRequiredPermissionByPath(location.pathname);
  const hasPermissionAccess = !requiredPermission || grantedPermissions.has(requiredPermission);

  useEffect(() => {
    if (!data?.permissions) return;
    updateUser({ permissions: data.permissions });
  }, [data, updateUser]);

  useEffect(() => {
    if (!companyModules?.length) return;
    const accountingModule = companyModules.find((module) => module.code === 'accounting');
    if (!accountingModule) return;

    const currentCompany = user?.company;
    if (!currentCompany) return;
    if (currentCompany.useAccounting === accountingModule.isEnabled) return;

    updateUser({
      company: {
        ...currentCompany,
        useAccounting: accountingModule.isEnabled,
      },
    });
  }, [companyModules, updateUser, user?.company]);

  if (!hasPermissionAccess) {
    if (isFetching && userPermissions.length === 0) {
      return (
        <AuthenticatedLayout>
          <div className="flex min-h-[calc(100vh-64px)] items-center justify-center text-sm text-muted-foreground">
            Checking permissions...
          </div>
        </AuthenticatedLayout>
      );
    }

    return (
      <AuthenticatedLayout>
        <NoAccess />
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <Outlet />
    </AuthenticatedLayout>
  );
};

export default withProtection(MainLayout);
