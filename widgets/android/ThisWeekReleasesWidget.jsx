import React from 'react';
import { FlexWidget, TextWidget, ListWidget } from 'react-native-android-widget';
import { CountdownBlock } from './CountdownBlock';
import { daysUntil, formatDateShort } from '../../lib/dates';
import { gameDeepLink } from '../../lib/widgetData';
import { colors, PLATFORMS } from '../../lib/theme';

function dayLabel(date) {
  const days = daysUntil(date);
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  return formatDateShort(date);
}

function WeekRow({ game }) {
  const accentPlatform = [...game.platforms].sort()[0];
  const accentColor = PLATFORMS[accentPlatform]?.color || colors.orange;

  return (
    <FlexWidget
      style={{
        width: 'match_parent',
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 16,
      }}
      clickAction="OPEN_URI"
      clickActionData={{ uri: gameDeepLink(game.title) }}
    >
      <FlexWidget style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: accentColor, marginRight: 10 }} />
      <TextWidget
        text={game.title}
        truncate="END"
        maxLines={1}
        style={{ color: colors.white, fontSize: 14, flex: 1 }}
      />
      <TextWidget text={dayLabel(game.date)} style={{ color: colors.muted, fontSize: 12, marginLeft: 8 }} />
    </FlexWidget>
  );
}

// The "ThisWeekReleases" widget (medium/large only - no small size, so this
// never has to fit the countdown-only layout). Countdown block on top for
// at-a-glance watchlist status, then every tracked game releasing in the
// next 7 days below it, soonest first.
export function ThisWeekReleasesWidget({ nextRelease, thisWeek }) {
  return (
    <FlexWidget style={{ height: 'match_parent', width: 'match_parent', backgroundColor: colors.bgCard, borderRadius: 16 }}>
      <CountdownBlock nextRelease={nextRelease} />
      <FlexWidget style={{ width: 'match_parent', height: 1, backgroundColor: colors.line }} />
      {thisWeek.length === 0 ? (
        <FlexWidget style={{ width: 'match_parent', padding: 16, alignItems: 'flex-start' }}>
          <TextWidget text="Nothing releasing this week" style={{ color: colors.muted, fontSize: 13 }} />
        </FlexWidget>
      ) : (
        <ListWidget style={{ width: 'match_parent', height: 'match_parent' }}>
          {thisWeek.map((game) => (
            <WeekRow key={game.title} game={game} />
          ))}
        </ListWidget>
      )}
    </FlexWidget>
  );
}
