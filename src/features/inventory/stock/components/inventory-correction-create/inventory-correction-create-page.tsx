import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { usePostInventoryCorrectionMutation } from '@/features/inventory/api';

export function InventoryCorrectionCreatePage() {
  const navigate = useNavigate();
  const [postCorrection, { isLoading }] = usePostInventoryCorrectionMutation();
  const [productId, setProductId] = useState('');
  const [locationId, setLocationId] = useState('');
  const [quantityChange, setQuantityChange] = useState('');
  const [notes, setNotes] = useState('');

  return (
    <ScrollableWrapper>
      <form
        className="w-full p-4 max-w-xl space-y-4"
        onSubmit={async (event) => {
          event.preventDefault();
          await postCorrection({
            productId,
            locationId,
            quantityChange,
            notes: notes || undefined,
          }).unwrap();
          navigate('/inventory/audit/journal');
        }}
      >
        <div className="space-y-1">
          <p className="text-sm font-medium">Product ID</p>
          <input
            className="h-9 w-full rounded border px-3"
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium">Location ID</p>
          <input
            className="h-9 w-full rounded border px-3"
            value={locationId}
            onChange={(e) => setLocationId(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium">Quantity Change (+/-)</p>
          <input
            className="h-9 w-full rounded border px-3"
            value={quantityChange}
            onChange={(e) => setQuantityChange(e.target.value)}
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
            onClick={() => navigate('/inventory/audit/journal')}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            Post Correction
          </Button>
        </div>
      </form>
    </ScrollableWrapper>
  );
}
