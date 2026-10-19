export type EditableParcelInformation = {
  id: string;
  sourceId?: string;
  bookingCode: string;
  parcelDetails: string | null;
  senderId?: string;
  senderName?: string | null;
  senderPhone?: string | null;
  receiverId: string;
  receiverName: string | null;
  receiverPhone: string | null;
  isDeleted?: boolean;
};
