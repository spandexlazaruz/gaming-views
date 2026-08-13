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

export const PLATFORMS = {
  ps: { label: 'PS5', full: 'PlayStation', color: '#2F7DE1' },
  xbox: { label: 'XBOX', full: 'Xbox', color: '#3DA35D' },
  switch: { label: 'SWITCH', full: 'Switch', color: '#E5484D' },
  pc: { label: 'PC', full: 'PC', color: '#D9B44A' },
};

export const posterThemes = [
  ['#1C2129', '#3A2A22'],
  ['#1C2129', '#22344A'],
  ['#1C2129', '#2E2440'],
  ['#1C2129', '#233A2E'],
  ['#1C2129', '#3A2E1A'],
];

export function hashStr(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}
