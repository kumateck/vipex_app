import { useCallback, useMemo, useRef, useState } from 'react';
import {
  MAX_BATCH_PARCELS,
  normalizeBatchTelephone,
  type BatchHandoverChannel,
  type BatchOtpProof,
  type BatchPaymentMethod,
  type BatchOtpSession,
  type BatchPickupPage,
  type BatchPickupParcel,
} from '@/shared/shipments/parcel-batch-handover';
import {
  isReceiverCashierSignature,
  type ReceiverCashierSignature,
} from '@/shared/shipments/receiver-cashier-signature';
import type { BatchHandoverApi } from '../../types';

export function useBatchHandover(api: BatchHandoverApi, onConfirmed?: () => void) {
  const [draft, setDraft] = useState('');
  const [telephone, setTelephone] = useState('');
  const [page, setPage] = useState<BatchPickupPage>();
  const [selected, setSelected] = useState<BatchPickupParcel[]>([]);
  const [associateId, setAssociateId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<BatchPaymentMethod>('cash');
  const [channel, setChannel] = useState<BatchHandoverChannel>('sms');
  const [session, setSession] = useState<BatchOtpSession>();
  const [otp, setOtp] = useState('');
  const [proof, setProof] = useState<BatchOtpProof>();
  const [signature, setSignature] = useState<ReceiverCashierSignature>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [completedCount, setCompletedCount] = useState(0);
  const locked = useRef(false);
  const selectedIds = useMemo(() => new Set(selected.map(({ id }) => id)), [selected]);
  const totalPsw = selected.reduce((sum, row) => sum + row.principalPsw + row.storagePsw, 0);
  const needsAssociate = selected.some((row) => row.needsAssociate);

  const resetOtp = () => {
    setSession(undefined);
    setProof(undefined);
    setSignature(undefined);
    setOtp('');
    setError('');
  };
  const run = async (action: () => Promise<void>, fallback: string) => {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    setError('');
    try {
      await action();
    } catch (failure) {
      setError(api.errorMessage(failure, fallback));
    } finally {
      setBusy(false);
      locked.current = false;
    }
  };
  const search = (more = false) => {
    const target = more ? telephone : normalizeBatchTelephone(draft);
    if (!more && (!/^[+0-9 ().-]+$/.test(draft) || !/^0[0-9]{9}$/.test(target))) {
      setError('Enter a complete receiver telephone number.');
      return;
    }
    return run(async () => {
      const result = await api.search({
        telephone: target,
        after: more ? (page?.next ?? undefined) : undefined,
      });
      if (more) {
        setPage((previous) => ({ ...result, rows: [...(previous?.rows ?? []), ...result.rows] }));
      } else {
        resetOtp();
        setSelected([]);
        setAssociateId('');
        setCompletedCount(0);
        setTelephone(target);
        setPage(result);
      }
    }, 'Unable to find parcels.');
  };
  const toggle = useCallback((row: BatchPickupParcel) => {
    if (locked.current || row.blockedReason) return;
    setError('');
    setSelected((previous) =>
      previous.some(({ id }) => id === row.id)
        ? previous.filter(({ id }) => id !== row.id)
        : previous.length < MAX_BATCH_PARCELS
          ? [...previous, row]
          : previous,
    );
  }, []);
  const selection = () => ({
    telephone,
    items: selected.map(({ id, receiverId, principalPsw, storagePsw }) => ({
      id,
      receiverId,
      principalPsw,
      storagePsw,
    })),
  });

  const sendOtp = () =>
    run(async () => {
      const next = await api.requestOtp({ ...selection(), channel });
      resetOtp();
      setSession(next);
    }, 'Unable to send the pickup OTP.');

  const verifyOtp = () => {
    if (!session || !/^[0-9]{6}$/.test(otp)) return;
    return run(async () => {
      setProof(await api.verifyOtp({ id: session.id, otp }));
      setOtp('');
    }, 'Unable to verify the pickup OTP.');
  };

  const confirm = (useSavedSignature = false) => {
    if (
      !session ||
      !proof ||
      (!useSavedSignature && (!signature || !isReceiverCashierSignature(signature)))
    )
      return;
    return run(async () => {
      const result = await api.confirm({
        ...selection(),
        id: session.id,
        verificationToken: proof.verificationToken,
        associateId: needsAssociate ? associateId : undefined,
        signature: useSavedSignature ? undefined : signature,
        paymentMethod: totalPsw > 0 ? paymentMethod : undefined,
      });
      setCompletedCount(result.parcelIds.length);
      resetOtp();
      onConfirmed?.();
    }, 'Unable to confirm receipt for the selected parcels.');
  };

  return {
    draft,
    setDraft,
    telephone,
    page,
    selected,
    selectedIds,
    toggle,
    totalPsw,
    needsAssociate,
    associateId,
    setAssociateId,
    paymentMethod,
    setPaymentMethod,
    channel,
    setChannel,
    session,
    otp,
    setOtp,
    proof,
    signature,
    setSignature,
    busy,
    error,
    completedCount,
    search,
    sendOtp,
    verifyOtp,
    confirm,
    changeSelection: resetOtp,
    signaturePreparation:
      session && proof
        ? {
            ...selection(),
            id: session.id,
            verificationToken: proof.verificationToken,
          }
        : undefined,
    readyToSend:
      normalizeBatchTelephone(draft) === telephone &&
      selected.length >= 2 &&
      (!needsAssociate || Boolean(associateId)),
  };
}
