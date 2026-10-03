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
    version: '0.3.0',
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
      // ADDED (Play Console "App optimisation is below our threshold" —
      // obfuscation percentage 1%, fix-by Feb 2027): Expo/EAS managed builds
      // (no checked-in android/ folder) leave R8 code shrinking/obfuscation
      // OFF by default unless explicitly enabled here. Android-only — R8 is
      // an Android build tool, iOS builds are unaffected. Only touches the
      // release build config; needs a fresh production Android build to
      // actually take effect and to confirm minification doesn't strip
      // anything a library needs without an explicit keep rule.
      [
        'expo-build-properties',
        {
          android: {
            enableProguardInReleaseBuilds: true,
            enableShrinkResourcesInReleaseBuilds: true,
          },
        },
      ],
      'expo-asset',
      'expo-font',
      'expo-image',
      'expo-localization',
      'expo-status-bar',
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
      // ADDED (home-screen widgets, Android): two widgets, "Next Release"
      // (a watchlist countdown, any size) and "This Week" (medium/large
      // only, countdown + the full weekly list — deliberately no small
      // size, matching the "small = countdown only" design). Widget UI
      // lives in widgets/android/*, registered via index.js's
      // registerAndroidWidgetTaskHandler (see that file's comment on why
      // Expo Router's own entry has to be wrapped rather than replaced).
      // No `fonts` entry: widget text uses the system default font rather
      // than this app's Inter/Poppins — custom fonts are supported by the
      // plugin but add real prebuild risk for a purely cosmetic win this
      // build doesn't need.
      [
        'react-native-android-widget',
        {
          widgets: [
            {
              name: 'WatchlistCountdown',
              label: 'Next Release',
              description: 'Countdown to your next watchlisted release.',
              minWidth: '110dp',
              minHeight: '110dp',
              targetCellWidth: 2,
              targetCellHeight: 2,
              updatePeriodMillis: 1800000,
            },
            {
              name: 'ThisWeekReleases',
              label: 'This Week',
              description: 'Tracked games releasing in the next 7 days.',
              minWidth: '250dp',
              minHeight: '180dp',
              targetCellWidth: 4,
              targetCellHeight: 3,
              updatePeriodMillis: 1800000,
            },
          ],
        },
      ],
      // ADDED (home-screen widgets, iOS): same two widgets as the Android
      // plugin above - "WatchlistCountdown" (any size) and
      // "ThisWeekReleases" (medium/large only, no small, matching
      // "small = countdown only"). Widget UI lives in widgets/ios/*,
      // defined via expo-widgets' createWidget - unlike Android, there's
      // no separate task-handler registration step; the widget definition
      // itself IS the thing that gets pushed to (see lib/widgetBridge.js).
      // `enableAndroid` is deliberately left at its default (false): this
      // package's own Android support is explicitly experimental/
      // off-by-default per its own config-plugin type comment, so Android
      // uses the dedicated, mature react-native-android-widget instead.
      //
      // CORRECTED (caught reading the plugin's own source, withIosWidgets.js
      // §30-32): `bundleIdentifier` here is the WIDGET EXTENSION target's own
      // bundle id, passed straight through to its Xcode target and to EAS's
      // appExtensions config (withEasConfig.js) - it must be distinct from
      // the main app's bundle id, never equal to it (every target in an iOS
      // app, main app or extension, needs its own unique bundle id; Xcode and
      // App Store Connect both reject a collision). An earlier draft of this
      // had it wrong (set to the main app's own id) before checking.
      // Needs a real App Group set up in the Apple Developer portal before
      // this can build for iOS - walk through together before the first
      // iOS widget build/submission.
      [
        'expo-widgets',
        {
          bundleIdentifier: IS_DEV ? 'com.gamingviews.app.dev.widgets' : 'com.gamingviews.app.widgets',
          groupIdentifier: IS_DEV ? 'group.com.gamingviews.app.dev' : 'group.com.gamingviews.app',
          widgets: [
            {
              name: 'WatchlistCountdown',
              displayName: 'Next Release',
              description: 'Countdown to your next watchlisted release.',
              supportedFamilies: ['systemSmall', 'systemMedium', 'systemLarge'],
              contentMarginsDisabled: false,
            },
            {
              name: 'ThisWeekReleases',
              displayName: 'This Week',
              description: 'Tracked games releasing in the next 7 days.',
              supportedFamilies: ['systemMedium', 'systemLarge'],
              contentMarginsDisabled: false,
            },
          ],
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
