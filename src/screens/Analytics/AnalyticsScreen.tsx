import React, { useMemo, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, 
  TouchableOpacity, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../../store/useStore';
import { COLORS, TYPE_COLORS, TYPE_LABELS } from '../../constants';
import {
  getMonthlyComparisons, getCategoryBreakdown, getUserContribution, getSmartInsights,
} from '../../utils/analytics';
import { generateInsightReport, detectRecurringPatterns } from '../../utils/advancedAnalytics';
import { ExpenseType } from '../../types';
import { USERS } from '../../constants';
import { responsiveFontSize, responsiveSpacing } from '../../utils/responsive';

const W = Dimensions.get('window').width - 48;

function SimpleBarChart({ data }: { data: { label: string; value: number; color?: string }[] }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <View style={bc.container}>
      {data.map((d, i) => (
        <View key={i} style={bc.row}>
          <Text style={bc.label}>{d.label}</Text>
          <View style={bc.barBg}>
            <View style={[bc.bar, { width: `${(d.value / max) * 100}%`, backgroundColor: d.color ?? COLORS.primary }]} />
          </View>
          <Text style={bc.value}>Rs.{(d.value / 1000).toFixed(1)}k</Text>
        </View>
      ))}
    </View>
  );
}

const bc = StyleSheet.create({
  container: {},
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  label: { width: 44, fontSize: 10, color: COLORS.textLight },
  barBg: { flex: 1, height: 14, backgroundColor: COLORS.border, borderRadius: 7, overflow: 'hidden', marginHorizontal: 6 },
  bar: { height: 14, borderRadius: 7 },
  value: { width: 46, fontSize: 10, color: COLORS.text, fontWeight: '600', textAlign: 'right' },
});

function PieChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const total = data.reduce((a, d) => a + d.value, 0);
  return (
    <View style={pc.container}>
      {data.map((d, i) => (
        <View key={i} style={pc.row}>
          <View style={[pc.dot, { backgroundColor: d.color }]} />
          <Text style={pc.label}>{d.label}</Text>
          <Text style={pc.pct}>{total > 0 ? ((d.value / total) * 100).toFixed(1) : 0}%</Text>
          <Text style={pc.amount}>Rs. {d.value.toLocaleString()}</Text>
        </View>
      ))}
    </View>
  );
}

const pc = StyleSheet.create({
  container: {},
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  dot: { width: 12, height: 12, borderRadius: 6, marginRight: 8 },
  label: { flex: 1, fontSize: 13, color: COLORS.text },
  pct: { fontSize: 12, color: COLORS.textLight, width: 44, textAlign: 'right' },
  amount: { fontSize: 12, fontWeight: '700', color: COLORS.text, width: 80, textAlign: 'right' },
});

