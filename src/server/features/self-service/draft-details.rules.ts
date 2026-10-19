import { BadRequest } from '@/server/utils/http-error';
import { toPesewas } from '@/server/utils/gh-money';

export type DraftDetailsInput = {
  // Omitted by web, which picks the destination at completion; the draft destination is kept.
  destinationBranchId?: string;
  destinationLocationId?: string | null;
  parcelContent: string;
  parcelValueCedis: number | string;
};

// Same parcel rules the public submission applies in public-draft.service.ts.
export function normalizeDraftParcel(
  input: Pick<DraftDetailsInput, 'parcelContent' | 'parcelValueCedis'>,
) {
  const parcelContent = input.parcelContent.trim();
  if (!parcelContent || parcelContent.length > 255) throw BadRequest('Parcel content is required');
  const raw =
    typeof input.parcelValueCedis === 'string'
      ? input.parcelValueCedis.replace(/,/g, '').trim()
      : input.parcelValueCedis;
  if (raw === '' || !Number.isFinite(Number(raw)) || Number(raw) < 0)
    throw BadRequest('Enter a valid parcel value');
  return { parcelContent, parcelValuePsw: Number(toPesewas(raw)) };
}
