import {
  listConsignmentItems,
  mobileApiPost,
  type ConsignmentItem,
  type ReceiveConsignmentItemResult,
} from '@mobile/lib/api';

export type ReceivingConsignmentItem = ConsignmentItem & {
  pickupLocationName?: string | null;
  receivingOfficeName?: string | null;
};

export function listReceivingConsignmentItems(
  token: string,
  consignmentId: string,
): Promise<ReceivingConsignmentItem[]> {
  return listConsignmentItems(token, consignmentId);
}

export function receiveConsignmentParcel(
  token: string,
  consignmentId: string,
  code: string,
  receivingOfficeId?: string,
) {
  return mobileApiPost<ReceiveConsignmentItemResult>({
    path: `/shipments/consignments/${consignmentId}/receive`,
    token,
    body: { code, receivingOfficeId },
  });
}
