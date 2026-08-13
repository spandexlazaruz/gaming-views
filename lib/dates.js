export function toDate(a) {
  return new Date(a[0], a[1], a[2]);
}

export function daysUntil(a) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((toDate(a) - today) / 86400000);
}

export function formatDate(a) {
  return toDate(a).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatDateShort(a) {
  return toDate(a).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
