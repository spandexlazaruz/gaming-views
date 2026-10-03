import React from 'react';
import { FlexWidget, TextWidget, ListWidget } from 'react-native-android-widget';
import { HeroCountdown } from './HeroCountdown';
import { daysUntil, formatDateShort } from '../../lib/dates';
import { gameDeepLink } from '../../lib/widgetData';
import { colors, PLATFORMS } from '../../lib/theme';

// Fixed height for the top hero band - the rest of the widget's height
// (it's resizable by the user, no single fixed total) goes to the weekly
// list below it.
const HERO_BAND_HEIGHT = 110;

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
// never has to fit the countdown-only layout). Hero countdown band on top
// for at-a-glance watchlist status (Dan's choice, matching
// WatchlistCountdownWidget's same treatment rather than the plain
// thumbnail layout this used to have), then every tracked game releasing
// in the next 7 days below it, soonest first.
export function ThisWeekReleasesWidget({ nextRelease, thisWeek, width }) {
  return (
    <FlexWidget style={{ height: 'match_parent', width: 'match_parent', backgroundColor: colors.bgCard, borderRadius: 16 }}>
      <HeroCountdown nextRelease={nextRelease} width={width} height={HERO_BAND_HEIGHT} corners="top" />
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
