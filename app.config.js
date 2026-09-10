// Converted from static app.json to a dynamic config so it can branch on
// APP_VARIANT — a development build needs its own bundle identifier/package
// name, distinct from the live production app, so both can be installed on
// the same device at once (installing a dev build used to silently replace
// the TestFlight build already there, and vice versa, since they shared
// com.gamingviews.app). Set via eas.json's development build profile
// ("env": { "APP_VARIANT": "development" }) or the "start:dev" npm script
// (see package.json) for local dev-client runs — anything else (including
// no APP_VARIANT at all, e.g. a plain `expo start` or a production/preview
// EAS build) falls through to the exact same production identity as before.
const IS_DEV = process.env.APP_VARIANT === 'development';

module.exports = {
  expo: {
    name: IS_DEV ? 'Gaming Views Dev' : 'Gaming Views',
    slug: 'gaming-views',
    scheme: 'gamingviews',
    version: '0.2.0',
    orientation: 'default',
    icon: IS_DEV ? './assets/icon-dev.png' : './assets/icon.png',
    userInterfaceStyle: 'dark',
    newArchEnabled: true,
    assetBundlePatterns: [
      '**/*',
    ],
    ios: {
      supportsTablet: false,
      bundleIdentifier: IS_DEV ? 'com.gamingviews.app.dev' : 'com.gamingviews.app',
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
      },
    },
    android: {
      package: IS_DEV ? 'com.gamingviews.app.dev' : 'com.gamingviews.app',
      adaptiveIcon: {
        foregroundImage: IS_DEV ? './assets/adaptive-icon-dev.png' : './assets/adaptive-icon.png',
        backgroundColor: '#12161C',
      },
    },
    plugins: [
      'expo-router',
      [
        'expo-splash-screen',
        {
          backgroundColor: '#12161C',
          image: './assets/splash-icon.png',
          imageWidth: 180,
        },
      ],
      [
        '@sentry/react-native/expo',
        {
          url: 'https://sentry.io/',
          project: 'react-native',
          organization: 'gaming-views',
        },
      ],
      'expo-notifications',
      // FIXED (dev-build crash — ExpoCalendarRemindersPermissionRequester /
      // MissingCalendarPListValueException): remindersPermission: false used
      // to omit NSRemindersUsageDescription entirely from Info.plist. That
      // crashed on every launch regardless — expo-calendar's native module
      // unconditionally probes BOTH Calendar and Reminders permission status
      // in its own OnCreate (CalendarModule.swift's initializePermittedEntities,
      // called the instant the module loads, not from any JS call this app
      // makes), and that probe is a hard EXFatal crash if the Reminders plist
      // key is missing — there's no way to opt out of the check itself in
      // this SDK-54-pinned version. This app genuinely never uses Reminders
      // (lib/calendarEvent.js only ever calls the Calendar-specific
      // functions) and never calls requestRemindersPermissionsAsync, so no
      // real Reminders permission dialog will ever show to a user — this
      // string exists purely to satisfy that internal startup check, said
      // honestly rather than copying the calendar description.
      [
        'expo-calendar',
        {
          calendarPermission: 'Gaming Views uses your calendar to add a release-date event for games you choose to add.',
          remindersPermission: "Gaming Views doesn't use Reminders.",
        },
      ],
    ],
    extra: {
      router: {},
      eas: {
        projectId: '375685ca-4f81-46ff-aa1c-b6990cc16a37',
      },
    },
  },
};
