import React from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Platform dispatch for pushing a freshly-computed widget summary (lib/
// widgetData.js's computeWidgetSummary) onto each platform's real widget.
// Deliberately separate from widgetData.js's pure computation: this file
// is the only one that touches native modules, so every call is wrapped
// defensively - neither platform's widget native module is guaranteed to
// be compiled into whatever build is currently running (Expo Go, an older
// installed build made before this feature shipped, or simply the
// opposite platform), and a missing/failed widget push must never be
// allowed to break anything else in lib/WatchlistContext.js's effect chain.
//
// Android: react-native-android-widget has no "push arbitrary data" API of
// its own - requestWidgetUpdate() re-invokes each added widget's own
// renderWidget callback with fresh JSX. The summary is also persisted to
// AsyncStorage (widgets/android/taskHandler.js's WIDGET_SUMMARY_CACHE_KEY)
// so the OS's own headless update timer can render real data without the
// main app running at all.
//
// iOS: expo-widgets' createWidget() returns a Widget instance with its own
// updateSnapshot() - no separate cache needed, WidgetKit owns persisting
// whatever was last pushed and keeps rendering it (including Text's
// auto-updating relative date, see widgets/ios/WatchlistCountdownWidget.jsx)
// even with the app never reopened.
const WIDGET_SUMMARY_CACHE_KEY = 'widget_summary_cache_v1';

async function pushAndroid(summary) {
  const { requestWidgetUpdate } = await import('react-native-android-widget');
  const { WatchlistCountdownWidget } = await import('../widgets/android/WatchlistCountdownWidget');
  const { ThisWeekReleasesWidget } = await import('../widgets/android/ThisWeekReleasesWidget');

  await AsyncStorage.setItem(WIDGET_SUMMARY_CACHE_KEY, JSON.stringify(summary));

  await requestWidgetUpdate({
    widgetName: 'WatchlistCountdown',
    renderWidget: () => React.createElement(WatchlistCountdownWidget, { nextRelease: summary.nextRelease }),
  });
  await requestWidgetUpdate({
    widgetName: 'ThisWeekReleases',
    renderWidget: () =>
      React.createElement(ThisWeekReleasesWidget, { nextRelease: summary.nextRelease, thisWeek: summary.thisWeek }),
  });
}

async function pushIos(summary) {
  const { watchlistCountdownWidget } = await import('../widgets/ios/WatchlistCountdownWidget');
  const { thisWeekReleasesWidget } = await import('../widgets/ios/ThisWeekReleasesWidget');

  watchlistCountdownWidget.updateSnapshot({ nextRelease: summary.nextRelease });
  thisWeekReleasesWidget.updateSnapshot({ nextRelease: summary.nextRelease, thisWeek: summary.thisWeek });
}

export async function pushWidgetSummary(summary) {
  try {
    if (Platform.OS === 'android') {
      await pushAndroid(summary);
    } else if (Platform.OS === 'ios') {
      await pushIos(summary);
    }
  } catch {
    // Best-effort - a missing native module (Expo Go, an older build) or
    // any native-side failure should never break the rest of the app's
    // effect chain over a non-critical feature.
  }
}
