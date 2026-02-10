import { withProtection } from '@/lib/hoc/withProtection';
import { AuthenticatedLayout } from '@/components/layouts/auth';
import { Outlet } from 'react-router-dom';
import { useBreadcrumbSync } from '@/hooks/useBreadcrumbSync';

const MainLayout = () => {
  useBreadcrumbSync();
  return (
    <AuthenticatedLayout>
      <Outlet />
    </AuthenticatedLayout>
  );
};

export default withProtection(MainLayout);
