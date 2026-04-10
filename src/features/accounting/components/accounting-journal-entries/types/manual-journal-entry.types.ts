export type ManualLineForm = {
  accountId: string;
  entryType: 'debit' | 'credit';
  amountCedis: string;
  description: string;
};

export function createEmptyManualLine(): ManualLineForm {
  return { accountId: '', entryType: 'debit', amountCedis: '', description: '' };
}

export function parseCedisToPesewas(value: string) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0) return null;
  return Math.round(amount * 100);
}
