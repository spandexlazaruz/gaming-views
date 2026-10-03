import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import { daysUntil, formatDateShort } from '../../lib/dates';
import { gameDeepLink } from '../../lib/widgetData';
import { colors, PLATFORMS } from '../../lib/theme';

// Shared "next release" block, used standalone by WatchlistCountdownWidget
// and reused at the top of ThisWeekReleasesWidget. `nextRelease` is the
// { title, date, platforms } shape from lib/widgetData.js's
// computeNextRelease, or null when nothing on the Watchlist still resolves
// to a real upcoming release.
function countdownLabel(date) {
  const days = daysUntil(date);
  if (days === 0) return 'Today!';
  if (days === 1) return 'Tomorrow';
  return `In ${days} days`;
}

export function CountdownBlock({ nextRelease }) {
  if (!nextRelease) {
    return (
      <FlexWidget
        style={{ width: 'match_parent', padding: 16, alignItems: 'flex-start', justifyContent: 'center' }}
        clickAction="OPEN_APP"
      >
        <TextWidget
          text="No upcoming releases"
          style={{ color: colors.white, fontSize: 15, fontWeight: '600' }}
        />
        <TextWidget
          text="Add games to your Watchlist"
          style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}
        />
      </FlexWidget>
    );
  }

  const accentPlatform = [...nextRelease.platforms].sort()[0];
  const accentColor = PLATFORMS[accentPlatform]?.color || colors.orange;

  return (
    <FlexWidget
      style={{ width: 'match_parent', padding: 16, alignItems: 'flex-start', justifyContent: 'center' }}
      clickAction="OPEN_URI"
      clickActionData={{ uri: gameDeepLink(nextRelease.title) }}
    >
      <FlexWidget
        style={{
          width: 24,
          height: 4,
          borderRadius: 2,
          backgroundColor: accentColor,
          marginBottom: 8,
        }}
      />
      <TextWidget
        text={nextRelease.title}
        truncate="END"
        maxLines={2}
        style={{ color: colors.white, fontSize: 16, fontWeight: '700' }}
      />
      <TextWidget
        text={`${countdownLabel(nextRelease.date)} · ${formatDateShort(nextRelease.date)}`}
        style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}
      />
    </FlexWidget>
  );
}
