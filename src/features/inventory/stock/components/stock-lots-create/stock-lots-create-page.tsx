import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import { useCreateStockLotMutation } from '@/features/inventory/api';

export function StockLotsCreatePage() {
  const navigate = useNavigate();
  const [createStockLot, { isLoading }] = useCreateStockLotMutation();
  const [productId, setProductId] = useState('');
  const [locationId, setLocationId] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [quantityOnHand, setQuantityOnHand] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [notes, setNotes] = useState('');

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      const result = await createStockLot({
        productId,
        locationId,
        batchNumber,
        quantityOnHand,
        expiryDate: expiryDate ? new Date(`${expiryDate}T00:00:00.000Z`).toISOString() : undefined,
        notes: notes || undefined,
      }).unwrap();
      toast.success('Stock lot saved');
      navigate(`/inventory/stock-lots/view/${result.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save stock lot');
    }
  };

  return (
    <ScrollableWrapper>
      <div className="w-full p-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Create Stock Lot</CardTitle>
            <Link className="underline text-sm" to="/inventory/stock-lots">
              Back to lots
            </Link>
          </CardHeader>
          <CardContent>
            <form className="space-y-4 max-w-xl" onSubmit={onSubmit}>
              <div className="space-y-2">
                <Label htmlFor="productId">Product ID</Label>
                <Input
                  id="productId"
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="locationId">Location ID</Label>
                <Input
                  id="locationId"
                  value={locationId}
                  onChange={(e) => setLocationId(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="batchNumber">Batch Number</Label>
                <Input
                  id="batchNumber"
                  value={batchNumber}
                  onChange={(e) => setBatchNumber(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantityOnHand">Quantity (base unit)</Label>
                <Input
                  id="quantityOnHand"
                  value={quantityOnHand}
                  onChange={(e) => setQuantityOnHand(e.target.value)}
                  inputMode="numeric"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiryDate">Expiry Date</Label>
                <DatePicker
                  date={expiryDate ? new Date(`${expiryDate}T00:00:00.000Z`) : undefined}
                  onDateChange={(date) =>
                    setExpiryDate(date ? date.toISOString().slice(0, 10) : '')
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
              <Button disabled={isLoading} type="submit">
                {isLoading ? 'Saving...' : 'Save lot'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </ScrollableWrapper>
  );
}
