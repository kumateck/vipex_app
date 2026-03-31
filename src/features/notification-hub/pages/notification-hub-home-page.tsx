import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function NotificationHubHomePage() {
  return (
    <div className="w-full p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Notification Hub</CardTitle>
          <CardDescription>
            Manage SMS and email providers, templates, campaigns, approvals, and delivery logs.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <Button asChild variant="outline">
            <Link to="/notification-hub/providers">Providers</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/notification-hub/templates">Templates</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/notification-hub/campaigns">Campaigns</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/notification-hub/campaigns/approvals">Approvals</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/notification-hub/dispatches">Delivery Logs</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
