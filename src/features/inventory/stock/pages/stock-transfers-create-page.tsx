import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';

export function StockTransfersCreatePage() {
  return (
    <ScrollableWrapper>
      <div className="w-full p-4">
        <div className="w-full max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Manual stock transfer is disabled</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="text-muted-foreground">
                Use stock requests as the single internal transfer workflow. Transfers are generated
                automatically from request fulfillment.
              </p>
              <div className="flex gap-2">
                <Button asChild>
                  <Link to="/inventory/stock-requests/new">Create stock request</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/inventory/stock-transfers">Back to transfer shipments</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ScrollableWrapper>
  );
}
