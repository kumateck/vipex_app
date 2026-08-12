export function portraitDestinationFontSize(value?: string | null) {
  return (value?.trim().length ?? 0) > 18 ? '6.6mm' : '8.4mm';
}

export function landscapePrimaryFontSize(value?: string | null) {
  const length = value?.length ?? 0;
  if (length > 34) return '3.5mm';
  if (length > 24) return '4.1mm';
  return '5mm';
}
