// Fixed participant color-coding palette: each chat sender is deterministically
// assigned one of these hues (via hash of their id/name) so names stay visually
// distinguishable in threads. This is intentionally NOT sourced from the shared
// theme tokens — it needs more distinct hues than the semantic palette provides,
// and the specific hues are irrelevant to brand identity. Not a token bypass.
const SENDER_LIGHT_PALETTE = ['#C83D2F', '#1C315B', '#138C5A', '#B88100', '#0F6D9C', '#8E3A8B'];
const SENDER_DARK_PALETTE = ['#F97066', '#9AB6E3', '#5EE6AA', '#F6C453', '#79D5FF', '#E0A5F0'];

export function getSenderNameColor(seed: string, isDark: boolean) {
  const key = seed.trim().toLowerCase();
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash << 5) - hash + key.charCodeAt(i);
    hash |= 0;
  }

  const palette = isDark ? SENDER_DARK_PALETTE : SENDER_LIGHT_PALETTE;

  return palette[Math.abs(hash) % palette.length] ?? palette[0];
}
