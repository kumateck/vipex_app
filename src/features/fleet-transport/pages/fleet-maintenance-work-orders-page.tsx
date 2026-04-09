import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import {
  useListFleetMaintenanceWorkOrdersQuery,
  useUpdateFleetMaintenanceWorkOrderMutation,
} from '../api/fleet-transport.api';

function workOrderStatusLabel(value: number) {
  if (value === 0) return 'Open';
  if (value === 1) return 'In Progress';
  if (value === 2) return 'Completed';
  if (value === 3) return 'Cancelled';
  return 'Unknown';
}

export function FleetMaintenanceWorkOrdersPage() {
  const { data: workOrders = [] } = useListFleetMaintenanceWorkOrdersQuery();
  const [updateWorkOrder, { isLoading: updatingWorkOrder }] =
    useUpdateFleetMaintenanceWorkOrderMutation();

  const onMarkInProgress = async (id: string) => {
    try {
      await updateWorkOrder({ id, body: { status: 1 } }).unwrap();
      toast.success('Work order set to in progress');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update work order');
    }
  };

  const onMarkCompleted = async (id: string) => {
    try {
      await updateWorkOrder({ id, body: { status: 2 } }).unwrap();
      toast.success('Work order completed');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to complete work order');
    }
  };

  return (
    <ScrollableWrapper>
      <div className="w-full p-4 space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Work Orders</CardTitle>
            <div className="flex gap-2">
              <Button asChild variant="outline">
                <Link to="/fleet-transport/maintenance/work-orders/new">Create Work Order</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/fleet-transport/maintenance/work-orders/part-movements">
                  Work Order Part Movements
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/fleet-transport/maintenance">Back to dashboard</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {workOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground">No work orders.</p>
            ) : null}
            {workOrders.map((workOrder) => (
              <div key={workOrder.id} className="rounded border p-3 space-y-1">
                <p className="font-medium">
                  {workOrder.workOrderNo} - {workOrder.title}
                </p>
                <p className="text-sm text-muted-foreground">
                  Vehicle: {workOrder.vehiclePlateNumber ?? workOrder.vehicleId} | Status:{' '}
                  {workOrderStatusLabel(workOrder.status)}
                </p>
                <div className="flex gap-2">
                  {workOrder.status === 0 ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onMarkInProgress(workOrder.id)}
                      disabled={updatingWorkOrder}
                    >
                      Mark In Progress
                    </Button>
                  ) : null}
                  {workOrder.status === 0 || workOrder.status === 1 ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onMarkCompleted(workOrder.id)}
                      disabled={updatingWorkOrder}
                    >
                      Mark Completed
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </ScrollableWrapper>
  );
}
