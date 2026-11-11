import { ParcelNoteQueueScreen } from './parcel-note-queue-screen';

export function CallCenterAssignmentNotesScreen() {
  return <ParcelNoteQueueScreen queue="call-center" />;
}
export function ShelfPickerNotesScreen() {
  return <ParcelNoteQueueScreen queue="shelf-picker" />;
}
export function ReceiverCashierNotesScreen() {
  return <ParcelNoteQueueScreen queue="receiver-cashier-queue" />;
}
