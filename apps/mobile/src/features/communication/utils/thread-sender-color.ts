export function getSenderNameColor(seed: string, isDark: boolean) {
  const key = seed.trim().toLowerCase();
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash << 5) - hash + key.charCodeAt(i);
    hash |= 0;
  }

  const lightPalette = ['#C83D2F', '#1C315B', '#138C5A', '#B88100', '#0F6D9C', '#8E3A8B'];
  const darkPalette = ['#F97066', '#9AB6E3', '#5EE6AA', '#F6C453', '#79D5FF', '#E0A5F0'];
  const palette = isDark ? darkPalette : lightPalette;

  return palette[Math.abs(hash) % palette.length] ?? palette[0];
}
