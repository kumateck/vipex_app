import { ParcelStatus } from '@/db/schemas/enums';
import type { ParcelSearchRow, useUpdateParcelMutation } from '../../api/parcel.api';
import type {
  PickupOtpException,
  useConfirmSignedOfficePickupMutation,
} from './use-confirm-signed-office-pickup';

type SignedPickupBody = Parameters<ReturnType<typeof useConfirmSignedOfficePickupMutation>[0]>[0];

export async function submitWaitingPickupHandover(input: {
  parcel: ParcelSearchRow;
  handover: Omit<
    SignedPickupBody,
    | 'handoverTarget'
    | 'expectedMainReceiverId'
    | 'expectedSecondReceiverId'
    | 'signatureImage'
    | 'otpAuthorizationId'
  >;
  handoverTarget: 'main' | 'second';
  exception?: PickupOtpException;
  verificationToken?: string;
  confirmSignedOfficePickup: ReturnType<typeof useConfirmSignedOfficePickupMutation>[0];
  updateParcel: ReturnType<typeof useUpdateParcelMutation>[0];
}) {
  const { parcel, handover, exception, verificationToken } = input;
  if (exception) {
    return input
      .confirmSignedOfficePickup({
        ...handover,
        handoverTarget: input.handoverTarget,
        expectedMainReceiverId: parcel.receiverId,
        expectedSecondReceiverId: parcel.secondReceiverId ?? null,
        signatureImage: exception.signatureImage,
        otpAuthorizationId: exception.id,
      })
      .unwrap();
  }
  return input
    .updateParcel({
      ...handover,
      status: ParcelStatus.DELIVERED_BY_OFFICE,
      receiverOtpVerificationToken: verificationToken,
      receiverOtpTarget: verificationToken ? 'main' : undefined,
    })
    .unwrap();
}
