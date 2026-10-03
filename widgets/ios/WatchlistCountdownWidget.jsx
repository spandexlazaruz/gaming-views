import React from 'react';
import { createWidget } from 'expo-widgets';
import { VStack, ZStack, Spacer, Text, Image } from '@expo/ui/swift-ui';
import { containerBackground, foregroundStyle, background, font, frame, cornerRadius, resizable, aspectRatio, padding, widgetURL, lineLimit } from '@expo/ui/swift-ui/modifiers';

// The "WatchlistCountdown" widget - name must match app.config.js's
// expo-widgets entry and the WidgetFamily list declared there. This is the
// small/unobtrusive widget size, so it never shows the weekly list - just
// the countdown, as a full-bleed cover-image "hero card" with a dark
// gradient scrim and the title/countdown overlaid (Dan's choice after
// seeing the plain layout first - more eye-catching, mirrors
// widgets/android/WatchlistCountdownWidget.jsx's same OverlapWidget-based
// treatment). Falls back to the original flat layout when there's no
// cover image to use.
//
// FIXED (on-device crash: "ReferenceError: Can't find variable: colors"):
// a 'widget'-marked function is extracted and serialized to a standalone
// string by babel-preset-expo's widgets-plugin.js (confirmed by reading
// it) - it loses the surrounding module's scope entirely, so any imports
// from lib/theme.js, lib/dates.js, lib/widgetData.js, or a separate
// component all fail to resolve at runtime despite working fine in the
// main app. @expo/ui/swift-ui's own exports (VStack, Text, the modifiers)
// are the one exception - this package is specifically built around this
// execution model, so those keep working as regular imports. Everything
// else - colors, the countdown label/date logic, the deep-link URL - is
// inlined directly inside this function so it's genuinely part of what
// gets serialized.
//
// FIXED (hero layout sizing): the Image/gradient/outer ZStack all now get
// an explicit frame sized from WidgetFamily (WidgetEnvironment has no
// literal point-size field, so these are the standard fixed iPhone widget
// dimensions per family - HIG values; aspectRatio(fill) plus the OS's own
// widget corner masking absorb the few points of real variance across
// device sizes). Declared INSIDE the function, not at module scope - a
// sibling module-level declaration doesn't survive serialization either
// (see the 'widget' directive comment above for the full story).
//
// FIXED (date text still missing on-device after the sizing fix, on
// systemLarge specifically - confirmed via screenshot the image/title
// render correctly, just not the date): a live auto-updating
// `date`+`dateStyle="relative"` Text reliably failed to render only in
// this nested ZStack > VStack > Text position, while the exact same
// prop combination works fine in the flat (no-image) fallback below and
// in ThisWeekReleasesWidget.jsx - a real quirk in this library's
// handling of the live-updating Text variant at this nesting depth, not
// a frame/sizing problem. Replaced with a plain pre-computed string
// (countdownLabel + a short formatted date, mirroring
// widgets/android/WatchlistCountdownWidget.jsx's own already-working
// approach) - loses live auto-refresh without reopening the app, but
// that trade only matters while the release is many days out, and a
// reliably-rendering widget matters more than that convenience.
export const watchlistCountdownWidget = createWidget('WatchlistCountdown', (props, environment) => {
  'widget';

  const HERO_SIZES = {
    systemSmall: { width: 155, height: 155 },
    systemMedium: { width: 329, height: 155 },
    systemLarge: { width: 329, height: 345 },
  };

  function countdownLabel(date) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const days = Math.round((date - today) / 86400000);
    if (days === 0) return 'Today!';
    if (days === 1) return 'Tomorrow';
    return `In ${days} days`;
  }

  const nextRelease = props.nextRelease ?? null;
  const heroSize = HERO_SIZES[environment.widgetFamily] || HERO_SIZES.systemSmall;
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
  const subtitle = `${countdownLabel(releaseDate)} · ${releaseDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  const deepLink = `gamingviews://game/${encodeURIComponent(nextRelease.title)}`;

  const textColumn = (
    <VStack alignment="leading" spacing={6} modifiers={[padding({ all: 14 })]}>
      <VStack modifiers={[frame({ width: 22, height: 4 }), background(accentColor), cornerRadius(2)]}>
        <Spacer minLength={0} />
      </VStack>
      <Text modifiers={[font({ size: 15, weight: 'bold' }), foregroundStyle(colorWhite), lineLimit(1)]}>
        {nextRelease.title}
      </Text>
      <Text modifiers={[font({ size: 11 }), foregroundStyle(colorMuted), lineLimit(1)]}>{subtitle}</Text>
    </VStack>
  );

  if (!props.coverImageUri) {
    return (
      <VStack
        alignment="leading"
        spacing={6}
        modifiers={[padding({ all: 16 }), containerBackground(colorBgCard, 'widget'), widgetURL(deepLink)]}
      >
        <VStack modifiers={[frame({ width: 24, height: 4 }), background(accentColor), cornerRadius(2)]}>
          <Spacer minLength={0} />
        </VStack>
        <Text modifiers={[font({ size: 16, weight: 'bold' }), foregroundStyle(colorWhite), lineLimit(1)]}>
          {nextRelease.title}
        </Text>
        <Text modifiers={[font({ size: 12 }), foregroundStyle(colorMuted), lineLimit(1)]}>{subtitle}</Text>
      </VStack>
    );
  }

  return (
    <ZStack
      alignment="bottomLeading"
      modifiers={[frame(heroSize), containerBackground(colorBgCard, 'widget'), widgetURL(deepLink)]}
    >
      <Image
        uiImage={props.coverImageUri}
        modifiers={[resizable(), aspectRatio({ contentMode: 'fill' }), frame(heroSize)]}
      />
      <VStack
        modifiers={[
          frame(heroSize),
          background({
            type: 'linearGradient',
            colors: ['rgba(10, 12, 16, 0)', 'rgba(10, 12, 16, 0.92)'],
            startPoint: { x: 0.5, y: 0 },
            endPoint: { x: 0.5, y: 1 },
          }),
        ]}
      >
        <Spacer minLength={0} />
      </VStack>
      {textColumn}
    </ZStack>
  );
});
