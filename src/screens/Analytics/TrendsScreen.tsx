import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useStore } from '../../store/useStore';
import { COLORS, GRADIENTS } from '../../constants';
import { formatMoney } from '../../utils/currency';
import { getSpendingTrends, compareSpending, getCategoryBreakdown, getTypeBreakdown } from '../../utils/trends';
import { responsiveFontSize } from '../../utils/responsive';

export default function TrendsScreen() {
  const navigation = useNavigation<any>();
  const { expenses } = useStore();

  const trends = useMemo(() => getSpendingTrends(expenses, 6), [expenses]);
  const comparison = useMemo(() => compareSpending(expenses), [expenses]);
  const categoryBreakdown = useMemo(() => getCategoryBreakdown(expenses), [expenses]);
  const typeBreakdown = useMemo(() => getTypeBreakdown(expenses), [expenses]);

  // Find max value for chart scaling
  const maxValue = Math.max(...trends.map(t => t.total), 1);

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={GRADIENTS.header as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Spending Trends</Text>
        <Text style={styles.headerSubtitle}>Last 6 months analysis</Text>
      </LinearGradient>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Current Month Comparison */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>This Month vs Last Month</Text>
          <View style={styles.comparisonRow}>
            <View style={styles.compCard}>
              <Text style={styles.compLabel}>This Month</Text>
              <Text style={styles.compValue}>{formatMoney(comparison.thisMonth)}</Text>
            </View>
            <View style={styles.compCard}>
              <Text style={styles.compLabel}>Last Month</Text>
              <Text style={styles.compValue}>{formatMoney(comparison.lastMonth)}</Text>
            </View>
          </View>
          <View style={[styles.comparisonIndicator, { backgroundColor: comparison.percentChange > 0 ? '#FFE5E5' : '#E5F5E5' }]}>
            <Text style={[styles.comparisonText, { color: comparison.percentChange > 0 ? '#991B1B' : '#1B6B1B' }]}>
              {comparison.percentChange > 0 ? '📈' : '📉'} {Math.abs(Math.round(comparison.percentChange))}% {comparison.percentChange > 0 ? 'higher' : 'lower'}
            </Text>
          </View>
        </View>

        {/* 6-Month Chart */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6-Month History</Text>
          <View style={styles.chartContainer}>
            {trends.map((trend, idx) => {
              const barHeight = Math.max((trend.total / maxValue) * 120, 8);
              const isUp = trend.change !== 0 && trend.change !== undefined && trend.change > 0;
              return (
                <View key={idx} style={styles.barCol}>
                  <Text style={styles.barVal}>{trend.total >= 1000 ? `${(trend.total / 1000).toFixed(1)}k` : trend.total}</Text>
                  <View style={[styles.bar, { height: barHeight, backgroundColor: isUp ? COLORS.warning : COLORS.success }]} />
                  <Text style={styles.barLabel}>{trend.label.split(' ')[0]}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Averages */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Averages</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statSmallLabel}>3-Month Avg</Text>
              <Text style={styles.statBigValue}>{formatMoney(comparison.threeMonthAvg)}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statSmallLabel}>6-Month Avg</Text>
              <Text style={styles.statBigValue}>{formatMoney(comparison.sixMonthAvg)}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statSmallLabel}>Year-over-Year</Text>
              <Text style={styles.statBigValue}>{formatMoney(comparison.lastYear)}</Text>
            </View>
          </View>
        </View>

        {/* Type Breakdown (This Month) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Breakdown by Type</Text>
          {Object.entries(typeBreakdown).map(([type, data]) => (
            <View key={type} style={styles.breakdownItem}>
              <View style={styles.breakdownLabel}>
                <Text style={styles.breakdownName}>{type.charAt(0).toUpperCase() + type.slice(1)}</Text>
                <Text style={styles.breakdownPercent}>{Math.round(data.percent)}%</Text>
              </View>
              <View style={styles.breakdownBar}>
                <View style={[styles.breakdownFill, { width: `${data.percent}%`, backgroundColor: type === 'personal' ? '#1A1A1A' : type === 'office' ? '#F5B700' : '#D99E00' }]} />
              </View>
              <Text style={styles.breakdownAmount}>{formatMoney(data.amount)}</Text>
            </View>
          ))}
        </View>

        {/* Category Breakdown (Top 10) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Categories This Month</Text>
          {Object.entries(categoryBreakdown)
            .sort(([, a], [, b]) => b.amount - a.amount)
            .slice(0, 10)
            .map(([cat, data]) => (
              <View key={cat} style={styles.breakdownItem}>
                <View style={styles.breakdownLabel}>
                  <Text style={styles.breakdownName}>{cat}</Text>
                  <Text style={styles.breakdownPercent}>{Math.round(data.percent)}%</Text>
                </View>
                <View style={styles.breakdownBar}>
                  <View style={[styles.breakdownFill, { width: `${data.percent}%` }]} />
                </View>
                <Text style={styles.breakdownAmount}>{formatMoney(data.amount)}</Text>
              </View>
            ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAFAF7' },
  header: { paddingHorizontal: 20, paddingVertical: 16, paddingBottom: 20 },
  backBtn: { paddingBottom: 12 },
  backText: { color: '#1A1A1A', fontWeight: '700', fontSize: responsiveFontSize(15) },
  headerTitle: { fontSize: responsiveFontSize(26), fontWeight: '800', color: '#1A1A1A' },
  headerSubtitle: { fontSize: responsiveFontSize(13), color: 'rgba(26,26,26,0.6)', marginTop: 2, fontWeight: '600' },
  scroll: { flex: 1, paddingHorizontal: 16 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: responsiveFontSize(15), fontWeight: '800', color: COLORS.text, marginBottom: 12 },
  comparisonRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  compCard: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 16, alignItems: 'center' },
  compLabel: { fontSize: responsiveFontSize(11), color: COLORS.textLight, fontWeight: '700' },
  compValue: { fontSize: responsiveFontSize(18), fontWeight: '800', color: COLORS.text, marginTop: 6 },
  comparisonIndicator: { borderRadius: 12, padding: 12, alignItems: 'center' },
  comparisonText: { fontWeight: '700', fontSize: responsiveFontSize(13) },
  chartContainer: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, paddingVertical: 16, backgroundColor: '#fff', borderRadius: 16, padding: 12, minHeight: 160 },
  barCol: { flex: 1, alignItems: 'center' },
  barVal: { fontSize: responsiveFontSize(9), color: COLORS.textMed, fontWeight: '700', marginBottom: 4, minHeight: 14 },
  bar: { width: '100%', borderTopLeftRadius: 5, borderTopRightRadius: 5, marginBottom: 6 },
  barLabel: { fontSize: responsiveFontSize(10), color: COLORS.text, fontWeight: '700' },
  statsGrid: { flexDirection: 'row', gap: 10 },
  statBox: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 14, alignItems: 'center' },
  statSmallLabel: { fontSize: responsiveFontSize(10), color: COLORS.textLight, fontWeight: '700' },
  statBigValue: { fontSize: responsiveFontSize(14), fontWeight: '800', color: COLORS.text, marginTop: 6 },
  breakdownItem: { marginBottom: 12 },
  breakdownLabel: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  breakdownName: { fontSize: responsiveFontSize(12), fontWeight: '700', color: COLORS.text },
  breakdownPercent: { fontSize: responsiveFontSize(12), fontWeight: '700', color: COLORS.textLight },
  breakdownBar: { height: 6, backgroundColor: '#ECECE6', borderRadius: 3, overflow: 'hidden', marginBottom: 4 },
  breakdownFill: { height: '100%', backgroundColor: COLORS.primary },
  breakdownAmount: { fontSize: responsiveFontSize(11), color: COLORS.textMed, fontWeight: '600' },
});
