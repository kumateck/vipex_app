import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function FleetTransportHomePage() {
  return (
    <div className="w-full p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Fleet & Transport</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link to="/fleet-transport/vehicles">Vehicles</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/fleet-transport/fuel-logs">Fuel Logs</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/fleet-transport/fuel-logs/approvals">Fuel Approvals</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
