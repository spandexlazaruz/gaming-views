import React from 'react';
import { FlexWidget, TextWidget, ImageWidget } from 'react-native-android-widget';
import { daysUntil, formatDateShort } from '../../lib/dates';
import { gameDeepLink } from '../../lib/widgetData';
import { colors, PLATFORMS } from '../../lib/theme';

// Shared "next release" block, used standalone by WatchlistCountdownWidget
// and reused at the top of ThisWeekReleasesWidget. `nextRelease` is the
// { title, date, platforms, coverUrl } shape from lib/widgetData.js's
// computeNextRelease, or null when nothing on the Watchlist still resolves
// to a real upcoming release. Unlike iOS (see widgets/ios/
// WatchlistCountdownWidget.jsx's comment), ImageWidget loads a remote
// `https:` URL directly - no local download/cache step needed here.
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
      style={{ width: 'match_parent', flexDirection: 'row', padding: 16, alignItems: 'center' }}
      clickAction="OPEN_URI"
      clickActionData={{ uri: gameDeepLink(nextRelease.title) }}
    >
      {nextRelease.coverUrl ? (
        <ImageWidget
          image={nextRelease.coverUrl}
          imageWidth={48}
          imageHeight={64}
          radius={8}
          resizeMode="cover"
          style={{ marginRight: 12 }}
        />
      ) : null}
      <FlexWidget style={{ flex: 1, alignItems: 'flex-start', justifyContent: 'center' }}>
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
    </FlexWidget>
  );
}
