import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../constants';
import { responsiveFontSize } from '../../utils/responsive';

interface TrendIndicatorProps {
  value: number; // percentage change
  label: string;
  isPositive?: boolean; // whether positive is good or bad
}

export default function TrendIndicator({ value, label, isPositive = false }: TrendIndicatorProps) {
  const isUp = value > 0;
  const isGood = isPositive ? isUp : !isUp;
  const color = isGood ? COLORS.success : COLORS.danger;
  const arrow = isUp ? '↑' : '↓';

  return (
    <View style={styles.container}>
      <Text style={[styles.arrow, { color }]}>{arrow}</Text>
      <Text style={[styles.value, { color }]}>{Math.abs(value).toFixed(0)}%</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-end',
  },
  arrow: {
    fontSize: responsiveFontSize(14),
    fontWeight: '700',
  },
  value: {
    fontSize: responsiveFontSize(12),
    fontWeight: '700',
  },
  label: {
    fontSize: responsiveFontSize(10),
    color: COLORS.textLight,
    marginTop: 2,
    fontWeight: '500',
  },
});
