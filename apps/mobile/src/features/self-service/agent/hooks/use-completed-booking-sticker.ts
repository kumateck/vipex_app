import { useState } from 'react';
import { useAuth } from '@mobile/providers/auth-provider';
import {
  useMobileStickerPrint,
  useParcelBranchOptions,
} from '@mobile/features/parcel-create/hooks';
import type { CompletedSelfServiceBooking } from '../types';
import { buildCompletedBookingSticker } from '../utils';

export function useCompletedBookingSticker(completed: CompletedSelfServiceBooking) {
  const { session } = useAuth();
  const companyId = session.user?.company?.id ?? session.user?.companyId ?? null;
  const options = useParcelBranchOptions(companyId, completed.input.destinationId, true, false);
  const stickerPrint = useMobileStickerPrint();
  const [copies, setCopies] = useState('1');
  const [printing, setPrinting] = useState(false);
  const quantity = Number(copies);
  const validCopies = Number.isSafeInteger(quantity) && quantity > 0;
  const branch = options.branchOptions.find((item) => item.id === completed.input.destinationId);
  const location = options.locationOptions.find(
    (item) => item.id === completed.input.pickupLocationId,
  );
  const ready = Boolean(branch) && (!completed.input.pickupLocationId || Boolean(location));

  const print = async () => {
    if (!validCopies || !ready || printing || stickerPrint.pendingLog) return;
    const sticker = buildCompletedBookingSticker(
      completed,
      branch!.name,
      location?.name ?? '-',
      quantity,
    );
    if (!sticker) return;
    setPrinting(true);
    try {
      await stickerPrint.print(sticker);
    } finally {
      setPrinting(false);
    }
  };
  const retryLog = async () => {
    if (printing) return;
    setPrinting(true);
    try {
      await stickerPrint.retryLog();
    } finally {
      setPrinting(false);
    }
  };

  return {
    copies,
    setCopies,
    validCopies,
    ready,
    printing,
    print,
    retryLog,
    pendingLog: stickerPrint.pendingLog,
    loadingDestination: options.isLoadingBranches || options.isLoadingLocations,
    retryDestination: options.retry,
  };
}
