import React from 'react';
import { createWidget } from 'expo-widgets';
import { VStack, HStack, Text, Divider, Link } from '@expo/ui/swift-ui';
import { containerBackground, foregroundStyle, background, cornerRadius, frame, font, padding } from '@expo/ui/swift-ui/modifiers';
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
    <Link destination={gameDeepLink(game.title)}>
      <HStack spacing={10} modifiers={[padding({ horizontal: 16, vertical: 6 })]}>
        <VStack modifiers={[frame({ width: 8, height: 8 }), background(accentColor), cornerRadius(4)]}>
          <Text> </Text>
        </VStack>
        <Text modifiers={[font({ size: 14 }), foregroundStyle(colors.white)]}>{game.title}</Text>
        <Text modifiers={[font({ size: 12 }), foregroundStyle(colors.muted)]}>{dayLabel(game.date)}</Text>
      </HStack>
    </Link>
  );
}

// The "ThisWeekReleases" widget (medium/large only, per app.config.js -
// no small size, so it never has to fit the countdown-only layout).
// Mirrors widgets/android/ThisWeekReleasesWidget.jsx: countdown block on
// top, then every tracked game releasing in the next 7 days below it.
// Real widgets can't scroll, so this is capped rather than a real list -
// systemLarge gets a couple more rows than systemMedium.
export const thisWeekReleasesWidget = createWidget('ThisWeekReleases', (props, environment) => {
  'widget';
  const nextRelease = props.nextRelease ?? null;
  const thisWeek = props.thisWeek ?? [];
  const maxRows = environment.widgetFamily === 'systemLarge' ? 6 : 3;
  const visible = thisWeek.slice(0, maxRows);

  const countdown = <CountdownBlock nextRelease={nextRelease} />;

  return (
    <VStack alignment="leading" spacing={0} modifiers={[containerBackground(colors.bgCard, 'widget')]}>
      {nextRelease ? <Link destination={gameDeepLink(nextRelease.title)}>{countdown}</Link> : countdown}
      <Divider />
      {visible.length === 0 ? (
        <Text modifiers={[padding({ all: 16 }), font({ size: 13 }), foregroundStyle(colors.muted)]}>
          Nothing releasing this week
        </Text>
      ) : (
        <VStack alignment="leading" spacing={2} modifiers={[padding({ vertical: 8 })]}>
          {visible.map((game) => (
            <WeekRow key={game.title} game={game} />
          ))}
        </VStack>
      )}
    </VStack>
  );
});
