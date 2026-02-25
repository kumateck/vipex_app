import { AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useGetCurrentActiveSessionQuery } from '@/features/cashiers/api/cashiers.api';

type ParcelSessionGuardProps = {
  children: React.ReactNode;
};

export function ParcelSessionGuard({ children }: ParcelSessionGuardProps) {
  const { data: activeSession, isLoading } = useGetCurrentActiveSessionQuery();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Parcel Transactions</CardTitle>
        </CardHeader>
        <CardContent>Checking active cashier session...</CardContent>
      </Card>
    );
  }

  if (!activeSession) {
    return (
      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Cashier session required
          </CardTitle>
        </CardHeader>
        <CardContent>
          Open a cashier session before creating parcel transactions or taking payments.
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
}
