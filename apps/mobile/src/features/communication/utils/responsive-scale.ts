export function getMobileScale(width: number) {
  if (width <= 360) return 0.92;
  if (width <= 390) return 1;
  if (width <= 430) return 1.06;
  return 1.12;
}
