import React from 'react';
import { createWidget } from 'expo-widgets';
import { VStack, HStack, Text, Divider, Link } from '@expo/ui/swift-ui';
import { containerBackground, foregroundStyle, background, cornerRadius, frame, font, padding } from '@expo/ui/swift-ui/modifiers';

// The "ThisWeekReleases" widget (medium/large only, per app.config.js -
// no small size, so it never has to fit the countdown-only layout).
// Mirrors widgets/android/ThisWeekReleasesWidget.jsx's content: countdown
// on top, then every tracked game releasing in the next 7 days below it.
//
// Same self-containment constraint as WatchlistCountdownWidget.jsx (see
// its own comment for the full story: a 'widget'-marked function is
// serialized to a standalone string, losing the module's import scope) -
// colors, date-label logic and the deep-link builder are duplicated here
// rather than shared, since each createWidget() call is its own
// independently-extracted function with no way to reference the other -
// and no way to reference a sibling module-level declaration either, so
// dayLabel is declared INSIDE the layout function below, not here.
export const thisWeekReleasesWidget = createWidget('ThisWeekReleases', (props, environment) => {
  'widget';

  function dayLabel(dateArr) {
    const date = new Date(dateArr[0], dateArr[1], dateArr[2]);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const days = Math.round((date - today) / 86400000);
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  const nextRelease = props.nextRelease ?? null;
  const thisWeek = props.thisWeek ?? [];
  const colorWhite = '#FFFFFF';
  const colorMuted = '#9AA3AF';
  const colorBgCard = '#1C2129';
  const colorOrange = '#F4820A';
  const colorLine = 'rgba(255,255,255,0.07)';
  const platformColors = { ps: '#003791', xbox: '#107C10', switch: '#E60012', pc: '#66C0F4' };

  const maxRows = environment.widgetFamily === 'systemLarge' ? 6 : 3;
  const visible = thisWeek.slice(0, maxRows);

  const countdownBlock = !nextRelease ? (
    <VStack alignment="leading" spacing={4} modifiers={[padding({ all: 16 })]}>
      <Text modifiers={[font({ size: 15, weight: 'semibold' }), foregroundStyle(colorWhite)]}>
        No upcoming releases
      </Text>
      <Text modifiers={[font({ size: 12 }), foregroundStyle(colorMuted)]}>
        Add games to your Watchlist
      </Text>
    </VStack>
  ) : (
    <VStack alignment="leading" spacing={6} modifiers={[padding({ all: 16 })]}>
      <Text modifiers={[font({ size: 16, weight: 'bold' }), foregroundStyle(colorWhite)]}>
        {nextRelease.title}
      </Text>
      <Text
        date={new Date(nextRelease.date[0], nextRelease.date[1], nextRelease.date[2])}
        dateStyle="relative"
        modifiers={[font({ size: 12 }), foregroundStyle(colorMuted)]}
      />
    </VStack>
  );

  return (
    <VStack alignment="leading" spacing={0} modifiers={[containerBackground(colorBgCard, 'widget')]}>
      {nextRelease ? (
        <Link destination={`gamingviews://game/${encodeURIComponent(nextRelease.title)}`}>{countdownBlock}</Link>
      ) : (
        countdownBlock
      )}
      <Divider />
      {visible.length === 0 ? (
        <Text modifiers={[padding({ all: 16 }), font({ size: 13 }), foregroundStyle(colorMuted)]}>
          Nothing releasing this week
        </Text>
      ) : (
        <VStack alignment="leading" spacing={2} modifiers={[padding({ vertical: 8 })]}>
          {visible.map((game) => {
            const accentPlatform = [...game.platforms].sort()[0];
            const accentColor = platformColors[accentPlatform] || colorOrange;
            return (
              <Link key={game.title} destination={`gamingviews://game/${encodeURIComponent(game.title)}`}>
                <HStack spacing={10} modifiers={[padding({ horizontal: 16, vertical: 6 })]}>
                  <VStack modifiers={[frame({ width: 8, height: 8 }), background(accentColor), cornerRadius(4)]}>
                    <Text> </Text>
                  </VStack>
                  <Text modifiers={[font({ size: 14 }), foregroundStyle(colorWhite)]}>{game.title}</Text>
                  <Text modifiers={[font({ size: 12 }), foregroundStyle(colorMuted)]}>{dayLabel(game.date)}</Text>
                </HStack>
              </Link>
            );
          })}
        </VStack>
      )}
    </VStack>
  );
});
