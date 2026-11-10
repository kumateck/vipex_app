export type SignaturePoint = { x: number; y: number };

export const MAX_HANDOVER_SIGNATURE_LENGTH = 250_000;
const DATA_URL_PREFIX = 'data:image/svg+xml;utf8,';
const SVG_PREFIX = '<svg xmlns="http://www.w3.org/2000/svg" width="';
const PATH_PREFIX = '"><rect width="100%" height="100%" fill="white"/><path d="';
const SVG_SUFFIX =
  '" fill="none" stroke="#111827" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';

export function encodeHandoverSignature(
  strokes: SignaturePoint[][],
  width: number,
  height: number,
) {
  const paths = strokes
    .filter((stroke) => stroke.length > 1)
    .map((stroke) => `M ${stroke.map(({ x, y }) => `${x} ${y}`).join(' L ')}`)
    .join(' ');
  if (!paths) return '';
  const svg = `${SVG_PREFIX}${width}" height="${height}" viewBox="0 0 ${width} ${height}${PATH_PREFIX}${paths}${SVG_SUFFIX}`;
  return `${DATA_URL_PREFIX}${encodeURIComponent(svg)}`;
}

const NUMBER = /^-?\d+(?:\.\d+)?(?:e[+-]?\d+)?$/i;
const DIMENSIONS = /^([\d.]+)" height="([\d.]+)" viewBox="0 0 \1 \2$/;

/** Only accept the drawing pad's static SVG format and numeric drawing commands. */
export function isHandoverSignature(value: string) {
  if (value.length > MAX_HANDOVER_SIGNATURE_LENGTH || !value.startsWith(DATA_URL_PREFIX)) {
    return false;
  }
  try {
    const svg = decodeURIComponent(value.slice(DATA_URL_PREFIX.length));
    if (!svg.startsWith(SVG_PREFIX) || !svg.endsWith(SVG_SUFFIX)) return false;
    const [dimensions = '', path, extra] = svg
      .slice(SVG_PREFIX.length, -SVG_SUFFIX.length)
      .split(PATH_PREFIX);
    const size = DIMENSIONS.exec(dimensions);
    if (!size || !path || extra !== undefined || !(Number(size[1]) > 0 && Number(size[2]) > 0)) {
      return false;
    }
    const parts = path.split(' ');
    if (parts.length < 6 || parts.length % 3 !== 0 || parts[0] !== 'M') return false;
    let lastCommand = '';
    for (let index = 0; index < parts.length; index += 3) {
      const command = parts[index];
      const x = parts[index + 1] ?? '';
      const y = parts[index + 2] ?? '';
      if (command !== 'L' && (command !== 'M' || lastCommand === 'M')) return false;
      if (
        !NUMBER.test(x) ||
        !NUMBER.test(y) ||
        !Number.isFinite(Number(x)) ||
        !Number.isFinite(Number(y))
      ) {
        return false;
      }
      lastCommand = command;
    }
    return lastCommand === 'L';
  } catch {
    return false;
  }
}
