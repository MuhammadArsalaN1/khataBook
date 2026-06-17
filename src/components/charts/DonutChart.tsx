import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { COLORS } from '../../constants';

interface Slice { label: string; value: number; color: string; }

interface Props {
  data: Slice[];
  size?: number;
  strokeWidth?: number;
  centerLabel?: string;
  centerSub?: string;
}

export default function DonutChart({ data, size = 160, strokeWidth = 22, centerLabel, centerSub }: Props) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const radius = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * radius;

  if (total === 0) {
    return (
      <View style={[styles.wrap, { width: size, height: size }]}>
        <Svg width={size} height={size}>
          <Circle cx={cx} cy={cy} r={radius} stroke={COLORS.border} strokeWidth={strokeWidth} fill="none" />
        </Svg>
        <View style={[styles.center, { width: size, height: size }]}>
          <Text style={styles.centerLabel}>No data</Text>
        </View>
      </View>
    );
  }

  let offset = 0;
  const slices = data.filter(d => d.value > 0).map(d => {
    const pct = d.value / total;
    const dash = pct * circumference;
    const gap = circumference - dash;
    const rotation = (offset / total) * 360 - 90;
    offset += d.value;
    return { ...d, dash, gap, rotation };
  });

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <G rotation={-90} origin={`${cx}, ${cy}`}>
          {slices.map((s, i) => (
            <Circle
              key={i}
              cx={cx} cy={cy} r={radius}
              stroke={s.color}
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={`${s.dash} ${s.gap}`}
              strokeDashoffset={0}
              rotation={s.rotation}
              origin={`${cx}, ${cy}`}
              strokeLinecap="butt"
            />
          ))}
        </G>
      </Svg>
      <View style={[styles.center, { width: size, height: size }]}>
        {centerLabel ? <Text style={styles.centerLabel}>{centerLabel}</Text> : null}
        {centerSub ? <Text style={styles.centerSub}>{centerSub}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  center: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  centerLabel: { fontSize: 15, fontWeight: '800', color: COLORS.text, textAlign: 'center' },
  centerSub: { fontSize: 10, color: COLORS.textLight, marginTop: 2, textAlign: 'center' },
});
