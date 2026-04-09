import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { EmploymentStatus } from '@/db/schemas/enums';
import { useListEmployeeOptionsQuery } from '@/features/hr';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import {
  useAssignFleetTripCrewMutation,
  useGetFleetTripQuery,
  useListFleetTripCrewQuery,
} from '../api/fleet-transport.api';

export function FleetTripCrewPage() {
  const navigate = useNavigate();
  const params = useParams<{ id: string }>();
  const tripId = params.id ?? '';

  const { data: trip, isLoading: loadingTrip } = useGetFleetTripQuery(tripId, { skip: !tripId });
  const { data: currentCrew = [], isLoading: loadingCrew } = useListFleetTripCrewQuery(
    { id: tripId },
    { skip: !tripId },
  );
  const { data: employeeOptions = [] } = useListEmployeeOptionsQuery({
    status: EmploymentStatus.ACTIVE,
  });

  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [assignCrew, { isLoading: saving }] = useAssignFleetTripCrewMutation();

  useEffect(() => {
    setSelectedEmployeeIds(currentCrew.map((item) => item.employeeId));
  }, [currentCrew]);

  const employees = useMemo(
    () => employeeOptions.filter((item) => item.employmentStatus === EmploymentStatus.ACTIVE),
    [employeeOptions],
  );

  const toggleEmployee = (employeeId: string, checked: boolean) => {
    setSelectedEmployeeIds((current) => {
      if (checked) {
        return current.includes(employeeId) ? current : [...current, employeeId];
      }
      return current.filter((id) => id !== employeeId);
    });
  };

  const onSave = async () => {
    if (!tripId) return;

    try {
      await assignCrew({ id: tripId, crewEmployeeIds: selectedEmployeeIds }).unwrap();
      toast.success('Trip crew updated');
      navigate('/fleet-transport/trips');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update trip crew');
    }
  };

  const tripTitle = trip ? `${trip.tripNo} (${trip.vehiclePlateNumber ?? trip.vehicleId})` : 'Trip';

  return (
    <ScrollableWrapper>
      <div className="w-full p-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Assign Crew: {tripTitle}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingTrip || loadingCrew ? <p>Loading trip...</p> : null}
            {!tripId ? <p className="text-sm text-muted-foreground">Trip id is required.</p> : null}

            <div className="space-y-2 rounded-md border p-3">
              {employees.map((employee) => {
                const isDriver = employee.id === trip?.driverEmployeeId;
                const checked = selectedEmployeeIds.includes(employee.id);
                return (
                  <label
                    key={employee.id}
                    className="flex items-center justify-between gap-2 rounded border p-2"
                  >
                    <span className="text-sm">
                      {employee.employeeNumber} - {employee.displayName}
                      {isDriver ? ' (Driver)' : ''}
                    </span>
                    <Checkbox
                      checked={isDriver ? false : checked}
                      disabled={isDriver}
                      onCheckedChange={(value) => toggleEmployee(employee.id, value === true)}
                    />
                  </label>
                );
              })}
            </div>

            <div className="flex gap-2">
              <Button onClick={onSave} disabled={saving || !tripId}>
                Save crew
              </Button>
              <Button variant="outline" onClick={() => navigate('/fleet-transport/trips')}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </ScrollableWrapper>
  );
}
