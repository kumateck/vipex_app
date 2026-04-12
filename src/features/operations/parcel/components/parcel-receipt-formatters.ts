export function formatMoney(amount: number) {
  return `GH₵ ${amount.toFixed(2)}`;
}

export function formatDate(isoDate: string) {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString();
}

function toWordsUnderThousand(n: number): string {
  const under20 = [
    'zero',
    'one',
    'two',
    'three',
    'four',
    'five',
    'six',
    'seven',
    'eight',
    'nine',
    'ten',
    'eleven',
    'twelve',
    'thirteen',
    'fourteen',
    'fifteen',
    'sixteen',
    'seventeen',
    'eighteen',
    'nineteen',
  ];
  const tens = [
    '',
    '',
    'twenty',
    'thirty',
    'forty',
    'fifty',
    'sixty',
    'seventy',
    'eighty',
    'ninety',
  ];

  if (n < 20) return under20[n] ?? '';
  if (n < 100) {
    const t = Math.floor(n / 10);
    const r = n % 10;
    return r ? `${tens[t]}-${under20[r]}` : (tens[t] ?? '');
  }

  const h = Math.floor(n / 100);
  const r = n % 100;
  return r ? `${under20[h]} hundred and ${toWordsUnderThousand(r)}` : `${under20[h]} hundred`;
}

export function toAmountWords(amount: number) {
  if (!Number.isFinite(amount) || amount < 0) return 'invalid amount';
  const whole = Math.floor(amount);
  const cents = Math.round((amount - whole) * 100);

  const toWords = (value: number): string => {
    if (value === 0) return 'zero';
    if (value < 1000) return toWordsUnderThousand(value);
    if (value < 1_000_000) {
      const thousands = Math.floor(value / 1000);
      const remainder = value % 1000;
      return remainder
        ? `${toWordsUnderThousand(thousands)} thousand ${toWordsUnderThousand(remainder)}`
        : `${toWordsUnderThousand(thousands)} thousand`;
    }
    return String(value);
  };

  if (cents === 0) return `${toWords(whole)} Ghana cedis only`;
  return `${toWords(whole)} Ghana cedis and ${toWords(cents)} pesewas`;
}

export function getPaymentModeLabel(senderPaidCedis: number, receiverToPayCedis: number) {
  if (senderPaidCedis > 0 && receiverToPayCedis > 0) return 'Shared Payment';
  if (senderPaidCedis > 0 && receiverToPayCedis <= 0) return 'Sender Paid';
  return 'Receiver Pays';
}
