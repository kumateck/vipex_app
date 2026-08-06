export const mobileSpacing = Object.freeze({
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  xxxl: 40,
});

export const mobileRadius = Object.freeze({
  sm: 8,
  md: 12,
  lg: 18,
  xl: 22,
  pill: 999,
});

export const mobileTypography = Object.freeze({
  title: 24,
  subtitle: 14,
  sectionTitle: 16,
  label: 13,
  body: 14,
  caption: 12,
  kpi: 22,
});

/**
 * iOS text-style scale (size/lineHeight/weight/tracking). Prefer this over the
 * flat `mobileTypography` sizes for new/restyled screens.
 */
export const mobileTextStyles = Object.freeze({
  largeTitle: { fontSize: 30, lineHeight: 36, fontWeight: '700', letterSpacing: -0.4 },
  title1: { fontSize: 24, lineHeight: 30, fontWeight: '700', letterSpacing: -0.3 },
  title2: { fontSize: 20, lineHeight: 25, fontWeight: '700', letterSpacing: 0 },
  title3: { fontSize: 18, lineHeight: 23, fontWeight: '600', letterSpacing: 0 },
  headline: { fontSize: 17, lineHeight: 22, fontWeight: '600', letterSpacing: 0 },
  body: { fontSize: 15, lineHeight: 21, fontWeight: '400', letterSpacing: 0 },
  callout: { fontSize: 15, lineHeight: 20, fontWeight: '400', letterSpacing: 0 },
  subhead: { fontSize: 14, lineHeight: 19, fontWeight: '400', letterSpacing: 0 },
  footnote: { fontSize: 13, lineHeight: 18, fontWeight: '400', letterSpacing: 0 },
  caption1: { fontSize: 12, lineHeight: 16, fontWeight: '400', letterSpacing: 0 },
  caption2: { fontSize: 11, lineHeight: 13, fontWeight: '400', letterSpacing: 0 },
  eyebrow: { fontSize: 12, lineHeight: 15, fontWeight: '700', letterSpacing: 0.4 },
} as const);

/**
 * Elevation presets. shadowColor stays black in both themes — dark-mode depth
 * comes primarily from the bg/card surface contrast (see theme/tokens.ts),
 * matching iOS Human Interface Guidelines for dark-mode elevation.
 */
export const mobileShadow = Object.freeze({
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 3,
  },
  floating: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 30,
    elevation: 8,
  },
  modal: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.22,
    shadowRadius: 40,
    elevation: 16,
  },
} as const);