export default function AnalyticsScreen() {
  const { expenses } = useStore();
  const [catType, setCatType] = useState<ExpenseType | 'all'>('all');
  const [period, setPeriod] = useState<3 | 6 | 12>(6);

  const comparisons = useMemo(() => getMonthlyComparisons(expenses, period), [expenses, period]);
  const catBreakdown = useMemo(() => getCategoryBreakdown(expenses, catType === 'all' ? undefined : catType).slice(0, 8), [expenses, catType]);
  const insights = useMemo(() => getSmartInsights(expenses), [expenses]);
  const userContrib = useMemo(() => getUserContribution(expenses), [expenses]);
  const advancedInsights = useMemo(() => generateInsightReport(expenses), [expenses]);
  const recurringPatterns = useMemo(() => detectRecurringPatterns(expenses), [expenses]);

  const typeData = useMemo(() => {
    const latest = comparisons[comparisons.length - 1];
    if (!latest) return [];
    return [
      { label: 'Personal', value: latest.personal, color: TYPE_COLORS.personal },
      { label: 'Office', value: latest.office, color: TYPE_COLORS.office },
      { label: 'Farm', value: latest.farm, color: TYPE_COLORS.farm },
    ];
  }, [comparisons]);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Analytics</Text>

        {/* Smart Insights */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Smart Insights</Text>
          <View style={styles.insightGrid}>
            <View style={styles.insightItem}>
              <Text style={styles.insightEmoji}>🔥</Text>
              <Text style={styles.insightLabel}>Top Category</Text>
              <Text style={styles.insightVal}>{insights.highestCat}</Text>
            </View>
            <View style={styles.insightItem}>
              <Text style={styles.insightEmoji}>{insights.trend === 'increasing' ? '📈' : '📉'}</Text>
              <Text style={styles.insightLabel}>Trend</Text>
              <Text style={[styles.insightVal, { color: insights.trend === 'increasing' ? COLORS.danger : COLORS.success }]}>
                {insights.trend === 'increasing' ? 'Rising' : 'Falling'}
              </Text>
            </View>
            <View style={styles.insightItem}>
              <Text style={styles.insightEmoji}>📊</Text>
              <Text style={styles.insightLabel}>Avg Monthly</Text>
              <Text style={styles.insightVal}>Rs. {insights.avgMonthly.toFixed(0)}</Text>
            </View>
            <View style={styles.insightItem}>
              <Text style={styles.insightEmoji}>😴</Text>
              <Text style={styles.insightLabel}>Low Month</Text>
              <Text style={styles.insightVal}>{insights.lowestMonth}</Text>
            </View>
          </View>
        </View>

        {/* Monthly Trend */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Monthly Trend</Text>
            <View style={styles.periodRow}>
              {([3, 6, 12] as const).map(p => (
                <TouchableOpacity key={p} style={[styles.periodBtn, period === p && styles.periodBtnActive]} onPress={() => setPeriod(p)}>
                  <Text style={[styles.periodText, period === p && styles.periodTextActive]}>{p}M</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <SimpleBarChart data={comparisons.map(c => ({
            label: c.label,
            value: c.total,
            color: COLORS.primary,
          }))} />

          {/* Comparison table */}
          <View style={styles.compTable}>
            {comparisons.slice(-3).reverse().map((c, i) => (
              <View key={i} style={styles.compRow}>
                <Text style={styles.compLabel}>{c.label}</Text>
                <Text style={styles.compTotal}>Rs. {c.total.toLocaleString()}</Text>
                {c.change !== undefined && (
                  <Text style={[styles.compChange, { color: c.change >= 0 ? COLORS.danger : COLORS.success }]}>
                    {c.change >= 0 ? '▲' : '▼'} {Math.abs(c.change).toFixed(1)}%
                  </Text>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Type Breakdown */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>This Month by Type</Text>
          <PieChart data={typeData} />
        </View>

        {/* Category Breakdown */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Category Breakdown</Text>
          </View>
          <View style={styles.filterRow}>
            {(['all', 'personal', 'office', 'farm'] as const).map(t => (
              <TouchableOpacity
                key={t}
                style={[styles.filterChip, catType === t && styles.filterChipActive]}
                onPress={() => setCatType(t)}
              >
                <Text style={[styles.filterText, catType === t && styles.filterTextActive]}>
                  {t === 'all' ? 'All' : TYPE_LABELS[t]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <SimpleBarChart data={catBreakdown.map((c, i) => ({
            label: c.category.substring(0, 6),
            value: c.amount,
            color: [COLORS.primary, COLORS.secondary, COLORS.success, COLORS.warning, COLORS.danger][i % 5],
          }))} />
        </View>

        {/* User Contribution */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>User Contribution</Text>
          <PieChart data={USERS.map(u => ({
            label: u.name,
            value: userContrib[u.id] ?? 0,
            color: u.role === 'admin' ? COLORS.primary : COLORS.secondary,
          }))} />
        </View>

        {/* Spending Insights */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>💡 Spending Insights</Text>
          <View style={styles.insightGrid}>
            <View style={styles.insightItem}>
              <Text style={styles.insightEmoji}>⚡</Text>
              <Text style={styles.insightLabel}>Avg Daily</Text>
              <Text style={styles.insightVal}>Rs. {advancedInsights.spendingVelocity.toFixed(0)}</Text>
            </View>
            <View style={styles.insightItem}>
              <Text style={styles.insightEmoji}>📈</Text>
              <Text style={styles.insightLabel}>Variability</Text>
              <Text style={styles.insightVal}>{advancedInsights.costVariability.toFixed(0)}%</Text>
            </View>
            <View style={styles.insightItem}>
              <Text style={styles.insightEmoji}>🔄</Text>
              <Text style={styles.insightLabel}>Recurring</Text>
              <Text style={styles.insightVal}>{recurringPatterns.length}</Text>
            </View>
            <View style={styles.insightItem}>
              <Text style={styles.insightEmoji}>🎯</Text>
              <Text style={styles.insightLabel}>Top Category</Text>
              <Text style={[styles.insightVal, { fontSize: 12 }]}>
                {advancedInsights.topCategories[0]?.category ?? 'N/A'}
              </Text>
            </View>
          </View>
        </View>

        {/* Category Trends */}
        {advancedInsights.topCategories.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📊 Category Trends</Text>
            {advancedInsights.topCategories.map((trend, i) => (
              <View key={i} style={[styles.trendRow, i < advancedInsights.topCategories.length - 1 && styles.trendRowBorder]}>
                <View>
                  <Text style={styles.trendCategory}>{trend.category}</Text>
                  <Text style={styles.trendAmount}>Rs. {trend.thisMonth.toLocaleString()}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.trendChange, { color: trend.trend === 'up' ? COLORS.danger : COLORS.success }]}>
                    {trend.trend === 'up' ? '↑' : '↓'} {Math.abs(trend.change).toFixed(0)}%
                  </Text>
                  <Text style={styles.trendCompare}>vs Rs. {trend.lastMonth.toLocaleString()}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Recurring Patterns */}
        {recurringPatterns.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🔁 Recurring Patterns</Text>
            {recurringPatterns.map((pattern, i) => (
              <View key={i} style={[styles.patternRow, i < recurringPatterns.length - 1 && styles.patternRowBorder]}>
                <View>
                  <Text style={styles.patternCategory}>{pattern.category}</Text>
                  <Text style={styles.patternFreq}>{pattern.frequency.toFixed(1)}x/month</Text>
                </View>
                <Text style={styles.patternAmount}>Rs. {pattern.averageAmount.toLocaleString()}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1, paddingHorizontal: 16 },
  title: { fontSize: responsiveFontSize(22), fontWeight: '800', color: COLORS.text, paddingTop: 16, marginBottom: 14 },
  card: { backgroundColor: COLORS.white, borderRadius: 14, padding: responsiveSpacing(16), marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2, borderWidth: 1, borderColor: COLORS.border },
  cardTitle: { fontSize: responsiveFontSize(15), fontWeight: '700', color: COLORS.text, marginBottom: 14 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  periodRow: { flexDirection: 'row', gap: 4 },
  periodBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border },
  periodBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  periodText: { fontSize: 11, color: COLORS.textLight, fontWeight: '600' },
  periodTextActive: { color: COLORS.white },
  insightGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  insightItem: { flex: 1, minWidth: '45%', backgroundColor: COLORS.background, borderRadius: 10, padding: 12, alignItems: 'center' },
  insightEmoji: { fontSize: 22, marginBottom: 4 },
  insightLabel: { fontSize: 11, color: COLORS.textLight, marginBottom: 2 },
  insightVal: { fontSize: 14, fontWeight: '700', color: COLORS.text, textAlign: 'center' },
  compTable: { marginTop: 12, borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 8 },
  compRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  compLabel: { flex: 1, fontSize: 13, color: COLORS.textLight },
  compTotal: { fontSize: 13, fontWeight: '700', color: COLORS.text, width: 100, textAlign: 'right' },
  compChange: { fontSize: 12, fontWeight: '600', width: 60, textAlign: 'right' },
  filterRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: 12 },
  filterChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border },
  filterChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterText: { fontSize: 11, color: COLORS.textLight },
  filterTextActive: { color: COLORS.white, fontWeight: '600' },
  trendRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 },
  trendRowBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.divider },
  trendCategory: { fontSize: responsiveFontSize(13), fontWeight: '600', color: COLORS.text },
  trendAmount: { fontSize: responsiveFontSize(12), color: COLORS.textLight, marginTop: 2 },
  trendChange: { fontSize: responsiveFontSize(12), fontWeight: '700' },
  trendCompare: { fontSize: responsiveFontSize(10), color: COLORS.textLight, marginTop: 2 },
  patternRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  patternRowBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.divider },
  patternCategory: { fontSize: responsiveFontSize(13), fontWeight: '600', color: COLORS.text },
  patternFreq: { fontSize: responsiveFontSize(11), color: COLORS.textLight, marginTop: 2 },
  patternAmount: { fontSize: responsiveFontSize(13), fontWeight: '700', color: COLORS.text },
});
