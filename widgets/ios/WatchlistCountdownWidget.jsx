import React from 'react';
import { createWidget } from 'expo-widgets';
import { VStack, HStack, Spacer, Text, Image } from '@expo/ui/swift-ui';
import { containerBackground, foregroundStyle, background, font, frame, cornerRadius, clipShape, resizable, aspectRatio, padding, widgetURL } from '@expo/ui/swift-ui/modifiers';

// The "WatchlistCountdown" widget - name must match app.config.js's
// expo-widgets entry and the WidgetFamily list declared there. Mirrors
// widgets/android/WatchlistCountdownWidget.jsx's content (countdown only,
// no weekly list - this is the small/unobtrusive widget).
//
// FIXED (on-device crash: "ReferenceError: Can't find variable: colors"):
// a 'widget'-marked function is extracted and serialized to a standalone
// string by babel-preset-expo's widgets-plugin.js (confirmed by reading
// it) - it loses the surrounding module's scope entirely, so the earlier
// version's imports of lib/theme.js, lib/dates.js, lib/widgetData.js and
// a separate ./CountdownBlock component all failed to resolve at runtime
// despite working fine in the main app. @expo/ui/swift-ui's own exports
// (VStack, Text, the modifiers) are the one exception - this package is
// specifically built around this execution model, so those keep working
// as regular imports. Everything else - colors, the countdown
// label/date logic, the deep-link URL - is now inlined directly inside
// this function so it's genuinely part of what gets serialized.
export const watchlistCountdownWidget = createWidget('WatchlistCountdown', (props) => {
  'widget';
  const nextRelease = props.nextRelease ?? null;
  const colorWhite = '#FFFFFF';
  const colorMuted = '#9AA3AF';
  const colorBgCard = '#1C2129';
  const colorOrange = '#F4820A';
  const platformColors = { ps: '#003791', xbox: '#107C10', switch: '#E60012', pc: '#66C0F4' };

  if (!nextRelease) {
    return (
      <VStack alignment="leading" spacing={4} modifiers={[padding({ all: 16 }), containerBackground(colorBgCard, 'widget')]}>
        <Text modifiers={[font({ size: 15, weight: 'semibold' }), foregroundStyle(colorWhite)]}>
          No upcoming releases
        </Text>
        <Text modifiers={[font({ size: 12 }), foregroundStyle(colorMuted)]}>
          Add games to your Watchlist
        </Text>
      </VStack>
    );
  }

  const accentPlatform = [...nextRelease.platforms].sort()[0];
  const accentColor = platformColors[accentPlatform] || colorOrange;
  const releaseDate = new Date(nextRelease.date[0], nextRelease.date[1], nextRelease.date[2]);
  const deepLink = `gamingviews://game/${encodeURIComponent(nextRelease.title)}`;

  const textColumn = (
    <VStack alignment="leading" spacing={6}>
      <VStack modifiers={[frame({ width: 24, height: 4 }), background(accentColor), cornerRadius(2)]}>
        <Spacer minLength={0} />
      </VStack>
      <Text modifiers={[font({ size: 16, weight: 'bold' }), foregroundStyle(colorWhite)]}>
        {nextRelease.title}
      </Text>
      <Text date={releaseDate} dateStyle="relative" modifiers={[font({ size: 12 }), foregroundStyle(colorMuted)]} />
    </VStack>
  );

  return (
    <HStack
      spacing={12}
      modifiers={[padding({ all: 16 }), containerBackground(colorBgCard, 'widget'), widgetURL(deepLink)]}
    >
      {props.coverImageUri ? (
        <Image
          uiImage={props.coverImageUri}
          modifiers={[
            resizable(),
            aspectRatio({ contentMode: 'fill' }),
            frame({ width: 48, height: 64 }),
            clipShape('roundedRectangle', 8),
          ]}
        />
      ) : null}
      {textColumn}
    </HStack>
  );
});
