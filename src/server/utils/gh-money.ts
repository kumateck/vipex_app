/* Ghana Cedis (GHS) money helpers + amount-in-words in Ghanaian English.
   - Input/Output for callers is in cedis (e.g., 12.50 means 12 cedis, 50 pesewas).
   - Internally we compute in pesewas (integer) for precision.
   - Amount-in-words examples:
     0        -> "Zero Ghana cedis only"
     0.5      -> "Fifty pesewas only"
     1        -> "One Ghana cedi only"
     1.01     -> "One Ghana cedi, one pesewa only"
     21.05    -> "Twenty-one Ghana cedis, five pesewas only"
     105      -> "One hundred and five Ghana cedis only"
     1000000.99 -> "One million Ghana cedis, ninety-nine pesewas only"
*/

import { sanitizeString } from '@/lib/utils';

export function toPesewas(cedis: number | string): bigint {
  const num = typeof cedis === 'string' ? Number(cedis) : cedis;
  if (!Number.isFinite(num)) throw new Error('Amount must be a finite number');
  return BigInt(Math.round(num * 100));
}

export function fromPesewas(pesewas: bigint): number {
  return Number(pesewas) / 100;
}

export function splitCedisPesewas(input: number | string): { cedis: bigint; pesewas: number } {
  const psw = toPesewas(input);
  const cedis = psw / 100n;
  const pesewas = Number(psw % 100n);
  return { cedis, pesewas };
}

// Optional pretty display like "GH₵1,234.50"
export function formatGhs(cedis: number, opts?: { currency?: 'GHS' | 'GH₵' | '₵' }) {
  const formatter =
    typeof Intl !== 'undefined' && 'NumberFormat' in Intl
      ? new Intl.NumberFormat('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : null;
  const formatted = formatter ? formatter.format(cedis) : cedis.toFixed(2);
  const prefix = opts?.currency === '₵' ? '₵' : opts?.currency === 'GH₵' ? 'GH₵' : 'GH₵';
  return `${prefix}${formatted}`;
}

/* ===== Number to words (British English style used in Ghana) ===== */

const SMALLS = [
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
] as const;

const TENS = [
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
] as const;

const SCALES = ['', 'thousand', 'million', 'billion', 'trillion', 'quadrillion'] as const;

// British-style "and" inside hundreds: 115 -> "one hundred and fifteen"
function chunkToWords(n: number): string {
  if (n === 0) return '';
  const words: string[] = [];
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;
  if (hundreds > 0) {
    words.push(`${SMALLS[hundreds]} hundred`);
    if (rest > 0) words.push('and');
  }
  if (rest > 0) {
    if (rest < 20) {
      words.push(SMALLS[rest] ?? '');
    } else {
      const t = Math.floor(rest / 10);
      const u = rest % 10;
      if (u === 0) {
        words.push(TENS[t] ?? '');
      } else {
        words.push(`${TENS[t]}-${SMALLS[u]}`);
      }
    }
  }
  return words.join(' ');
}

function numberToWords(n: bigint): string {
  if (n === 0n) return 'zero';
  if (n < 0n) return `minus ${numberToWords(-n)}`;

  const words: string[] = [];
  let scaleIndex = 0;
  let remaining = n;

  const chunks: { value: number; scale: string }[] = [];
  while (remaining > 0n && scaleIndex < SCALES.length) {
    const chunk = Number(remaining % 1000n);
    if (chunk > 0) chunks.push({ value: chunk, scale: sanitizeString(SCALES[scaleIndex]) });
    remaining = remaining / 1000n;
    scaleIndex++;
  }

  // Build from highest scale down
  for (let i = chunks.length - 1; i >= 0; i--) {
    const chunk = chunks[i];
    if (!chunk) continue;
    const { value, scale } = chunk;
    const phrase = chunkToWords(value);
    words.push(phrase + (scale ? ` ${scale}` : ''));
  }

  // Insert "and" for cases like 1,005 -> "one thousand and five"
  // If last chunk is < 100 and there is at least one higher chunk, add "and" before the last chunk segment.
  if (chunks.length >= 2 && chunks[0] && chunks[0].value < 100) {
    // Find last space-separated segment start to insert "and" before it.
    // Simpler: rebuild with explicit join and place "and" before final chunk when < 100.
    const top = words.slice(0, -1).join(' ');
    const last = words[words.length - 1]!;
    return `${top} and ${last}`;
  }

  return words.join(' ');
}

function titleCase(s: string): string {
  return s.replace(/\b([a-z])/g, (m) => m.toUpperCase());
}

function pluralize(word: string, n: bigint | number): string {
  const num = typeof n === 'number' ? BigInt(n) : n;
  if (word === 'cedi') return num === 1n ? 'cedi' : 'cedis';
  if (word === 'pesewa') return num === 1n ? 'pesewa' : 'pesewas';
  return num === 1n ? word : `${word}s`;
}

/**
 * Convert an amount to Ghanaian currency words.
 * @param amount Number or string in cedis (two decimals max; decimals are pesewas)
 * @param options
 *  - includeOnly: append " only" (default true)
 *  - capitalized: Title Case the phrase (default true)
 *  - includeGhana: include the word "Ghana" before cedi(s) (default true)
 *  - commaBetween: put a comma between cedis and pesewas parts (default true)
 */
export function ghanaAmountInWords(
  amount: number | string,
  options?: {
    includeOnly?: boolean;
    capitalized?: boolean;
    includeGhana?: boolean;
    commaBetween?: boolean;
  },
): string {
  const includeOnly = options?.includeOnly ?? true;
  const capitalized = options?.capitalized ?? true;
  const includeGhana = options?.includeGhana ?? true;
  const commaBetween = options?.commaBetween ?? true;

  const { cedis, pesewas } = splitCedisPesewas(amount);

  const parts: string[] = [];

  if (cedis > 0n) {
    const cediWords = numberToWords(cedis);
    const currency = includeGhana
      ? `Ghana ${pluralize('cedi', cedis)}`
      : `${pluralize('cedi', cedis)}`;
    parts.push(`${cediWords} ${currency}`);
  }

  if (pesewas > 0) {
    const pswWords = numberToWords(BigInt(pesewas));
    const currency = pluralize('pesewa', pesewas);
    const pswPart = `${pswWords} ${currency}`;
    if (cedis > 0n) {
      parts.push((commaBetween ? ', ' : ' and ') + pswPart);
    } else {
      parts.push(pswPart);
    }
  }

  if (parts.length === 0) {
    parts.push(includeGhana ? 'zero Ghana cedis' : 'zero cedis');
  }

  let phrase = parts.join('');
  if (includeOnly) phrase += ' only';
  if (capitalized) phrase = titleCase(phrase);

  return phrase;
}
