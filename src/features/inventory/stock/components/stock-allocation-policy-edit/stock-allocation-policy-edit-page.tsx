import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth-store';
import {
  useGetStockAllocationPolicyQuery,
  useUpsertStockAllocationPolicyMutation,
} from '@/features/inventory/api';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-searchable';

export function StockAllocationPolicyEditPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const { data } = useGetStockAllocationPolicyQuery(
    { companyId: user?.company?.id ?? '' },
    { skip: !user?.company?.id },
  );

  const [strategy, setStrategy] = useState('0');
  const [allowPartial, setAllowPartial] = useState('1');
  const [prioritizeSameBranch, setPrioritizeSameBranch] = useState('1');
  const [maxSourceLocations, setMaxSourceLocations] = useState('3');
  const [active, setActive] = useState('1');

  const [savePolicy, { isLoading }] = useUpsertStockAllocationPolicyMutation();

  useEffect(() => {
    if (!data) return;
    setStrategy(String(data.strategy));
    setAllowPartial(data.allowPartial ? '1' : '0');
    setPrioritizeSameBranch(data.prioritizeSameBranch ? '1' : '0');
    setMaxSourceLocations(String(data.maxSourceLocations));
    setActive(data.active ? '1' : '0');
  }, [data]);

  const onSubmit = async () => {
    try {
      await savePolicy({
        strategy: Number(strategy),
        allowPartial: allowPartial === '1',
        prioritizeSameBranch: prioritizeSameBranch === '1',
        maxSourceLocations: Number(maxSourceLocations),
        active: active === '1',
      }).unwrap();
      toast.success('Allocation policy saved');
      navigate('/inventory/stock-allocation-policy');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save policy');
    }
  };

  return (
    <ScrollableWrapper>
      <div className="w-full p-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Edit Stock Allocation Policy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Select value={strategy} onValueChange={setStrategy}>
              <SelectTrigger>
                <SelectValue placeholder="Strategy" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">FEFO</SelectItem>
                <SelectItem value="1">Oldest Receipt</SelectItem>
                <SelectItem value="2">Highest Available</SelectItem>
              </SelectContent>
            </Select>

            <Select value={allowPartial} onValueChange={setAllowPartial}>
              <SelectTrigger>
                <SelectValue placeholder="Allow Partial" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Allow Partial</SelectItem>
                <SelectItem value="0">Disallow Partial</SelectItem>
              </SelectContent>
            </Select>

            <Select value={prioritizeSameBranch} onValueChange={setPrioritizeSameBranch}>
              <SelectTrigger>
                <SelectValue placeholder="Prioritize Same Branch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Prioritize Same Branch</SelectItem>
                <SelectItem value="0">Do Not Prioritize Same Branch</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="number"
              min={1}
              max={10}
              value={maxSourceLocations}
              onChange={(event) => setMaxSourceLocations(event.target.value)}
              placeholder="Max source locations"
            />

            <Select value={active} onValueChange={setActive}>
              <SelectTrigger>
                <SelectValue placeholder="Active" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Active</SelectItem>
                <SelectItem value="0">Inactive</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={onSubmit} disabled={isLoading}>
              Save policy
            </Button>
          </CardContent>
        </Card>
      </div>
    </ScrollableWrapper>
  );
}
