import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-searchable';
import {
  useGetProcurementFleetPolicyByIdQuery,
  useListProcurementSupplierOptionsQuery,
  useUpdateProcurementFleetPolicyMutation,
} from '../../api/procurement.api';

export function ProcurementFleetPoliciesEditPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { data, isLoading } = useGetProcurementFleetPolicyByIdQuery(id, { skip: !id });
  const { data: suppliers = [] } = useListProcurementSupplierOptionsQuery();
  const [updateRule, { isLoading: updating }] = useUpdateProcurementFleetPolicyMutation();

  const [preferredSupplierId, setPreferredSupplierId] = useState('__none__');
  const [demandUrgency, setDemandUrgency] = useState('1');
  const [replenishMultiplier, setReplenishMultiplier] = useState('1');
  const [isActive, setIsActive] = useState('true');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!data) return;
    setPreferredSupplierId(data.preferredSupplierId ?? '__none__');
    setDemandUrgency(String(data.demandUrgency));
    setReplenishMultiplier(String(data.replenishMultiplier));
    setIsActive(data.isActive ? 'true' : 'false');
    setNote(data.note ?? '');
  }, [data]);

  const onSubmit = async () => {
    if (!id) return;
    try {
      await updateRule({
        id,
        body: {
          preferredSupplierId: preferredSupplierId === '__none__' ? null : preferredSupplierId,
          demandUrgency: Number(demandUrgency),
          replenishMultiplier: Number(replenishMultiplier),
          isActive: isActive === 'true',
          note: note.trim() || null,
        },
      }).unwrap();
      toast.success('Fleet procurement policy rule updated');
      navigate('/procurement/fleet-policies');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update policy rule');
    }
  };

  return (
    <ScrollableWrapper>
      <div className="w-full p-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Edit Fleet Procurement Policy Rule</CardTitle>
            <Button asChild variant="outline">
              <Link to="/procurement/fleet-policies">Back to list</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading policy rule...</p>
            ) : null}
            {!isLoading && !data ? (
              <p className="text-sm text-muted-foreground">Policy rule not found.</p>
            ) : null}
            {data ? (
              <>
                <Select value={preferredSupplierId} onValueChange={setPreferredSupplierId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Preferred supplier (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">No preferred supplier</SelectItem>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={demandUrgency} onValueChange={setDemandUrgency}>
                  <SelectTrigger>
                    <SelectValue placeholder="Demand urgency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Low</SelectItem>
                    <SelectItem value="1">Normal</SelectItem>
                    <SelectItem value="2">High</SelectItem>
                    <SelectItem value="3">Critical</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  min={1}
                  max={5}
                  value={replenishMultiplier}
                  onChange={(event) => setReplenishMultiplier(event.target.value)}
                  placeholder="Replenish multiplier (1-5)"
                />
                <Select value={isActive} onValueChange={setIsActive}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Active</SelectItem>
                    <SelectItem value="false">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="Note (optional)"
                />
                <div className="flex gap-2">
                  <Button onClick={onSubmit} disabled={updating}>
                    Save changes
                  </Button>
                  <Button variant="outline" onClick={() => navigate('/procurement/fleet-policies')}>
                    Cancel
                  </Button>
                </div>
              </>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </ScrollableWrapper>
  );
}
