import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import {
  format, startOfWeek, endOfWeek, startOfMonth, endOfMonth,
  startOfYear, endOfYear, subMonths, subDays,
} from 'date-fns';
import { useStore } from '../../store/useStore';
import { COLORS, GRADIENTS, TYPE_LABELS, TYPE_COLORS, CATEGORY_EMOJI } from '../../constants';
import { filterByDateRange, sumAmounts, sumByType, getCategoryBreakdown } from '../../utils/analytics';
import { formatMoney } from '../../utils/currency';
import { responsiveFontSize } from '../../utils/responsive';
import DonutChart from '../../components/charts/DonutChart';

type Period = 'daily' | 'weekly' | 'monthly' | 'quarterly' | '6months' | 'yearly';
const PERIODS: { id: Period; label: string }[] = [
  { id: 'daily', label: 'Daily' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
  { id: 'quarterly', label: 'Quarterly' },
  { id: '6months', label: '6 Months' },
  { id: 'yearly', label: 'Yearly' },
];
const CAT_PALETTE = COLORS.chart;
const isCounted = (s?: string) => s !== 'rejected' && s !== 'pending';

export default function ReportsScreen() {
  const { expenses, incomes } = useStore();
  const navigation = useNavigation<any>();
  const [period, setPeriod] = useState<Period>('monthly');
  const now = new Date();

  const { from, to, label, buckets } = useMemo(() => {
    switch (period) {
      case 'daily': return { from: subDays(now, 6), to: now, label: 'Last 7 days', buckets: 0 };
      case 'weekly': return { from: startOfWeek(now, { weekStartsOn: 1 }), to: endOfWeek(now, { weekStartsOn: 1 }), label: `Week of ${format(startOfWeek(now, { weekStartsOn: 1 }), 'dd MMM')}`, buckets: 0 };
      case 'monthly': return { from: startOfMonth(now), to: endOfMonth(now), label: format(now, 'MMMM yyyy'), buckets: 0 };
      case 'quarterly': return { from: startOfMonth(subMonths(now, 2)), to: endOfMonth(now), label: 'Last 3 months', buckets: 3 };
      case '6months': return { from: startOfMonth(subMonths(now, 5)), to: endOfMonth(now), label: 'Last 6 months', buckets: 6 };
      case 'yearly': return { from: startOfYear(now), to: endOfYear(now), label: format(now, 'yyyy'), buckets: 12 };
    }
  }, [period]);

  const periodExp = useMemo(
    () => filterByDateRange(expenses.filter(e => isCounted(e.status)), from, to),
    [expenses, from, to]
  );

  const periodIncome = useMemo(() => {
    return incomes
      .filter((i: any) => isCounted(i.status))
      .filter((i: any) => {
        const d = new Date(i.year, i.month - 1, 1);
        return d >= startOfMonth(from) && d <= to;
      })
      .reduce((s: number, i: any) => s + i.amount, 0);
  }, [incomes, from, to]);

  const byType = useMemo(() => sumByType(periodExp), [periodExp]);
  const totalExp = useMemo(() => sumAmounts(periodExp), [periodExp]);
  const topCats = useMemo(() => getCategoryBreakdown(periodExp).slice(0, 6), [periodExp]);
  const net = periodIncome - totalExp;
  const savingsRate = periodIncome > 0 ? Math.round((net / periodIncome) * 100) : 0;

  const monthly = useMemo(() => {
    if (!buckets) return [];
    const arr: { label: string; inc: number; exp: number }[] = [];
    for (let i = buckets - 1; i >= 0; i--) {
      const d = subMonths(now, i);
      const m = d.getMonth() + 1, y = d.getFullYear();
      const exp = expenses.filter(e => { const dd = new Date(e.date); return dd.getMonth() + 1 === m && dd.getFullYear() === y && isCounted(e.status); }).reduce((s, e) => s + e.amount, 0);
      const inc = incomes.filter((x: any) => x.month === m && x.year === y && isCounted(x.status)).reduce((s: number, x: any) => s + x.amount, 0);
      arr.push({ label: format(d, 'MMM'), inc, exp });
    }
    return arr;
  }, [expenses, incomes, period, buckets]);
  const monthlyMax = Math.max(...monthly.flatMap(m => [m.inc, m.exp]), 1);

  const insights = useMemo(() => {
    const out: string[] = [];
    if (topCats[0]) out.push(`Biggest spend: ${topCats[0].category} (${formatMoney(topCats[0].amount)}, ${totalExp > 0 ? Math.round(topCats[0].amount / totalExp * 100) : 0}% of total).`);
    const types = (['personal', 'office', 'farm'] as const).map(t => ({ t, v: byType[t] })).sort((a, b) => b.v - a.v);
    if (types[0]?.v > 0) out.push(`${TYPE_LABELS[types[0].t]} is your heaviest area at ${formatMoney(types[0].v)}.`);
    if (periodIncome > 0) out.push(net >= 0 ? `You saved ${formatMoney(net)} — a ${savingsRate}% savings rate. 👍` : `You overspent by ${formatMoney(-net)} this period. ⚠️`);
    if (monthly.length >= 2) {
      const last = monthly[monthly.length - 1].exp, prev = monthly[monthly.length - 2].exp;
      if (prev > 0) { const ch = Math.round((last - prev) / prev * 100); out.push(`Spending ${ch >= 0 ? 'rose' : 'fell'} ${Math.abs(ch)}% vs the previous month.`); }
    }
    return out;
  }, [topCats, byType, periodIncome, net, savingsRate, monthly, totalExp]);

  const shareReport = async () => {
    let t = `📊 KHATA BOOK REPORT — ${label}\n${'─'.repeat(30)}\n`;
    t += `Income:   ${formatMoney(periodIncome)}\nExpenses: ${formatMoney(totalExp)}\nNet:      ${formatMoney(net)} (${savingsRate}% saved)\n\n`;
    t += `By type:\n`;
    (['personal', 'office', 'farm'] as const).forEach(ty => { t += `  • ${TYPE_LABELS[ty]}: ${formatMoney(byType[ty])}\n`; });
    t += `\nTop categories:\n`;
    topCats.forEach(c => { t += `  • ${c.category}: ${formatMoney(c.amount)}\n`; });
    t += `\nInsights:\n`;
    insights.forEach(i => { t += `  • ${i}\n`; });
    await Share.share({ message: t });
  };

  return (
    <View style={styles.root}>
      <LinearGradient colors={GRADIENTS.header as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <SafeAreaView edges={['top']}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}><Text style={styles.headerBtnText}>‹</Text></TouchableOpacity>
            <Text style={styles.headerTitle}>Reports & Insights</Text>
            <View style={styles.headerBtn} />
          </View>
          <Text style={styles.headerSub}>{label}</Text>
        </SafeAreaView>
      </LinearGradient>

      <View style={styles.periodBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.periodInner}>
          {PERIODS.map(p => (
            <TouchableOpacity key={p.id} style={[styles.periodChip, period === p.id && styles.periodChipActive]} onPress={() => setPeriod(p.id)}>
              <Text style={[styles.periodChipText, period === p.id && styles.periodChipTextActive]}>{p.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 60 }}>
        <View style={styles.summaryRow}>
          <View style={[styles.sumCard, { backgroundColor: COLORS.accentSoft }]}>
            <Text style={styles.sumLabel}>Income</Text>
            <Text style={[styles.sumAmt, { color: COLORS.accentDark }]}>{formatMoney(periodIncome)}</Text>
          </View>
          <View style={[styles.sumCard, { backgroundColor: '#F5F5F0' }]}>
            <Text style={styles.sumLabel}>Expenses</Text>
            <Text style={[styles.sumAmt, { color: '#1A1A1A' }]}>{formatMoney(totalExp)}</Text>
          </View>
        </View>
        <View style={[styles.netCard, { backgroundColor: net >= 0 ? COLORS.accentSoft : '#F5F5F0' }]}>
          <View>
            <Text style={styles.sumLabel}>Net {net >= 0 ? 'Profit' : 'Loss'}</Text>
            <Text style={[styles.netAmt, { color: net >= 0 ? COLORS.accentDark : '#1A1A1A' }]}>{formatMoney(Math.abs(net))}</Text>
          </View>
          {periodIncome > 0 && <View style={styles.savingsPill}><Text style={styles.savingsPillText}>{savingsRate}% saved</Text></View>}
        </View>

        {insights.length > 0 && (
          <View style={styles.insightCard}>
            <Text style={styles.insightHead}>🤖 Smart Insights</Text>
            {insights.map((t, i) => (
              <View key={i} style={styles.insightRow}>
                <Text style={styles.insightDot}>•</Text>
                <Text style={styles.insightText}>{t}</Text>
              </View>
            ))}
          </View>
        )}

        {monthly.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Income vs Expense</Text>
            <View style={styles.legendRow}>
              <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: COLORS.accent }]} /><Text style={styles.legendText}>Income</Text></View>
              <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: '#1A1A1A' }]} /><Text style={styles.legendText}>Expense</Text></View>
            </View>
            <View style={styles.barChart}>
              {monthly.map((m, i) => (
                <View key={i} style={styles.barCol}>
                  <View style={styles.barPair}>
                    <View style={[styles.bar, { height: Math.max((m.inc / monthlyMax) * 100, 2), backgroundColor: COLORS.accent }]} />
                    <View style={[styles.bar, { height: Math.max((m.exp / monthlyMax) * 100, 2), backgroundColor: '#1A1A1A' }]} />
                  </View>
                  <Text style={styles.barLabel}>{m.label}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>By Type</Text>
          {totalExp === 0 ? <Text style={styles.empty}>No expenses in this period</Text> : (
            <View style={styles.donutRow}>
              <DonutChart size={140} strokeWidth={24}
                data={(['personal', 'office', 'farm'] as const).map(t => ({ label: TYPE_LABELS[t], value: byType[t], color: TYPE_COLORS[t] }))}
                centerLabel={totalExp >= 1000 ? `${(totalExp / 1000).toFixed(1)}k` : `${totalExp}`} centerSub="spent" />
              <View style={styles.legend}>
                {(['personal', 'office', 'farm'] as const).map(t => (
                  <View key={t} style={styles.legendItem}>
                    <View style={[styles.dot, { backgroundColor: TYPE_COLORS[t] }]} />
                    <Text style={styles.legendLabel}>{TYPE_LABELS[t]}</Text>
                    <Text style={styles.legendVal}>{formatMoney(byType[t])}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Top Categories</Text>
          {topCats.length === 0 ? <Text style={styles.empty}>No data</Text> : topCats.map((c, i) => {
            const pct = totalExp > 0 ? c.amount / totalExp : 0;
            return (
              <View key={c.category} style={styles.catRow}>
                <Text style={styles.catEmoji}>{CATEGORY_EMOJI[c.category] ?? '💰'}</Text>
                <View style={{ flex: 1 }}>
                  <View style={styles.catTop}>
                    <Text style={styles.catName}>{c.category}</Text>
                    <Text style={styles.catAmt}>{formatMoney(c.amount)}</Text>
                  </View>
                  <View style={styles.catBarBg}><View style={[styles.catBarFill, { width: `${pct * 100}%` as any, backgroundColor: CAT_PALETTE[i % CAT_PALETTE.length] }]} /></View>
                </View>
              </View>
            );
          })}
        </View>

        <TouchableOpacity style={styles.shareBtn} onPress={shareReport}>
          <Text style={styles.shareBtnText}>📤  Share {label} Report</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8 },
  headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerBtnText: { color: '#1A1A1A', fontSize: 34, fontWeight: '300', lineHeight: 36 },
  headerTitle: { color: '#1A1A1A', fontSize: responsiveFontSize(18), fontWeight: '800' },
  headerSub: { color: 'rgba(26,26,26,0.7)', fontSize: responsiveFontSize(12), fontWeight: '600', textAlign: 'center', paddingBottom: 14 },
  periodBar: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: COLORS.border },
  periodInner: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  periodChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F5F5F0' },
  periodChipActive: { backgroundColor: COLORS.primary },
  periodChipText: { fontSize: responsiveFontSize(13), fontWeight: '600', color: COLORS.textMed },
  periodChipTextActive: { color: '#fff', fontWeight: '700' },
  scroll: { flex: 1 },
  summaryRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  sumCard: { flex: 1, borderRadius: 14, padding: 16 },
  sumLabel: { fontSize: responsiveFontSize(12), color: COLORS.textMed, fontWeight: '600' },
  sumAmt: { fontSize: responsiveFontSize(18), fontWeight: '800', marginTop: 4 },
  netCard: { borderRadius: 14, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  netAmt: { fontSize: responsiveFontSize(22), fontWeight: '800', marginTop: 4 },
  savingsPill: { backgroundColor: COLORS.accent, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6 },
  savingsPillText: { color: '#1A1A1A', fontWeight: '800', fontSize: responsiveFontSize(12) },
  insightCard: { backgroundColor: '#1A1A1A', borderRadius: 16, padding: 16, marginBottom: 14 },
  insightHead: { color: '#fff', fontSize: responsiveFontSize(14), fontWeight: '800', marginBottom: 10 },
  insightRow: { flexDirection: 'row', gap: 8, marginBottom: 6 },
  insightDot: { color: COLORS.accent, fontWeight: '800' },
  insightText: { flex: 1, color: 'rgba(255,255,255,0.9)', fontSize: responsiveFontSize(12), fontWeight: '500', lineHeight: 18 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 14, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardTitle: { fontSize: responsiveFontSize(15), fontWeight: '700', color: COLORS.text, marginBottom: 14 },
  legendRow: { flexDirection: 'row', gap: 16, marginBottom: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendText: { fontSize: responsiveFontSize(11), color: COLORS.textLight, fontWeight: '600' },
  dot: { width: 10, height: 10, borderRadius: 5 },
  barChart: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 130 },
  barCol: { flex: 1, alignItems: 'center' },
  barPair: { flexDirection: 'row', gap: 3, alignItems: 'flex-end', height: 104 },
  bar: { width: 10, borderTopLeftRadius: 3, borderTopRightRadius: 3 },
  barLabel: { fontSize: 9, color: COLORS.textLight, fontWeight: '600', marginTop: 6 },
  donutRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  legend: { flex: 1, gap: 10 },
  legendLabel: { flex: 1, fontSize: responsiveFontSize(12), color: COLORS.textMed, fontWeight: '500' },
  legendVal: { fontSize: responsiveFontSize(12), color: COLORS.text, fontWeight: '700' },
  catRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  catEmoji: { fontSize: 20 },
  catTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  catName: { fontSize: responsiveFontSize(13), fontWeight: '600', color: COLORS.text },
  catAmt: { fontSize: responsiveFontSize(12), fontWeight: '700', color: COLORS.text },
  catBarBg: { height: 8, backgroundColor: '#F5F5F0', borderRadius: 4, overflow: 'hidden' },
  catBarFill: { height: 8, borderRadius: 4 },
  empty: { textAlign: 'center', color: COLORS.textLight, fontWeight: '600', paddingVertical: 20 },
  shareBtn: { backgroundColor: '#1A1A1A', borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 4 },
  shareBtnText: { color: '#fff', fontWeight: '700', fontSize: responsiveFontSize(14) },
});
