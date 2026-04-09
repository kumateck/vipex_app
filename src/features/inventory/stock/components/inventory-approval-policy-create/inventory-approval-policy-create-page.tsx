import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { useCreateInventoryApprovalPolicyMutation } from '@/features/inventory/api';

export function InventoryApprovalPolicyCreatePage() {
  const navigate = useNavigate();
  const [createPolicy, { isLoading }] = useCreateInventoryApprovalPolicyMutation();
  const [entityType, setEntityType] = useState('1');
  const [minAmount, setMinAmount] = useState('0');
  const [maxAmount, setMaxAmount] = useState('');
  const [slaHours, setSlaHours] = useState('24');

  return (
    <ScrollableWrapper>
      <form
        className="w-full p-4 max-w-xl space-y-4"
        onSubmit={async (event) => {
          event.preventDefault();
          await createPolicy({
            entityType: Number(entityType),
            minAmount: Number(minAmount),
            maxAmount: maxAmount ? Number(maxAmount) : null,
            slaHours: Number(slaHours),
            active: true,
          }).unwrap();
          navigate('/inventory/approval-policies');
        }}
      >
        <div className="space-y-1">
          <p className="text-sm font-medium">Entity Type</p>
          <input
            className="h-9 w-full rounded border px-3"
            value={entityType}
            onChange={(e) => setEntityType(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium">Minimum Amount</p>
          <input
            className="h-9 w-full rounded border px-3"
            value={minAmount}
            onChange={(e) => setMinAmount(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium">Maximum Amount (optional)</p>
          <input
            className="h-9 w-full rounded border px-3"
            value={maxAmount}
            onChange={(e) => setMaxAmount(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium">SLA Hours</p>
          <input
            className="h-9 w-full rounded border px-3"
            value={slaHours}
            onChange={(e) => setSlaHours(e.target.value)}
            required
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/inventory/approval-policies')}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            Save Policy
          </Button>
        </div>
      </form>
    </ScrollableWrapper>
  );
}
