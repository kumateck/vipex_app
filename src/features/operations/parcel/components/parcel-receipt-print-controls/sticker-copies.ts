export const MIN_STICKER_COPIES = 1;

export function normalizeStickerCopies(value: number) {
  if (!Number.isFinite(value)) return MIN_STICKER_COPIES;
  return Math.max(Math.trunc(value), MIN_STICKER_COPIES);
}
