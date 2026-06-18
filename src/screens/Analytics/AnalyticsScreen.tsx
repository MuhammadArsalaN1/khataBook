import React, { useMemo, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useStore } from '../../store/useStore';
import { COLORS, TYPE_COLORS, TYPE_LABELS, USERS } from '../../constants';
import {
  getMonthlyComparisons, getCategoryBreakdown, getUserContribution, getSmartInsights,
} from '../../utils/analytics';
import { generateInsightReport, detectRecurringPatterns } from '../../utils/advancedAnalytics';
import { ExpenseType } from '../../types';
import { responsiveFontSize } from '../../utils/responsive';
import { toPKR, formatPKRCompact } from '../../utils/currency';
import DonutChart from '../../components/charts/DonutChart';

const W = Dimensions.get('window').width;

type TabType = '6months' | 'categories' | 'users' | 'wallets';

function BarRow({ label, value, max, color, total }: {
  label: string; value: number; max: number; color: string; total: number;
}) {
  const pct = max > 0 ? (value / max) : 0;
  const totalPct = total > 0 ? ((value / total) * 100).toFixed(0) : '0';
  return (
    <View style={bar.row}>
      <View style={bar.labelRow}>
        <Text style={bar.label} numberOfLines={1}>{label}</Text>
        <Text style={bar.pct}>{totalPct}%</Text>
      </View>
      <View style={bar.track}>
        <View style={[bar.fill, { width: `${pct * 100}%` as any, backgroundColor: color }]} />
      </View>
      <Text style={bar.amount}>Rs. {value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value.toLocaleString()}</Text>
    </View>
  );
}

