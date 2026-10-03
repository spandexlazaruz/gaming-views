import React from 'react';
import { createWidget } from 'expo-widgets';
import { VStack } from '@expo/ui/swift-ui';
import { containerBackground, widgetURL } from '@expo/ui/swift-ui/modifiers';
import { CountdownBlock } from './CountdownBlock';
import { gameDeepLink } from '../../lib/widgetData';
import { colors } from '../../lib/theme';

// The "WatchlistCountdown" widget - name must match app.config.js's
// expo-widgets entry and the WidgetFamily list declared there. Mirrors
// widgets/android/WatchlistCountdownWidget.jsx: just the shared countdown
// block, no weekly list - this is the small/unobtrusive widget.
//
// containerBackground(_, 'widget') is required on the root view since
// iOS 17 - a plain `background` modifier is ignored/clipped on a widget's
// root (confirmed via @expo/ui's own containerBackground.d.ts).
//
// This widget's only content is the countdown block, so widgetURL (a
// widget supports just one, see CountdownBlock.jsx's comment) belongs
// here at the root - tapping anywhere opens that one game, or just the
// app itself when there's no release to link to.
export const watchlistCountdownWidget = createWidget('WatchlistCountdown', (props) => {
  const nextRelease = props.nextRelease ?? null;
  const modifiers = [containerBackground(colors.bgCard, 'widget')];
  if (nextRelease) modifiers.push(widgetURL(gameDeepLink(nextRelease.title)));

  return (
    <VStack modifiers={modifiers}>
      <CountdownBlock nextRelease={nextRelease} />
    </VStack>
  );
});
