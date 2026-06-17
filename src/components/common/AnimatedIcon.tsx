import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { LOTTIE_ICONS } from '../../constants';

// Lottie is loaded lazily/defensively so the app still runs in environments
// where the native module isn't linked yet.
let LottieView: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  LottieView = require('lottie-react-native').default;
} catch {
  LottieView = null;
}

interface Props {
  name: keyof typeof LOTTIE_ICONS | string;
  size?: number;
  emojiSize?: number;
  style?: ViewStyle;
  loop?: boolean;
  autoPlay?: boolean;
}

/**
 * Renders a Lottie animation if its .json source is registered in LOTTIE_ICONS,
 * otherwise gracefully falls back to the matching emoji glyph. This lets the UI
 * ship now and "light up" with animation as soon as the .json files are dropped
 * into assets/lottie/ and wired into LOTTIE_ICONS.
 */
export default function AnimatedIcon({
  name, size = 40, emojiSize, style, loop = true, autoPlay = true,
}: Props) {
  const entry = LOTTIE_ICONS[name as string];
  const source = entry?.source ?? null;
  const emoji = entry?.emoji ?? '⬤';

  if (LottieView && source) {
    return (
      <View style={[{ width: size, height: size }, style]}>
        <LottieView source={source} autoPlay={autoPlay} loop={loop} style={{ width: size, height: size }} />
      </View>
    );
  }

  return (
    <View style={[styles.fallback, { width: size, height: size }, style]}>
      <Text style={{ fontSize: emojiSize ?? size * 0.62 }}>{emoji}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: { alignItems: 'center', justifyContent: 'center' },
});
