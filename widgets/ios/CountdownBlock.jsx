import React from 'react';
import { VStack, Spacer, Text } from '@expo/ui/swift-ui';
import { foregroundStyle, background, font, frame, cornerRadius, padding } from '@expo/ui/swift-ui/modifiers';
import { toDate } from '../../lib/dates';
import { colors, PLATFORMS } from '../../lib/theme';

// Mirrors widgets/android/CountdownBlock.jsx - same content, same tiebreak/
// color conventions, SwiftUI primitives instead of react-native-android-
// widget's. One real difference: Text's `date`/`dateStyle="relative"` prop
// auto-updates natively as time passes (confirmed via @expo/ui's own type
// definitions), so there's no need to push a multi-day timeline of
// pre-computed "in N days" strings the way a naive snapshot-only approach
// would require - a single updateSnapshot (see lib/widgetBridge.js) keeps
// the countdown accurate for as long as the release is still in the future.
//
// Deliberately no tap target here - a widget supports only one `widgetURL`
// in its whole view hierarchy, so WatchlistCountdownWidget (this block is
// its only content) applies it at the top level, while ThisWeekReleasesWidget
// (where this block is one of several distinct tap targets alongside each
// week row) wraps it in a `Link` instead. Either way, navigation is the
// caller's job, not this shared presentational component's.
export function CountdownBlock({ nextRelease }) {
  if (!nextRelease) {
    return (
      <VStack alignment="leading" spacing={4} modifiers={[padding({ all: 16 })]}>
        <Text modifiers={[font({ size: 15, weight: 'semibold' }), foregroundStyle(colors.white)]}>
          No upcoming releases
        </Text>
        <Text modifiers={[font({ size: 12 }), foregroundStyle(colors.muted)]}>
          Add games to your Watchlist
        </Text>
      </VStack>
    );
  }

  const accentPlatform = [...nextRelease.platforms].sort()[0];
  const accentColor = PLATFORMS[accentPlatform]?.color || colors.orange;

  return (
    <VStack
      alignment="leading"
      spacing={6}
      modifiers={[padding({ all: 16 })]}
    >
      <VStack modifiers={[frame({ width: 24, height: 4 }), background(accentColor), cornerRadius(2)]}>
        <Spacer minLength={0} />
      </VStack>
      <Text
        modifiers={[font({ size: 16, weight: 'bold' }), foregroundStyle(colors.white)]}
      >
        {nextRelease.title}
      </Text>
      <Text
        date={toDate(nextRelease.date)}
        dateStyle="relative"
        modifiers={[font({ size: 12 }), foregroundStyle(colors.muted)]}
      />
    </VStack>
  );
}
