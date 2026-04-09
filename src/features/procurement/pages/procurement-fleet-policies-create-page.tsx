import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  useCreateProcurementFleetPolicyMutation,
  useListProcurementSupplierOptionsQuery,
} from '../api/procurement.api';

export function ProcurementFleetPoliciesCreatePage() {
  const navigate = useNavigate();
  const [branchId, setBranchId] = useState('');
  const [preferredSupplierId, setPreferredSupplierId] = useState('__none__');
  const [demandUrgency, setDemandUrgency] = useState('1');
  const [replenishMultiplier, setReplenishMultiplier] = useState('1');
  const [note, setNote] = useState('');
  const [createRule, { isLoading }] = useCreateProcurementFleetPolicyMutation();
  const { data: suppliers = [] } = useListProcurementSupplierOptionsQuery();

  const onSubmit = async () => {
    try {
      await createRule({
        branchId: branchId.trim() ? branchId.trim() : null,
        preferredSupplierId: preferredSupplierId === '__none__' ? null : preferredSupplierId,
        demandUrgency: Number(demandUrgency),
        replenishMultiplier: Number(replenishMultiplier),
        isActive: true,
        note: note.trim() || null,
      }).unwrap();
      toast.success('Fleet procurement policy rule created');
      navigate('/procurement/fleet-policies');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create policy rule');
    }
  };

  return (
    <ScrollableWrapper>
      <div className="w-full p-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Create Fleet Procurement Policy Rule</CardTitle>
            <Button asChild variant="outline">
              <Link to="/procurement/fleet-policies">Back to list</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              value={branchId}
              onChange={(event) => setBranchId(event.target.value)}
              placeholder="Branch ID (leave blank for global)"
            />
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
            <Input
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Note (optional)"
            />
            <div className="flex gap-2">
              <Button onClick={onSubmit} disabled={isLoading}>
                Create rule
              </Button>
              <Button variant="outline" onClick={() => navigate('/procurement/fleet-policies')}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </ScrollableWrapper>
  );
}
