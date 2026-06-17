import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../constants';
import { responsiveFontSize, responsiveSpacing } from '../../utils/responsive';

interface CategoryInsightProps {
  icon: string;
  name: string;
  amount: number;
  percentage: number;
  trend: 'up' | 'down';
  comparison: number;
}

export default function CategoryInsight({
  icon,
  name,
  amount,
  percentage,
  trend,
  comparison,
}: CategoryInsightProps) {
  const trendColor = trend === 'up' ? COLORS.danger : COLORS.success;
  const trendArrow = trend === 'up' ? '↑' : '↓';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.nameSection}>
          <Text style={styles.icon}>{icon}</Text>
          <View>
            <Text style={styles.name}>{name}</Text>
            <Text style={styles.amount}>Rs. {amount.toLocaleString()}</Text>
          </View>
        </View>
        <View style={styles.trendSection}>
          <Text style={[styles.trend, { color: trendColor }]}>
            {trendArrow} {percentage}%
          </Text>
          <Text style={styles.comparison}>vs last month</Text>
        </View>
      </View>
      <View style={styles.barContainer}>
        <View style={[styles.bar, { width: `${Math.min(percentage, 100)}%`, backgroundColor: trendColor }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: responsiveSpacing(12),
    marginBottom: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  nameSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    fontSize: 24,
    marginRight: 10,
  },
  name: {
    fontSize: responsiveFontSize(13),
    fontWeight: '700',
    color: COLORS.text,
  },
  amount: {
    fontSize: responsiveFontSize(11),
    color: COLORS.textLight,
    marginTop: 2,
  },
  trendSection: {
    alignItems: 'flex-end',
  },
  trend: {
    fontSize: responsiveFontSize(13),
    fontWeight: '700',
  },
  comparison: {
    fontSize: responsiveFontSize(9),
    color: COLORS.textLight,
    marginTop: 1,
  },
  barContainer: {
    height: 6,
    backgroundColor: COLORS.divider,
    borderRadius: 3,
    overflow: 'hidden',
  },
  bar: {
    height: 6,
    borderRadius: 3,
  },
});
