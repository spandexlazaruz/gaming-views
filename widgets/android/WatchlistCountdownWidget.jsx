import React from 'react';
import { HeroCountdown } from './HeroCountdown';

// The "WatchlistCountdown" widget (name must match app.config.js's
// react-native-android-widget entry and the taskHandler.js dispatch below).
// Just the shared hero countdown band, filling the whole widget - this is
// the small/unobtrusive widget size, so it never shows the weekly list.
export function WatchlistCountdownWidget({ nextRelease, width, height }) {
  return <HeroCountdown nextRelease={nextRelease} width={width} height={height} corners="all" />;
}
