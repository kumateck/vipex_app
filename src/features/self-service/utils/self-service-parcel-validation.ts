// Mirrors normalizeDraftParcel on the server (draft-details.rules.ts).
export function getSelfServiceParcelError(parcel: { content: string; value: string }) {
  if (!parcel.content.trim()) return 'Enter what is inside the parcel';
  const value = parcel.value.replace(/,/g, '').trim();
  if (!value || !Number.isFinite(Number(value)) || Number(value) < 0)
    return 'Enter a valid declared value';
  return null;
}
