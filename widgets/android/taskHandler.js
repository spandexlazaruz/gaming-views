import AsyncStorage from '@react-native-async-storage/async-storage';
import React from 'react';
import { registerWidgetTaskHandler } from 'react-native-android-widget';
import { WatchlistCountdownWidget } from './WatchlistCountdownWidget';
import { ThisWeekReleasesWidget } from './ThisWeekReleasesWidget';

// Mirrors lib/GamesContext.js's GAMES_CACHE_KEY convention, but holds only
// the small pre-computed { nextRelease, thisWeek } summary (lib/widgetData.js's
// computeWidgetSummary), not the full games list - this handler runs headless,
// invoked directly by the OS (WIDGET_ADDED on first add, WIDGET_UPDATE on its
// own updatePeriodMillis timer, WIDGET_RESIZED), with no app UI, no hooks, and
// potentially the main app never having been opened this session at all. See
// lib/widgetBridge.js, which is what actually writes this key.
const WIDGET_SUMMARY_CACHE_KEY = 'widget_summary_cache_v1';

// `width`/`height` (real on-screen dp, from WidgetInfo) are threaded through
// to WatchlistCountdownWidget because its hero-image treatment needs
// concrete pixel dimensions for ImageWidget (its imageWidth/imageHeight are
// required numbers, not 'match_parent') - without the real size, a user who
// resizes the widget larger than the configured default would get a
// cropped/undersized background image.
function renderFor(widgetInfo, summary) {
  const nextRelease = summary?.nextRelease ?? null;
  const thisWeek = summary?.thisWeek ?? [];
  switch (widgetInfo.widgetName) {
    case 'WatchlistCountdown':
      return React.createElement(WatchlistCountdownWidget, {
        nextRelease,
        width: widgetInfo.width,
        height: widgetInfo.height,
      });
    case 'ThisWeekReleases':
      return React.createElement(ThisWeekReleasesWidget, { nextRelease, thisWeek });
    default:
      return null;
  }
}

export function registerAndroidWidgetTaskHandler() {
  registerWidgetTaskHandler(async ({ widgetInfo, widgetAction, renderWidget }) => {
    if (widgetAction === 'WIDGET_DELETED') return;

    let summary = null;
    try {
      const raw = await AsyncStorage.getItem(WIDGET_SUMMARY_CACHE_KEY);
      if (raw) summary = JSON.parse(raw);
    } catch {
      // No cache yet (e.g. widget added before the app has ever run) -
      // renderFor's nullish defaults below cover this with the same
      // "no upcoming releases" empty state CountdownBlock already shows.
    }

    const element = renderFor(widgetInfo, summary);
    if (element) renderWidget(element);
  });
}
