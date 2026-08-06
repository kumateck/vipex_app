import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import {
  useDecideReplenishmentProposalMutation,
  useGetReplenishmentProposalQuery,
} from '@/features/inventory/api';

export function InventoryReplenishmentProposalDetailPage() {
  const { id = '' } = useParams<{ id: string }>();
  const { data } = useGetReplenishmentProposalQuery(id, { skip: !id });
  const [decide, { isLoading }] = useDecideReplenishmentProposalMutation();

  if (!id) return null;

  return (
    <ScrollableWrapper>
      <div className="w-full p-4 space-y-4">
        <div className="rounded border p-4 space-y-1">
          <p className="text-sm font-medium">Proposal No</p>
          <p>{data?.proposalNo ?? '-'}</p>
          <p className="text-sm text-muted-foreground">Status: {data?.status ?? '-'}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={isLoading}
            onClick={() => void decide({ id, status: 1 })}
          >
            Submit
          </Button>
          <Button
            variant="outline"
            disabled={isLoading}
            onClick={() => void decide({ id, status: 2 })}
          >
            Approve
          </Button>
          <Button
            variant="outline"
            disabled={isLoading}
            onClick={() => void decide({ id, status: 3 })}
          >
            Reject
          </Button>
        </div>
        <div className="rounded border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left p-2">Product</th>
                <th className="text-left p-2">Location</th>
                <th className="text-left p-2">Current</th>
                <th className="text-left p-2">Min</th>
                <th className="text-left p-2">Suggested</th>
              </tr>
            </thead>
            <tbody>
              {(data?.lines ?? []).map((line) => (
                <tr key={line.id} className="border-b">
                  <td className="p-2">{line.productId}</td>
                  <td className="p-2">{line.locationId}</td>
                  <td className="p-2">{line.currentQuantity}</td>
                  <td className="p-2">{line.minStockLevel}</td>
                  <td className="p-2">{line.suggestedQuantity}</td>
                </tr>
              ))}
              {!data?.lines?.length ? (
                <tr>
                  <td className="p-3 text-muted-foreground" colSpan={5}>
                    No proposal lines available.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </ScrollableWrapper>
  );
}
