import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { useGenerateReplenishmentProposalMutation } from '@/features/inventory/api';

export function InventoryReplenishmentProposalCreatePage() {
  const navigate = useNavigate();
  const [createProposal, { isLoading }] = useGenerateReplenishmentProposalMutation();
  const [scopeLocationId, setScopeLocationId] = useState('');
  const [leadTimeDays, setLeadTimeDays] = useState('7');
  const [coverageDays, setCoverageDays] = useState('14');
  const [notes, setNotes] = useState('');

  return (
    <ScrollableWrapper>
      <form
        className="w-full p-4 max-w-xl space-y-4"
        onSubmit={async (event) => {
          event.preventDefault();
          const created = await createProposal({
            scopeLocationId: scopeLocationId || null,
            leadTimeDays: Number(leadTimeDays),
            coverageDays: Number(coverageDays),
            notes: notes || undefined,
          }).unwrap();
          navigate(`/inventory/replenishment-proposals/view/${created.id}`);
        }}
      >
        <div className="space-y-1">
          <p className="text-sm font-medium">Scope Location (optional)</p>
          <input
            className="h-9 w-full rounded border px-3"
            value={scopeLocationId}
            onChange={(e) => setScopeLocationId(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium">Lead Time Days</p>
          <input
            className="h-9 w-full rounded border px-3"
            value={leadTimeDays}
            onChange={(e) => setLeadTimeDays(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium">Coverage Days</p>
          <input
            className="h-9 w-full rounded border px-3"
            value={coverageDays}
            onChange={(e) => setCoverageDays(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium">Notes</p>
          <textarea
            className="min-h-24 w-full rounded border p-3"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/inventory/replenishment-proposals')}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            Generate
          </Button>
        </div>
      </form>
    </ScrollableWrapper>
  );
}
