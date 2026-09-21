type ShelfPickerAssignmentSource = {
  parcel: { shelfPickerStaffId: string | null };
  pickupQueue: { pickerStaffId: string | null } | null;
};

export function resolveShelfPickerStaffId(details: ShelfPickerAssignmentSource): string {
  return details.parcel.shelfPickerStaffId ?? details.pickupQueue?.pickerStaffId ?? '';
}
