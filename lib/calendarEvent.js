import { Platform } from 'react-native';
import * as Calendar from 'expo-calendar';
import { toDate } from './dates';

export async function ensureCalendarPermission() {
  const current = await Calendar.getCalendarPermissionsAsync();
  if (current.granted) return true;
  const requested = await Calendar.requestCalendarPermissionsAsync();
  return !!requested.granted;
}

// iOS has a real "default calendar for new events" concept
// (getDefaultCalendarAsync) — Android doesn't, so this picks the device's
// primary writable calendar instead, falling back to the first writable one
// if nothing's flagged primary (some accounts/ROMs don't set it).
async function findWritableCalendarId() {
  if (Platform.OS === 'ios') {
    const defaultCalendar = await Calendar.getDefaultCalendarAsync();
    return (defaultCalendar && defaultCalendar.id) || null;
  }
  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  const writable = calendars.filter((c) => c.allowsModifications);
  if (writable.length === 0) return null;
  const primary = writable.find((c) => c.isPrimary);
  return (primary || writable[0]).id;
}

// Creates an all-day event on a game's release date. Returns true on
// success, false on permission denial or when there's no writable calendar
// to add to (e.g. an Android device/emulator with no account signed in) —
// callers show their own "couldn't add" state rather than this throwing.
export async function addGameReleaseToCalendar(game) {
  const granted = await ensureCalendarPermission();
  if (!granted) return false;

  const calendarId = await findWritableCalendarId();
  if (!calendarId) return false;

  // Plain local-midnight-to-next-midnight, same "wall clock date, no
  // timezone conversion" convention game.date already uses everywhere else
  // in this app (see lib/dates.js's toDate) — an explicit timeZone override
  // here would risk shifting an all-day event onto the wrong day depending
  // on the device's UTC offset.
  const startDate = toDate(game.date);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 1);

  await Calendar.createEventAsync(calendarId, {
    title: `${game.title} releases`,
    startDate,
    endDate,
    allDay: true,
    notes: 'Added from Gaming Views.',
  });
  return true;
}
