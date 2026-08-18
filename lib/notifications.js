import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { toDate } from './dates';

// Local-only notifications: everything here is scheduled on-device via
// expo-notifications' local scheduling API. Nothing is registered with a
// push service, no token is generated or sent anywhere, and no server is
// involved — this matches what the Privacy Policy already promises
// ("scheduled locally on your device... we do not receive any record of
// what reminders you've set").

const RELEASE_CHANNEL_ID = 'release-reminders';
const DIGEST_CHANNEL_ID = 'weekly-digest';
const DIGEST_NOTIFICATION_ID = 'weekly-digest-notification';

// Foreground notifications should still show a banner/alert (default
// behavior changed across expo-notifications versions, so this is explicit).
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

async function ensureAndroidChannels() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(RELEASE_CHANNEL_ID, {
    name: 'Release Reminders',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
  await Notifications.setNotificationChannelAsync(DIGEST_CHANNEL_ID, {
    name: 'Weekly Digest',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

// Android 13+ won't show the OS permission prompt until at least one
// channel exists, so channels are created before requesting permission.
export async function ensureNotificationPermission() {
  await ensureAndroidChannels();
  const current = await Notifications.getPermissionsAsync();
  if (current.granted || current.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) {
    return true;
  }
  const requested = await Notifications.requestPermissionsAsync();
  return !!requested.granted;
}

export async function getNotificationPermissionStatus() {
  const current = await Notifications.getPermissionsAsync();
  return current.granted;
}

function reminderNotificationId(title) {
  return `release-reminder-${title}`;
}

// Schedules (or replaces) a single game's release-day/lead-time reminder.
// `game.date` is [year, monthIndex, day] — same shape used throughout the app.
export async function scheduleGameReminder(game, leadDays) {
  const id = reminderNotificationId(game.title);
  await Notifications.cancelScheduledNotificationAsync(id).catch(() => {});

  const releaseDate = toDate(game.date);
  const fireDate = new Date(releaseDate);
  fireDate.setDate(fireDate.getDate() - leadDays);
  fireDate.setHours(9, 0, 0, 0); // 9am local time, consistent and non-intrusive

  // If the computed time has already passed (e.g. lead time no longer makes
  // sense because the release is imminent/past), don't schedule a
  // notification that already can't fire — silently skip instead of erroring.
  if (fireDate.getTime() <= Date.now()) return;

  await Notifications.scheduleNotificationAsync({
    identifier: id,
    content: {
      title: `🎮 ${game.title}`,
      body:
        leadDays === 0
          ? `${game.title} is out today!`
          : `${game.title} releases in ${leadDays} day${leadDays === 1 ? '' : 's'}.`,
      data: { gameTitle: game.title },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: fireDate,
      channelId: RELEASE_CHANNEL_ID,
    },
  });
}

export async function cancelGameReminder(title) {
  await Notifications.cancelScheduledNotificationAsync(reminderNotificationId(title)).catch(() => {});
}

// Recomputes every scheduled release reminder from the current watchlist +
// per-game lead-time choices + live game data. Cheap to call often (app
// foreground, watchlist change) since it just re-derives desired state and
// only touches the OS scheduler for what's actually changed.
// `platformContext` (title -> platform key) lets a title's single reminder
// track the release date of the specific platform it was added under, when
// the game's platforms have genuinely different confirmed dates
// (game.platformDates, see gaming-views-backend/api/games.js) — otherwise
// falls back to the game's regular shared `date`, unchanged from before.
function reminderDateFor(game, platformContext) {
  const plat = platformContext && platformContext[game.title];
  return (plat && game.platformDates && game.platformDates[plat]) || game.date;
}

export async function syncReminderSchedule(saved, reminders, games, leadOptions, platformContext = {}) {
  const granted = await getNotificationPermissionStatus();
  if (!granted) return;

  const savedTitles = new Set(saved);
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const scheduledReleaseIds = new Set(
    scheduled
      .map((n) => n.identifier)
      .filter((id) => id.startsWith('release-reminder-'))
  );

  // Cancel reminders for anything no longer on the watchlist.
  for (const id of scheduledReleaseIds) {
    const title = id.replace('release-reminder-', '');
    if (!savedTitles.has(title)) {
      await Notifications.cancelScheduledNotificationAsync(id).catch(() => {});
    }
  }

  // (Re)schedule reminders for everything currently on the watchlist.
  for (const title of savedTitles) {
    const game = games.find((g) => g.title === title);
    if (!game) continue;
    const leadKey = reminders[title] || 'release_day';
    const lead = leadOptions.find((o) => o.key === leadKey);
    if (!lead) continue;
    await scheduleGameReminder({ ...game, date: reminderDateFor(game, platformContext) }, lead.days);
  }
}

// Weekly Digest: a single repeating local notification. Content can only be
// as fresh as the last time this ran (there's no server to push a live
// list), so it's recomputed and rescheduled every time the app opens or the
// watchlist changes — same honesty trade-off already documented for the
// rest of this app's "no backend push" design.
export async function scheduleWeeklyDigest(saved, games, platformContext = {}) {
  await Notifications.cancelScheduledNotificationAsync(DIGEST_NOTIFICATION_ID).catch(() => {});

  const now = new Date();
  const releasingThisWeek = [...saved].filter((title) => {
    const game = games.find((g) => g.title === title);
    if (!game) return false;
    const releaseDate = toDate(reminderDateFor(game, platformContext));
    const daysAway = Math.round((releaseDate - now) / 86400000);
    return daysAway >= 0 && daysAway <= 7;
  });

  const body =
    releasingThisWeek.length === 0
      ? 'Nothing from your watchlist is releasing this week.'
      : releasingThisWeek.length === 1
        ? `${releasingThisWeek[0]} is releasing this week.`
        : `${releasingThisWeek.length} games from your watchlist are releasing this week.`;

  // Next Monday at 9am.
  const nextMonday = new Date(now);
  const daysUntilMonday = (8 - now.getDay()) % 7 || 7;
  nextMonday.setDate(now.getDate() + daysUntilMonday);
  nextMonday.setHours(9, 0, 0, 0);

  await Notifications.scheduleNotificationAsync({
    identifier: DIGEST_NOTIFICATION_ID,
    content: { title: 'This Week in Gaming Views', body, data: { digest: true } },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: nextMonday,
      channelId: DIGEST_CHANNEL_ID,
    },
  });
}

export async function cancelWeeklyDigest() {
  await Notifications.cancelScheduledNotificationAsync(DIGEST_NOTIFICATION_ID).catch(() => {});
}

// Fires a real local notification a few seconds from now, so "preview" is
// an actual functional test rather than an in-app animation pretending to
// be one.
export async function sendTestNotification(game) {
  const granted = await ensureNotificationPermission();
  if (!granted) return false;
  await ensureAndroidChannels();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: `🎮 ${game.title}`,
      body: `${game.title} releases soon. Tap to view details.`,
      data: { gameTitle: game.title, test: true },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 3,
      channelId: RELEASE_CHANNEL_ID,
    },
  });
  return true;
}
