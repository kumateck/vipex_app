export const formatMoney = (valuePsw: number) => `GHS ${(valuePsw / 100).toFixed(2)}`;

export function formatPhones(primary?: string | null, secondary?: string | null) {
  const phones = [primary, secondary].filter((value): value is string => Boolean(value?.trim()));
  return phones.length ? phones.join(', ') : '-';
}
