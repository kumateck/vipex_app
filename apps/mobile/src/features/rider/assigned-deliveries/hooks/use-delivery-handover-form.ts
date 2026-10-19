import { useCallback, useState } from 'react';
import type { RiderDoorstepRecord } from '@mobile/types/parcels';
import type { DeliveryHandoverInput } from '../types';
import {
  getOutstandingDeliveryFeePsw,
  getOutstandingPrincipalPsw,
  getRiderHandoverReceiver,
} from '../utils';

export function useDeliveryHandoverForm(
  delivery: RiderDoorstepRecord,
  busy: boolean,
  onConfirm: (input: DeliveryHandoverInput) => void,
) {
  const [signature, setSignature] = useState({ key: '', image: '' });
  const [principal, setPrincipal] = useState(() =>
    (getOutstandingPrincipalPsw(delivery) / 100).toFixed(2),
  );
  const [deliveryFee, setDeliveryFee] = useState(() =>
    (getOutstandingDeliveryFeePsw(delivery) / 100).toFixed(2),
  );
  const [target, setTarget] = useState<'main' | 'second'>('main');
  const signatureKey = `${target}:${delivery.secondReceiverId ?? ''}`;
  const signatureImage = signature.key === signatureKey ? signature.image : '';
  const setSignatureImage = useCallback(
    (image: string) => {
      setSignature({ key: signatureKey, image });
    },
    [signatureKey],
  );
  const receiver = getRiderHandoverReceiver(target, delivery);
  const principalAmountCedis = Number(principal || 0);
  const deliveryFeeAmountCedis = Number(deliveryFee || 0);
  const amountsValid =
    Number.isFinite(principalAmountCedis) &&
    Number.isFinite(deliveryFeeAmountCedis) &&
    principalAmountCedis >= 0 &&
    deliveryFeeAmountCedis >= 0;
  const canSubmit = Boolean(signatureImage) && amountsValid && !receiver.error && !busy;
  const changeReceiver = (update: () => void) => {
    update();
    setSignatureImage('');
  };

  return {
    principal,
    setPrincipal,
    deliveryFee,
    setDeliveryFee,
    setSignatureImage,
    signatureKey,
    amountsValid,
    canSubmit,
    receiver: {
      target,
      mainName: delivery.receiverName ?? 'Main receiver',
      mainPhone: delivery.receiverPhone,
      secondName: delivery.secondReceiverName ?? 'Second receiver',
      secondPhone: delivery.secondReceiverPhone,
      hasSecondReceiver: Boolean(delivery.secondReceiverId),
      error: receiver.error,
      setTarget: (value: 'main' | 'second') => changeReceiver(() => setTarget(value)),
    },
    confirm: () => {
      if (canSubmit)
        onConfirm({
          signatureImage,
          principalAmountCedis,
          deliveryFeeAmountCedis,
          ...receiver.input,
        });
    },
  };
}
