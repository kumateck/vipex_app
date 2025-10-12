export function parseDurationToSeconds(input: string): number {
  const m = /^(\d+)([smhd])$/i.exec(input.trim());
  if (!m) throw new Error(`Invalid duration: ${input}`);
  const n = Number(m[1]);
  const unit = m?.[2]?.toLowerCase() ?? '';
  switch (unit) {
    case 's':
      return n;
    case 'm':
      return n * 60;
    case 'h':
      return n * 60 * 60;
    case 'd':
      return n * 60 * 60 * 24;
    default:
      throw new Error(`Invalid duration unit in: ${input}`);
  }
}
