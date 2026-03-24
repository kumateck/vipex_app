import { useEffect, useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';
import { DataTable } from '@/components/datatable';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ReactSignature } from '@/components/ui/react-signature';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useAddCustomerCardMutation,
  useCreateCustomerMutation,
  useListCardOptionsQuery,
  useListCustomerCardsQuery,
} from '@/features/customers/api';
import { useUploadImageMutation } from '@/features/uploads/api/uploads.api';
import { useAuthStore } from '@/stores/auth-store';
import {
  type RiderDoorstepRecord,
  useListRiderDoorstepParcelsQuery,
  useRiderGivenParcelToCustomerMutation,
  useRiderReturnParcelToOfficeMutation,
} from '../api/parcel.api';

type CardMode = 'existing' | 'new';
type HandoverTarget = 'main' | 'second';

export function ParcelRiderCurrentPage() {
  const user = useAuthStore((state) => state.user);
  const riderUserId = user?.id ?? '';
  const [selected, setSelected] = useState<RiderDoorstepRecord | null>(null);
  const [signatureImage, setSignatureImage] = useState<string | undefined>(undefined);
  const [handoverTarget, setHandoverTarget] = useState<HandoverTarget>('main');

  const [mainCardMode, setMainCardMode] = useState<CardMode>('existing');
  const [mainExistingCardRecordId, setMainExistingCardRecordId] = useState('');
  const [mainNewCardTypeId, setMainNewCardTypeId] = useState('');
  const [mainNewCardNumber, setMainNewCardNumber] = useState('');

  const [secondCardMode, setSecondCardMode] = useState<CardMode>('new');
  const [secondExistingCardRecordId, setSecondExistingCardRecordId] = useState('');
  const [secondNewCardTypeId, setSecondNewCardTypeId] = useState('');
  const [secondNewCardNumber, setSecondNewCardNumber] = useState('');
  const [secondNewName, setSecondNewName] = useState('');
  const [secondNewPhone, setSecondNewPhone] = useState('');

  const { data } = useListRiderDoorstepParcelsQuery(
    { riderUserId, mode: 'current' },
    { skip: !riderUserId },
  );
  const { data: cardOptions = [] } = useListCardOptionsQuery();
  const { data: mainReceiverCards = [] } = useListCustomerCardsQuery(
    { customerId: selected?.receiverId ?? '' },
    { skip: !selected?.receiverId },
  );
  const { data: secondReceiverCards = [] } = useListCustomerCardsQuery(
    { customerId: selected?.secondReceiverId ?? '' },
    { skip: !selected?.secondReceiverId },
  );
  const [addCustomerCard] = useAddCustomerCardMutation();
  const [createCustomer] = useCreateCustomerMutation();
  const [uploadImage, { isLoading: isUploadingSignature }] = useUploadImageMutation();
  const [riderGiven, { isLoading: isConfirming }] = useRiderGivenParcelToCustomerMutation();
  const [riderReturned, { isLoading: isReturning }] = useRiderReturnParcelToOfficeMutation();

  useEffect(() => {
    if (!selected) return;
    if (mainReceiverCards.length === 0) {
      setMainCardMode('new');
      setMainExistingCardRecordId('');
    }
  }, [selected, mainReceiverCards.length]);

  const columns = useMemo<ColumnDef<RiderDoorstepRecord>[]>(
    () => [
      { accessorKey: 'trackingCode', header: 'Tracking' },
      { accessorKey: 'bookingCode', header: 'Booking' },
      { accessorKey: 'parcelDetails', header: 'Parcel Details' },
      {
        id: 'receiver',
        header: 'Receiver',
        accessorFn: (row) =>
          `${row.receiverName ?? '-'}${row.receiverPhone ? ` (${row.receiverPhone})` : ''}`,
      },
      {
        id: 'action',
        header: 'Action',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => {
                setSelected(row.original);
                setSignatureImage(undefined);
                setHandoverTarget(row.original.secondReceiverId ? 'second' : 'main');
                setMainCardMode('existing');
                setMainExistingCardRecordId('');
                setMainNewCardTypeId('');
                setMainNewCardNumber('');
                setSecondCardMode('new');
                setSecondExistingCardRecordId('');
                setSecondNewCardTypeId('');
                setSecondNewCardNumber('');
                setSecondNewName('');
                setSecondNewPhone('');
              }}
            >
              Delivery Details
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                try {
                  await riderReturned({ parcelId: row.original.parcelId, riderUserId }).unwrap();
                  toast.success('Parcel returned to branch pickup');
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : 'Failed to return parcel');
                }
              }}
              disabled={isReturning}
            >
              Return
            </Button>
          </div>
        ),
      },
    ],
    [riderReturned, riderUserId, isReturning],
  );

  async function resolveCardForCustomer(input: {
    customerId: string;
    mode: CardMode;
    existingRecordId: string;
    existingCards: Array<{ id: string; cardId: string; cardNumber: string }>;
    newCardTypeId: string;
    newCardNumber: string;
  }): Promise<{ cardId: string; cardNumber: string }> {
    if (input.mode === 'existing') {
      const found = input.existingCards.find((card) => card.id === input.existingRecordId);
      if (!found) throw new Error('Select an existing card');
      return { cardId: found.cardId, cardNumber: found.cardNumber };
    }

    const cardId = input.newCardTypeId.trim();
    const cardNumber = input.newCardNumber.trim();
    if (!cardId || !cardNumber) throw new Error('Select card type and enter card number');

    await addCustomerCard({ customerId: input.customerId, cardId, cardNumber }).unwrap();
    return { cardId, cardNumber };
  }

  const onConfirm = async () => {
    if (!selected) return;
    if (!signatureImage) {
      toast.error('Receiver signature is required');
      return;
    }

    try {
      let signatureUrl = signatureImage;
      if (signatureImage.startsWith('data:')) {
        const upload = await uploadImage({
          modelType: 'delivery-handover-signature',
          modelId: selected.parcelId,
          dataUrl: signatureImage,
          fileName: `${selected.parcelId}-handover-signature.png`,
        }).unwrap();
        signatureUrl = upload.url;
      }

      const mainCard = await resolveCardForCustomer({
        customerId: selected.receiverId,
        mode: mainCardMode,
        existingRecordId: mainExistingCardRecordId,
        existingCards: mainReceiverCards,
        newCardTypeId: mainNewCardTypeId,
        newCardNumber: mainNewCardNumber,
      });

      let secondReceiverId = selected.secondReceiverId;
      let secondCard: { cardId: string; cardNumber: string } | null = null;

      if (handoverTarget === 'second') {
        if (!secondReceiverId) {
          const fullname = secondNewName.trim();
          const telephone = secondNewPhone.trim();
          if (!fullname || !telephone) {
            toast.error('Second receiver name and telephone are required');
            return;
          }
          const created = await createCustomer({ fullname, telephone }).unwrap();
          secondReceiverId = created.id;
        }

        secondCard = await resolveCardForCustomer({
          customerId: secondReceiverId,
          mode: secondCardMode,
          existingRecordId: secondExistingCardRecordId,
          existingCards: secondReceiverCards,
          newCardTypeId: secondNewCardTypeId,
          newCardNumber: secondNewCardNumber,
        });
      }

      await riderGiven({
        parcelId: selected.parcelId,
        riderUserId,
        signatureImage: signatureUrl,
        secondReceiverId: secondReceiverId ?? null,
        cardId: mainCard.cardId,
        cardNumber: mainCard.cardNumber,
        secondCardId: secondCard?.cardId ?? null,
        secondCardNumber: secondCard?.cardNumber ?? null,
      }).unwrap();
      toast.success('Handover confirmed');
      setSelected(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to confirm handover');
    }
  };

  return (
    <div className="w-full p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Rider Current Deliveries</CardTitle>
          <CardDescription>
            Current dispatched parcels assigned to you. Confirm signature on handover.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2 text-sm">
            <p>
              <strong>Expected Delivery Fee:</strong> GHS{' '}
              {((data?.totals.expectedDeliveryFeePsw ?? 0) / 100).toFixed(2)}
            </p>
            <p>
              <strong>Expected To Be Paid:</strong> GHS{' '}
              {((data?.totals.expectedToBePaidPsw ?? 0) / 100).toFixed(2)}
            </p>
          </div>
          <DataTable
            mode="client"
            data={data?.rows ?? []}
            columns={columns}
            loading={false}
            enableVirtualization={false}
          />
        </CardContent>
      </Card>

      <Dialog open={Boolean(selected)} onOpenChange={(open) => (!open ? setSelected(null) : null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Delivery Handover</DialogTitle>
          </DialogHeader>
          {!selected ? null : (
            <div className="space-y-4">
              <div className="grid gap-2 text-sm">
                <p>
                  <strong>Tracking:</strong> {selected.trackingCode}
                </p>
                <p>
                  <strong>Address:</strong> {selected.dropoffAddress ?? '-'}
                </p>
              </div>

              <div className="rounded-md border p-3 text-center">
                <p className="text-2xl font-bold">
                  Delivery Fee: GHS {(selected.deliveryFeePsw / 100).toFixed(2)}
                </p>
                <p className="text-2xl font-bold">
                  To Be Paid: GHS {(selected.plannedToBePaidPsw / 100).toFixed(2)}
                </p>
              </div>

              <div className="space-y-2 rounded-md border p-3">
                <Label>Main Receiver ID Card (required)</Label>
                <Select value={mainCardMode} onValueChange={(v) => setMainCardMode(v as CardMode)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="existing" disabled={mainReceiverCards.length === 0}>
                      Use existing card
                    </SelectItem>
                    <SelectItem value="new">Add new card</SelectItem>
                  </SelectContent>
                </Select>
                {mainCardMode === 'existing' ? (
                  <Select
                    value={mainExistingCardRecordId}
                    onValueChange={setMainExistingCardRecordId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select existing card" />
                    </SelectTrigger>
                    <SelectContent>
                      {mainReceiverCards.map((card) => (
                        <SelectItem key={card.id} value={card.id}>
                          {card.cardName} - {card.cardNumber}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="grid gap-2 md:grid-cols-2">
                    <Select value={mainNewCardTypeId} onValueChange={setMainNewCardTypeId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select card type" />
                      </SelectTrigger>
                      <SelectContent>
                        {cardOptions.map((option) => (
                          <SelectItem key={option.id} value={option.id}>
                            {option.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      value={mainNewCardNumber}
                      onChange={(event) => setMainNewCardNumber(event.target.value)}
                      placeholder="Card number"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2 rounded-md border p-3">
                <Label>Who Received</Label>
                <Select
                  value={handoverTarget}
                  onValueChange={(v) => setHandoverTarget(v as HandoverTarget)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="main">Main Receiver</SelectItem>
                    <SelectItem value="second">Second Receiver</SelectItem>
                  </SelectContent>
                </Select>
                {handoverTarget === 'second' ? (
                  <div className="space-y-3">
                    {!selected.secondReceiverId ? (
                      <div className="grid gap-2 md:grid-cols-2">
                        <Input
                          value={secondNewName}
                          onChange={(event) => setSecondNewName(event.target.value)}
                          placeholder="Second receiver full name"
                        />
                        <Input
                          value={secondNewPhone}
                          onChange={(event) => setSecondNewPhone(event.target.value)}
                          placeholder="Second receiver telephone"
                        />
                      </div>
                    ) : null}
                    <Select
                      value={secondCardMode}
                      onValueChange={(v) => setSecondCardMode(v as CardMode)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="existing" disabled={secondReceiverCards.length === 0}>
                          Use existing card
                        </SelectItem>
                        <SelectItem value="new">Add new card</SelectItem>
                      </SelectContent>
                    </Select>
                    {secondCardMode === 'existing' ? (
                      <Select
                        value={secondExistingCardRecordId}
                        onValueChange={setSecondExistingCardRecordId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select second receiver card" />
                        </SelectTrigger>
                        <SelectContent>
                          {secondReceiverCards.map((card) => (
                            <SelectItem key={card.id} value={card.id}>
                              {card.cardName} - {card.cardNumber}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="grid gap-2 md:grid-cols-2">
                        <Select value={secondNewCardTypeId} onValueChange={setSecondNewCardTypeId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select card type" />
                          </SelectTrigger>
                          <SelectContent>
                            {cardOptions.map((option) => (
                              <SelectItem key={option.id} value={option.id}>
                                {option.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          value={secondNewCardNumber}
                          onChange={(event) => setSecondNewCardNumber(event.target.value)}
                          placeholder="Second receiver card number"
                        />
                      </div>
                    )}
                  </div>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label>Receiver Signature</Label>
                <ReactSignature onChange={setSignatureImage} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelected(null)}>
              Cancel
            </Button>
            <Button onClick={onConfirm} disabled={isConfirming || isUploadingSignature}>
              {isUploadingSignature
                ? 'Uploading Signature...'
                : isConfirming
                  ? 'Saving...'
                  : 'Confirm Handover'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
