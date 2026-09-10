import { Platform } from 'react-native';
import * as Calendar from 'expo-calendar';
import { toDate, formatDate } from './dates';

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

// Creates an all-day event on a game's release date, offset backward by
// `leadDays` (0 = the actual release date — mirrors WatchlistContext's
// LEAD_OPTIONS "days" field, the same lead-time the push notification for
// this game already uses). A one-time snapshot of whatever lead-time is
// selected at the moment this is called, not a live link to it — see the
// call site in app/game/[title].js for why. Returns true on success, false
// on permission denial or when there's no writable calendar to add to
// (e.g. an Android device/emulator with no account signed in) — callers
// show their own "couldn't add" state rather than this throwing.
export async function addGameReleaseToCalendar(game, leadDays = 0) {
  const granted = await ensureCalendarPermission();
  if (!granted) return false;

  const calendarId = await findWritableCalendarId();
  if (!calendarId) return false;

  // Plain local-midnight-to-next-midnight, same "wall clock date, no
  // timezone conversion" convention game.date already uses everywhere else
  // in this app (see lib/dates.js's toDate) — an explicit timeZone override
  // here would risk shifting an all-day event onto the wrong day depending
  // on the device's UTC offset.
  const releaseDate = toDate(game.date);
  const startDate = new Date(releaseDate);
  startDate.setDate(startDate.getDate() - leadDays);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 1);

  // Same "is out today" / "releases in N days" phrasing lib/notifications.js
  // already uses for this exact lead-time's push notification (see
  // scheduleGameReminder) — keeps the two reminders reading consistently.
  // When the event lands ahead of the real release date, the notes spell out
  // the actual date too, since the event's own date no longer is it.
  const title = leadDays === 0
    ? `🎮 ${game.title} is out today!`
    : `🎮 ${game.title} releases in ${leadDays} day${leadDays === 1 ? '' : 's'}`;
  const notes = leadDays === 0
    ? 'Added from Gaming Views.'
    : `Actual release date: ${formatDate(game.date)}. Added from Gaming Views.`;

  await Calendar.createEventAsync(calendarId, {
    title,
    startDate,
    endDate,
    allDay: true,
    notes,
  });
  return true;
}
