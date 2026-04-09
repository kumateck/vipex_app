import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useListBranchOptionsQuery } from '@/features/branches';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-searchable';
import { useCreateFleetRoutePlanMutation } from '../../api/fleet-transport.api';

type DraftStop = { key: string; label: string; address: string; offset: string };

function makeStop(): DraftStop {
  return { key: crypto.randomUUID(), label: '', address: '', offset: '' };
}

export function FleetRoutePlansCreatePage() {
  const navigate = useNavigate();
  const [branchId, setBranchId] = useState('__none__');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [originLabel, setOriginLabel] = useState('');
  const [destinationLabel, setDestinationLabel] = useState('');
  const [distanceKm, setDistanceKm] = useState('');
  const [estimatedDurationMin, setEstimatedDurationMin] = useState('');
  const [stops, setStops] = useState<DraftStop[]>([makeStop()]);

  const { data: branchOptions = [] } = useListBranchOptionsQuery();
  const [createRoute, { isLoading: saving }] = useCreateFleetRoutePlanMutation();

  const onCreate = async () => {
    if (!name.trim()) {
      toast.error('Route name is required');
      return;
    }

    const normalizedStops = stops
      .map((stop, index) => ({
        sequenceNo: index + 1,
        label: stop.label.trim(),
        address: stop.address.trim() || null,
        plannedArrivalOffsetMin: stop.offset.trim() ? Number(stop.offset) : null,
      }))
      .filter((stop) => stop.label.length > 0);

    if (
      normalizedStops.some(
        (stop) =>
          typeof stop.plannedArrivalOffsetMin === 'number' && stop.plannedArrivalOffsetMin < 0,
      )
    ) {
      toast.error('Stop offsets cannot be negative');
      return;
    }

    try {
      await createRoute({
        branchId: branchId === '__none__' ? null : branchId,
        name: name.trim(),
        code: code.trim() || null,
        originLabel: originLabel.trim() || null,
        destinationLabel: destinationLabel.trim() || null,
        distanceKm: distanceKm.trim() ? Number(distanceKm) : null,
        estimatedDurationMin: estimatedDurationMin.trim() ? Number(estimatedDurationMin) : null,
        stops: normalizedStops,
      }).unwrap();
      toast.success('Route plan created');
      navigate('/fleet-transport/routes/plans');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create route plan');
    }
  };

  return (
    <ScrollableWrapper>
      <div className="w-full p-4 space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Create Route Plan</CardTitle>
            <Button asChild variant="outline">
              <Link to="/fleet-transport/routes/plans">Back to list</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <FieldGroup className="grid gap-4 md:grid-cols-2">
              <Field>
                <FieldLabel>Route Name</FieldLabel>
                <Input value={name} onChange={(event) => setName(event.target.value)} />
              </Field>
              <Field>
                <FieldLabel>Code</FieldLabel>
                <Input value={code} onChange={(event) => setCode(event.target.value)} />
              </Field>
              <Field>
                <FieldLabel>Branch</FieldLabel>
                <Select value={branchId} onValueChange={setBranchId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select branch (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Any branch</SelectItem>
                    {branchOptions.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel>Distance (km)</FieldLabel>
                <Input
                  type="number"
                  min={0}
                  value={distanceKm}
                  onChange={(event) => setDistanceKm(event.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel>Origin</FieldLabel>
                <Input
                  value={originLabel}
                  onChange={(event) => setOriginLabel(event.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel>Destination</FieldLabel>
                <Input
                  value={destinationLabel}
                  onChange={(event) => setDestinationLabel(event.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel>Estimated Duration (min)</FieldLabel>
                <Input
                  type="number"
                  min={0}
                  value={estimatedDurationMin}
                  onChange={(event) => setEstimatedDurationMin(event.target.value)}
                />
              </Field>
            </FieldGroup>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base">Stops</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setStops((prev) => [...prev, makeStop()])}
                >
                  Add stop
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {stops.map((stop, index) => (
                  <div key={stop.key} className="grid gap-2 md:grid-cols-3">
                    <Input
                      placeholder={`Stop ${index + 1} label`}
                      value={stop.label}
                      onChange={(event) =>
                        setStops((prev) =>
                          prev.map((item) =>
                            item.key === stop.key ? { ...item, label: event.target.value } : item,
                          ),
                        )
                      }
                    />
                    <Input
                      placeholder="Address (optional)"
                      value={stop.address}
                      onChange={(event) =>
                        setStops((prev) =>
                          prev.map((item) =>
                            item.key === stop.key ? { ...item, address: event.target.value } : item,
                          ),
                        )
                      }
                    />
                    <div className="flex gap-2">
                      <Input
                        placeholder="ETA offset min"
                        type="number"
                        min={0}
                        value={stop.offset}
                        onChange={(event) =>
                          setStops((prev) =>
                            prev.map((item) =>
                              item.key === stop.key
                                ? { ...item, offset: event.target.value }
                                : item,
                            ),
                          )
                        }
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setStops((prev) =>
                            prev.length === 1
                              ? [makeStop()]
                              : prev.filter((item) => item.key !== stop.key),
                          )
                        }
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button onClick={onCreate} disabled={saving}>
                Save route plan
              </Button>
              <Button variant="outline" onClick={() => navigate('/fleet-transport/routes/plans')}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </ScrollableWrapper>
  );
}
