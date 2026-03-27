import { LockKeyhole } from 'lucide-react';

export default function NoAccess() {
  return (
    <div className="flex min-h-[calc(100vh-64px)] w-full items-center justify-center px-4">
      <div className="text-center">
        <div className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full border bg-muted/40">
          <LockKeyhole className="h-8 w-8 text-muted-foreground" />
        </div>
        <h1 className="mb-2 text-3xl font-semibold tracking-tight">Access Denied</h1>
        <p className="mb-1 text-sm font-light text-muted-foreground">
          Sorry, you do not have permission to view this page.
        </p>
        <p className="mt-2 text-sm font-light text-muted-foreground">
          Kindly navigate to a previous or different page.
        </p>
      </div>
    </div>
  );
}
