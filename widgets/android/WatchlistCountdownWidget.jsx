import React from 'react';
import { FlexWidget } from 'react-native-android-widget';
import { CountdownBlock } from './CountdownBlock';
import { colors } from '../../lib/theme';

// The "WatchlistCountdown" widget (name must match app.config.js's
// react-native-android-widget entry and the taskHandler.js dispatch below).
// Just the shared countdown block on its own card background - this is the
// small/unobtrusive widget size, so it never shows the weekly list.
export function WatchlistCountdownWidget({ nextRelease }) {
  return (
    <FlexWidget style={{ height: 'match_parent', width: 'match_parent', backgroundColor: colors.bgCard, borderRadius: 16 }}>
      <CountdownBlock nextRelease={nextRelease} />
    </FlexWidget>
  );
}
