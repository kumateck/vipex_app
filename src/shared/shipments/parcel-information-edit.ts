export type ParcelInformationEdit = {
  id: string;
  parcelDetails?: string;
  parcelContent?: string;
  receiver?: {
    id: string;
    fullname?: string;
    telephone?: string | null;
  };
};

type Original = {
  id: string;
  parcelDetails: string | null;
  parcelContent?: string | null;
  receiverId?: string;
  receiverName?: string | null;
  receiverPhone?: string | null;
};

export function buildParcelInformationEdit(
  original: Original,
  values: {
    parcelDetails: string;
    parcelContent?: string;
    receiverName: string;
    receiverPhone: string;
  },
): ParcelInformationEdit | null {
  const patch: ParcelInformationEdit = { id: original.id };
  const parcelDetails = values.parcelDetails.trim();
  const fullname = values.receiverName.trim();
  const telephone = values.receiverPhone.replace(/\D/g, '') || null;
  if (parcelDetails !== (original.parcelDetails ?? '').trim()) patch.parcelDetails = parcelDetails;
  if (
    values.parcelContent !== undefined &&
    values.parcelContent.trim() !== (original.parcelContent ?? '').trim()
  ) {
    patch.parcelContent = values.parcelContent.trim();
  }
  const nameChanged = fullname !== (original.receiverName ?? '').trim();
  const phoneChanged = telephone !== (original.receiverPhone?.replace(/\D/g, '') || null);
  if (nameChanged || phoneChanged) {
    if (!original.receiverId)
      throw new Error('Receiver customer could not be identified; reload and try again');
    patch.receiver = { id: original.receiverId };
    if (nameChanged) patch.receiver.fullname = fullname;
    if (phoneChanged) patch.receiver.telephone = telephone;
  }
  return Object.keys(patch).length > 1 ? patch : null;
}