const bar = StyleSheet.create({
  row: { marginBottom: 16 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  label: { fontSize: responsiveFontSize(13), fontWeight: '600', color: '#1E293B', flex: 1 },
  pct: { fontSize: responsiveFontSize(12), fontWeight: '700', color: '#7C3AED' },
  track: { height: 10, backgroundColor: '#F1F5F9', borderRadius: 5, overflow: 'hidden' },
  fill: { height: 10, borderRadius: 5 },
  amount: { fontSize: responsiveFontSize(11), color: '#64748B', marginTop: 4, fontWeight: '500' },
});

function IncomeExpenseChart({ comparisons }: { comparisons: any[] }) {
  const maxVal = Math.max(...comparisons.flatMap(c => [c.total]), 1);
  const chartH = 140;
  return (
    <View>
      <View style={iec.legend}>
        <View style={iec.legendItem}>
          <View style={[iec.legendDot, { backgroundColor: '#10B981' }]} />
          <Text style={iec.legendText}>Income</Text>
        </View>
        <View style={iec.legendItem}>
          <View style={[iec.legendDot, { backgroundColor: '#EF4444' }]} />
          <Text style={iec.legendText}>Expenses</Text>
        </View>
      </View>
      <View style={[iec.chartArea, { height: chartH + 30 }]}>
        <View style={iec.bars}>
          {comparisons.map((c, i) => {
            const expH = maxVal > 0 ? (c.total / maxVal) * chartH : 0;
            return (
              <View key={i} style={iec.barGroup}>
                <View style={iec.barsContainer}>
                  <View style={[iec.expBar, { height: expH }]} />
                </View>
                <Text style={iec.barLabel}>{c.label.split(' ')[0]}</Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const iec = StyleSheet.create({
  legend: { flexDirection: 'row', gap: 16, marginBottom: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: responsiveFontSize(12), color: '#64748B', fontWeight: '500' },
  chartArea: { justifyContent: 'flex-end' },
  bars: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    flex: 1,
    paddingBottom: 24,
  },
  barGroup: { alignItems: 'center', flex: 1 },
  barsContainer: { flexDirection: 'row', gap: 2, alignItems: 'flex-end' },
  expBar: { width: 14, backgroundColor: '#EF4444', borderTopLeftRadius: 4, borderTopRightRadius: 4, minHeight: 4 },
  barLabel: { fontSize: 9, color: '#94A3B8', marginTop: 6, fontWeight: '600' },
});

export default function AnalyticsScreen() {
  const { expenses, incomes, wallets, exchangeRates } = useStore();
  const [tab, setTab] = useState<TabType>('6months');
  const [period] = useState<6>(6);

  const comparisons = useMemo(() => getMonthlyComparisons(expenses, period), [expenses, period]);
  const catBreakdown = useMemo(() => getCategoryBreakdown(expenses).slice(0, 8), [expenses]);
  const insights = useMemo(() => getSmartInsights(expenses), [expenses]);
  const userContrib = useMemo(() => getUserContribution(expenses), [expenses]);
  const advancedInsights = useMemo(() => generateInsightReport(expenses), [expenses]);

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const totalIncome = useMemo(
    () => incomes.filter((i: any) => i.month === month && i.year === year).reduce((s: number, i: any) => s + i.amount, 0),
    [incomes, month, year]
  );
  const totalExpenses = useMemo(
    () => comparisons[comparisons.length - 1]?.total ?? 0,
    [comparisons]
  );
  const netProfit = totalIncome - totalExpenses;
  const avgMonthly = comparisons.length > 0 ? comparisons.reduce((s, c) => s + c.total, 0) / comparisons.length : 0;

  const maxCat = Math.max(...catBreakdown.map(c => c.amount), 1);
  const totalCat = catBreakdown.reduce((s, c) => s + c.amount, 0);

  const maxUser = Math.max(...USERS.map(u => userContrib[u.id] ?? 0), 1);
  const totalUser = USERS.reduce((s, u) => s + (userContrib[u.id] ?? 0), 0);

  const currentWallets = useMemo(
    () => wallets
      .filter(w => w.month === month && w.year === year)
      .map(w => ({ ...w, pkr: toPKR(w.balance, w.currency ?? 'PKR', exchangeRates) })),
    [wallets, month, year, exchangeRates]
  );
  const maxWallet = Math.max(...currentWallets.map(w => w.pkr), 1);
  const totalWallet = currentWallets.reduce((s, w) => s + w.pkr, 0);

  const TABS: { id: TabType; label: string }[] = [
    { id: '6months', label: '6 Months' },
    { id: 'categories', label: 'Categories' },
    { id: 'users', label: 'Users' },
    { id: 'wallets', label: 'Wallets' },
  ];

  const CAT_COLORS = ['#7C3AED', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#06B6D4', '#EC4899', '#14B8A6'];

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>Analytics</Text>
          <Text style={styles.subtitle}>Financial overview</Text>
        </View>
      </SafeAreaView>

      {/* Tab bar */}
      <View style={styles.tabBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabBarInner}>
          {TABS.map(t => (
            <TouchableOpacity
              key={t.id}
              style={[styles.tabBtn, tab === t.id && styles.tabBtnActive]}
              onPress={() => setTab(t.id)}
            >
              <Text style={[styles.tabText, tab === t.id && styles.tabTextActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {tab === '6months' && (
          <>
            {/* Bar chart */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Income vs Expenses</Text>
              </View>
              <IncomeExpenseChart comparisons={comparisons} />
            </View>

            {/* Summary row */}
            <View style={styles.summaryRow}>
              <View style={[styles.summaryCard, { backgroundColor: '#F0FDF4' }]}>
                <Text style={styles.summaryEmoji}>📈</Text>
                <Text style={[styles.summaryLabel, { color: '#15803D' }]}>Total Income</Text>
                <Text style={[styles.summaryAmt, { color: '#166534' }]}>Rs. {totalIncome.toLocaleString()}</Text>
              </View>
              <View style={[styles.summaryCard, { backgroundColor: '#FEF2F2' }]}>
                <Text style={styles.summaryEmoji}>📉</Text>
                <Text style={[styles.summaryLabel, { color: '#DC2626' }]}>Total Expenses</Text>
                <Text style={[styles.summaryAmt, { color: '#991B1B' }]}>Rs. {totalExpenses.toLocaleString()}</Text>
              </View>
            </View>
            <View style={styles.summaryRow}>
              <View style={[styles.summaryCard, { backgroundColor: netProfit >= 0 ? '#F0FDF4' : '#FEF2F2' }]}>
                <Text style={styles.summaryEmoji}>{netProfit >= 0 ? '💚' : '❤️'}</Text>
                <Text style={[styles.summaryLabel, { color: netProfit >= 0 ? '#15803D' : '#DC2626' }]}>Net Profit</Text>
                <Text style={[styles.summaryAmt, { color: netProfit >= 0 ? '#166534' : '#991B1B' }]}>
                  Rs. {Math.abs(netProfit).toLocaleString()}
                </Text>
              </View>
              <View style={[styles.summaryCard, { backgroundColor: '#EFF6FF' }]}>
                <Text style={styles.summaryEmoji}>📊</Text>
                <Text style={[styles.summaryLabel, { color: '#1D4ED8' }]}>Avg Monthly</Text>
                <Text style={[styles.summaryAmt, { color: '#1E3A8A' }]}>Rs. {Math.round(avgMonthly).toLocaleString()}</Text>
              </View>
            </View>

            {/* Trend */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Trend</Text>
              <View style={styles.trendRow}>
                <Text style={styles.trendText}>
                  {insights.trend === 'increasing' ? '📈 Spending is increasing' : '📉 Spending is decreasing'}
                </Text>
                <View style={[styles.trendBadge, {
                  backgroundColor: insights.trend === 'increasing' ? '#FEF2F2' : '#F0FDF4',
                }]}>
                  <Text style={[styles.trendBadgeText, {
                    color: insights.trend === 'increasing' ? '#DC2626' : '#15803D',
                  }]}>
                    {insights.trend === 'increasing' ? '▲ Rising' : '▼ Improving'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Monthly breakdown */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Month by Month</Text>
              {comparisons.slice().reverse().map((c, i) => (
                <View key={i} style={[styles.monthRow, i < comparisons.length - 1 && { borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }]}>
                  <Text style={styles.monthLabel}>{c.label}</Text>
                  <Text style={styles.monthTotal}>Rs. {c.total.toLocaleString()}</Text>
                  {c.change !== undefined && (
                    <Text style={[styles.monthChange, { color: c.change >= 0 ? '#DC2626' : '#15803D' }]}>
                      {c.change >= 0 ? '▲' : '▼'} {Math.abs(c.change).toFixed(1)}%
                    </Text>
                  )}
                </View>
              ))}
            </View>
          </>
        )}

        {tab === 'categories' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Category Breakdown</Text>
            <Text style={styles.cardSub}>All time · {catBreakdown.length} categories</Text>
            {catBreakdown.length > 0 && (
              <View style={{ alignItems: 'center', marginBottom: 16 }}>
                <DonutChart
                  size={150} strokeWidth={26}
                  data={catBreakdown.map((c, i) => ({ label: c.category, value: c.amount, color: CAT_COLORS[i % CAT_COLORS.length] }))}
                  centerLabel={formatPKRCompact(totalCat).replace('Rs. ', '')}
                  centerSub="total spent"
                />
              </View>
            )}
            {catBreakdown.map((c, i) => (
              <BarRow
                key={i}
                label={c.category}
                value={c.amount}
                max={maxCat}
                total={totalCat}
                color={CAT_COLORS[i % CAT_COLORS.length]}
              />
            ))}
            {catBreakdown.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={{ fontSize: 36 }}>📊</Text>
                <Text style={styles.emptyText}>No expenses to analyze</Text>
              </View>
            )}
          </View>
        )}

        {tab === 'users' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>User Contribution</Text>
            {USERS.map((u, i) => (
              <BarRow
                key={u.id}
                label={u.name}
                value={userContrib[u.id] ?? 0}
                max={maxUser}
                total={totalUser}
                color={u.role === 'admin' ? '#7C3AED' : '#06B6D4'}
              />
            ))}
          </View>
        )}

        {tab === 'wallets' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Wallet Balances</Text>
            <Text style={styles.cardSub}>{now.toLocaleDateString('en-PK', { month: 'long', year: 'numeric' })}</Text>
            {currentWallets.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={{ fontSize: 36 }}>👛</Text>
                <Text style={styles.emptyText}>No wallet data this month</Text>
              </View>
            ) : (
              currentWallets.map((w, i) => (
                <BarRow
                  key={w.id}
                  label={`${w.provider} (${w.currency})`}
                  value={w.pkr}
                  max={maxWallet}
                  total={totalWallet}
                  color={CAT_COLORS[i % CAT_COLORS.length]}
                />
              ))
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#F8FAFC',
  },
  title: { fontSize: responsiveFontSize(24), fontWeight: '800', color: '#1E293B' },
  subtitle: { fontSize: responsiveFontSize(13), color: '#94A3B8', fontWeight: '500', marginTop: 2 },
  tabBar: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tabBarInner: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  tabBtn: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  tabBtnActive: { backgroundColor: '#7C3AED' },
  tabText: { fontSize: responsiveFontSize(13), fontWeight: '600', color: '#64748B' },
  tabTextActive: { color: '#fff', fontWeight: '700' },
  scroll: { flex: 1 },
  card: {
    backgroundColor: '#fff',
    margin: 16,
    marginBottom: 0,
    borderRadius: 16,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  cardTitle: { fontSize: responsiveFontSize(15), fontWeight: '700', color: '#1E293B', marginBottom: 4 },
  cardSub: { fontSize: responsiveFontSize(12), color: '#94A3B8', fontWeight: '500', marginBottom: 16 },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    marginTop: 12,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 14,
    padding: 14,
  },
  summaryEmoji: { fontSize: 22, marginBottom: 6 },
  summaryLabel: { fontSize: responsiveFontSize(11), fontWeight: '600', marginBottom: 4 },
  summaryAmt: { fontSize: responsiveFontSize(15), fontWeight: '800' },
  trendRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  trendText: { fontSize: responsiveFontSize(14), fontWeight: '600', color: '#1E293B', flex: 1 },
  trendBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  trendBadgeText: { fontSize: responsiveFontSize(12), fontWeight: '700' },
  monthRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  monthLabel: { flex: 1, fontSize: responsiveFontSize(13), fontWeight: '600', color: '#475569' },
  monthTotal: { fontSize: responsiveFontSize(13), fontWeight: '700', color: '#1E293B', marginRight: 12 },
  monthChange: { fontSize: responsiveFontSize(12), fontWeight: '700', width: 60, textAlign: 'right' },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: responsiveFontSize(14), color: '#94A3B8', fontWeight: '600', marginTop: 10 },
});
