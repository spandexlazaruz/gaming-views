export const colors = {
  bgNav: '#0A0C10',
  bgPage: '#12161C',
  bgCard: '#1C2129',
  line: 'rgba(255,255,255,0.07)',
  white: '#FFFFFF',
  muted: '#9AA3AF',
  mutedDim: '#6B7280',
  orange: '#F4820A',
  orangeDim: 'rgba(244,130,10,0.14)',
  blue: '#2F7DE1',
};

// ADDED 2026-08-19: swapped from the original pastel palette to each
// platform holder's real brand color, per Dan's request, after reviewing
// mocked-up options against the live GameCard styling. Sourced with real
// confidence levels, not all equal:
// - xbox (#107C10): confirmed directly from Microsoft's own official Xbox
//   brand guidelines PDF (hex/RGB/CMYK/PMS all specified there).
// - pc (#66C0F4): Steam's real, consistently-used storefront accent blue —
//   and already live elsewhere in this app (see steamPrice below), so this
//   also makes the app internally consistent, not just accurate to Steam.
// - ps (#003791) / switch (#E60012): the PlayStation wordmark's cobalt blue
//   and Nintendo's corporate red, well-corroborated across multiple
//   independent brand-color references, but not cross-checked against
//   either company's own primary brand-guidelines PDF (both blocked/
//   unreachable during research) — worth a final visual gut-check against
//   the real PS5/Switch console branding before this ships.
// `textColor` is new too: these brand colors are mostly darker/more
// saturated than the old pastel set, so the app's previous "always dark
// text on the badge" convention goes close to unreadable on PlayStation's
// navy and Xbox's dark green — white text is used on those three, dark text
// kept only for Steam's lighter blue. See GameCard.js for where this is
// actually applied (the corner platform badge, and the new mini-badge
// platform indicators that replaced the plain colored dots).
export const PLATFORMS = {
  ps: { label: 'PS5', full: 'PlayStation', color: '#003791', textColor: '#FFFFFF' },
  xbox: { label: 'XBOX', full: 'Xbox', color: '#107C10', textColor: '#FFFFFF' },
  switch: { label: 'SWITCH', full: 'Switch', color: '#E60012', textColor: '#FFFFFF' },
  pc: { label: 'PC', full: 'PC', color: '#66C0F4', textColor: '#0A0C10' },
};

// Matches the curated GENRE_CATEGORY_MAP in the backend — keep these two in sync.
export const GENRES = [
  'Action',
  'Shooter',
  'Adventure',
  'RPG',
  'Strategy',
  'Sports & Racing',
  'Simulation & Puzzle',
  'Other',
];

export const posterThemes = [
  ['#0F1319', '#3A2A22', '#1C2129'],
  ['#0F1319', '#22344A', '#1C2129'],
  ['#0F1319', '#2E2440', '#1C2129'],
  ['#0F1319', '#233A2E', '#1C2129'],
  ['#0F1319', '#3A2E1A', '#1C2129'],
  ['#0F1319', '#4A1F2E', '#1C2129'],
  ['#0F1319', '#1F3A3A', '#1C2129'],
  ['#0F1319', '#3A1F4A', '#1C2129'],
];

export function hashStr(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}
