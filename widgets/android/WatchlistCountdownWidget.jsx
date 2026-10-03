import React from 'react';
import { FlexWidget, TextWidget, ImageWidget, OverlapWidget } from 'react-native-android-widget';
import { daysUntil, formatDateShort } from '../../lib/dates';
import { gameDeepLink } from '../../lib/widgetData';
import { colors, PLATFORMS } from '../../lib/theme';

// The "WatchlistCountdown" widget (name must match app.config.js's
// react-native-android-widget entry and the taskHandler.js dispatch below).
// This is the small/unobtrusive widget size, so it never shows the weekly
// list - just the countdown, as a full-bleed cover-image "hero card" with a
// dark gradient scrim and the title/countdown overlaid (Dan's choice after
// seeing the plain thumbnail layout first - more eye-catching, at the cost
// of being a bigger visual statement than the original "unobtrusive" brief).
// Falls back to the original flat-card layout when there's no cover image
// to use (resolvedWatchlistCount-style edge case: a saved title whose cover
// didn't load, not the "nothing saved" empty state, which never has one
// either and uses the same fallback).
function countdownLabel(date) {
  const days = daysUntil(date);
  if (days === 0) return 'Today!';
  if (days === 1) return 'Tomorrow';
  return `In ${days} days`;
}

export function WatchlistCountdownWidget({ nextRelease, width, height }) {
  if (!nextRelease) {
    return (
      <FlexWidget
        style={{
          height: 'match_parent',
          width: 'match_parent',
          backgroundColor: colors.bgCard,
          borderRadius: 16,
          padding: 16,
          alignItems: 'flex-start',
          justifyContent: 'center',
        }}
        clickAction="OPEN_APP"
      >
        <TextWidget text="No upcoming releases" style={{ color: colors.white, fontSize: 15, fontWeight: '600' }} />
        <TextWidget text="Add games to your Watchlist" style={{ color: colors.muted, fontSize: 12, marginTop: 4 }} />
      </FlexWidget>
    );
  }

  const accentPlatform = [...nextRelease.platforms].sort()[0];
  const accentColor = PLATFORMS[accentPlatform]?.color || colors.orange;
  const subtitle = `${countdownLabel(nextRelease.date)} · ${formatDateShort(nextRelease.date)}`;

  if (!nextRelease.coverUrl) {
    return (
      <FlexWidget
        style={{
          height: 'match_parent',
          width: 'match_parent',
          backgroundColor: colors.bgCard,
          borderRadius: 16,
          padding: 16,
          alignItems: 'flex-start',
          justifyContent: 'center',
        }}
        clickAction="OPEN_URI"
        clickActionData={{ uri: gameDeepLink(nextRelease.title) }}
      >
        <FlexWidget style={{ width: 24, height: 4, borderRadius: 2, backgroundColor: accentColor, marginBottom: 8 }} />
        <TextWidget
          text={nextRelease.title}
          truncate="END"
          maxLines={2}
          style={{ color: colors.white, fontSize: 16, fontWeight: '700' }}
        />
        <TextWidget text={subtitle} style={{ color: colors.muted, fontSize: 12, marginTop: 4 }} />
      </FlexWidget>
    );
  }

  return (
    <OverlapWidget
      style={{ width: 'match_parent', height: 'match_parent', overflow: 'hidden', borderRadius: 16 }}
      clickAction="OPEN_URI"
      clickActionData={{ uri: gameDeepLink(nextRelease.title) }}
    >
      <ImageWidget
        image={nextRelease.coverUrl}
        imageWidth={width || 110}
        imageHeight={height || 110}
        resizeMode="cover"
        style={{ width: 'match_parent', height: 'match_parent' }}
      />
      <FlexWidget
        style={{
          width: 'match_parent',
          height: 'match_parent',
          backgroundGradient: { from: 'rgba(10, 12, 16, 0)', to: 'rgba(10, 12, 16, 0.92)', orientation: 'TOP_BOTTOM' },
          alignItems: 'flex-start',
          justifyContent: 'flex-end',
          padding: 14,
        }}
      >
        <FlexWidget style={{ width: 22, height: 4, borderRadius: 2, backgroundColor: accentColor, marginBottom: 6 }} />
        <TextWidget
          text={nextRelease.title}
          truncate="END"
          maxLines={2}
          style={{ color: colors.white, fontSize: 15, fontWeight: '700' }}
        />
        <TextWidget text={subtitle} style={{ color: colors.muted, fontSize: 11, marginTop: 2 }} />
      </FlexWidget>
    </OverlapWidget>
  );
}
