import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function CustomerWalletCreditHomePage() {
  return (
    <div className="w-full p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Customer Wallet / Credit Control</CardTitle>
          <CardDescription>
            Manage customer credit ledgers, post debt payments, and process overdue control
            approvals.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Accounts List</CardTitle>
              <CardDescription>Search accounts, balances, and overdue indicators.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link to="/customer-wallet-credit/accounts">Open list</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Record Payment</CardTitle>
              <CardDescription>
                Post wallet/credit payments for customer debt allocation.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full" variant="outline">
                <Link to="/customer-wallet-credit/payments/new">Create payment</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Approvals</CardTitle>
              <CardDescription>
                Approve block/unblock actions from overdue credit controls.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full" variant="outline">
                <Link to="/customer-wallet-credit/approvals">Open approvals</Link>
              </Button>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}
