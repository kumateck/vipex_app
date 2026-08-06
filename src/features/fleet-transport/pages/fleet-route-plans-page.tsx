import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { useListFleetRoutePlansQuery } from '../api/fleet-transport.api';

export function FleetRoutePlansPage() {
  const { data: routes = [], isLoading } = useListFleetRoutePlansQuery();
  const sortedRoutes = useMemo(
    () => [...routes].sort((a, b) => a.name.localeCompare(b.name)),
    [routes],
  );

  return (
    <ScrollableWrapper>
      <div className="w-full p-4 space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Route Plans</CardTitle>
            <Button asChild>
              <Link to="/fleet-transport/routes/plans/new">Create route plan</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {isLoading ? <p>Loading route plans...</p> : null}
            {!isLoading && sortedRoutes.length === 0 ? (
              <p className="text-sm text-muted-foreground">No route plans yet.</p>
            ) : null}
            {sortedRoutes.map((route) => (
              <div key={route.id} className="rounded border p-3 text-sm">
                <p className="font-medium">{route.name}</p>
                <p className="text-muted-foreground">
                  {route.originLabel ?? '-'} {'->'} {route.destinationLabel ?? '-'}
                </p>
                <p className="text-muted-foreground">
                  Distance: {route.distanceKm ?? '-'} km | Duration:{' '}
                  {route.estimatedDurationMin ?? '-'} min
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </ScrollableWrapper>
  );
}
