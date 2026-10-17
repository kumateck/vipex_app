const mask = (word: string, keep: number) =>
  word.length <= keep ? word : word.slice(0, keep) + '*'.repeat(word.length - keep);

/**
 * "Ama Owusu" -> "Ama O****", "Kwame" -> "Kw***". The real receiver can recognise their
 * name, but anyone else holding the tracking code never receives it in full.
 * Same rule as the public website's `maskName`, and idempotent, so the website can keep
 * masking without changing the result.
 */
export function maskReceiverName(name: string | null | undefined): string | null {
  const [first, ...rest] = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (!first) return null;
  if (rest.length === 0) return mask(first, 2);
  return [first, ...rest.map((word) => mask(word, 1))].join(' ');
}
