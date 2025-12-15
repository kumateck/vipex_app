import { Outlet } from 'react-router-dom';
// import { Header } from '@/components/layout/header';
// import { Sidebar } from '@/components/layout/sidebar';

export function AuthenticatedLayout() {
  return (
    <div className="flex h-screen bg-background">
      {/* <Sidebar /> */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* <Header /> */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
