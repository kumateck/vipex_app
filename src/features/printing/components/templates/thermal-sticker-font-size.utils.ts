export function portraitDestinationFontSize(value?: string | null) {
  return (value?.trim().length ?? 0) > 18 ? '6.6mm' : '8.4mm';
}

export function portraitReceiverNameFontSize(value?: string | null) {
  const length = value?.trim().length ?? 0;
  if (length > 26) return '3.2mm';
  if (length > 18) return '4mm';
  if (length > 12) return '5mm';
  return '6mm';
}

export function landscapePrimaryFontSize(value?: string | null) {
  const length = value?.length ?? 0;
  if (length > 34) return '3.5mm';
  if (length > 24) return '4.1mm';
  return '5mm';
}

export function landscapeReceiverNameFontSize(value?: string | null) {
  const length = value?.trim().length ?? 0;
  if (length > 36) return '3.3mm';
  if (length > 28) return '3.9mm';
  if (length > 20) return '4.8mm';
  if (length > 14) return '6mm';
  return '7mm';
}
