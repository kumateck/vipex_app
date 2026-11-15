export function formatBatchAmount(pesewas: number) {
  return `GH₵ ${(pesewas / 100).toFixed(2)}`;
}
