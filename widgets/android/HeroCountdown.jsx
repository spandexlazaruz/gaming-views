import React from 'react';
import { FlexWidget, TextWidget, ImageWidget, OverlapWidget } from 'react-native-android-widget';
import { daysUntil, formatDateShort } from '../../lib/dates';
import { gameDeepLink } from '../../lib/widgetData';
import { colors, PLATFORMS } from '../../lib/theme';

// Shared full-bleed cover-image "hero" countdown band, used by both
// WatchlistCountdownWidget (the whole widget) and ThisWeekReleasesWidget
// (just its fixed-height top band, above the weekly list) - Dan's choice
// after seeing the plain thumbnail+text layout first, for both widgets,
// not just the standalone one. `width`/`height` are the real explicit dp
// this band renders at - ImageWidget requires numbers, not 'match_parent'
// (see WatchlistCountdownWidget.jsx's own comment on why the real
// on-screen size has to be threaded through from the push paths rather
// than guessed from the configured default). `corners` controls which
// corners get rounded - all four for the standalone widget, top-only when
// this sits above a list that continues with square corners below it.
function countdownLabel(date) {
  const days = daysUntil(date);
  if (days === 0) return 'Today!';
  if (days === 1) return 'Tomorrow';
  return `In ${days} days`;
}

export function HeroCountdown({ nextRelease, width, height, corners = 'all' }) {
  const radiusStyle =
    corners === 'all'
      ? { borderRadius: 16 }
      : { borderTopLeftRadius: 16, borderTopRightRadius: 16 };

  if (!nextRelease) {
    return (
      <FlexWidget
        style={{
          width: 'match_parent',
          height,
          backgroundColor: colors.bgCard,
          ...radiusStyle,
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
          width: 'match_parent',
          height,
          backgroundColor: colors.bgCard,
          ...radiusStyle,
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
      style={{ width: 'match_parent', height, overflow: 'hidden', ...radiusStyle }}
      clickAction="OPEN_URI"
      clickActionData={{ uri: gameDeepLink(nextRelease.title) }}
    >
      <ImageWidget
        image={nextRelease.coverUrl}
        imageWidth={width || 250}
        imageHeight={height}
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
