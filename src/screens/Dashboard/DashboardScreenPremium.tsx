import React, { useMemo, useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Dimensions, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { format } from 'date-fns';
import { useStore } from '../../store/useStore';
import { COLORS, GRADIENTS, CATEGORY_EMOJI, TYPE_LABELS } from '../../constants';
import { responsiveFontSize } from '../../utils/responsive';
import { formatMoney, formatPKRCompact } from '../../utils/currency';
import { getActiveFiscalMonth, getResetCountdown } from '../../utils/fiscalMonth';
import { fundsSummary } from '../../utils/funds';
import { poolsSummary } from '../../utils/pools';
import { getSpendingTrends, compareSpending } from '../../utils/trends';
import { calculateSavingsPotential, getSpendingVelocity, dailySpendRate, daysRemainingInMonth } from '../../utils/forecast';
import { analyzeSpendingPatterns, getVelocityInsight } from '../../utils/spendingPatterns';

const W = Dimensions.get('window').width;

export default function DashboardScreenPremium() {
  const { expenses = [], incomes = [], currentUser, budgets = [], approveExpense, approveIncome, budgetPools = [], advances = [], advanceBalanceEntries = [], recurrenceRules = [] } = useStore();
  const navigation = useNavigation<any>();

  const now = new Date();
  const fiscal = getActiveFiscalMonth(now);
  const { month, year } = fiscal;

  // Core metrics
  const fiscalExpenses = useMemo(
    () => {
      if (!Array.isArray(expenses)) return [];
      return expenses.filter(e => {
        if (!e?.date) return false;
        const d = new Date(e.date);
        return d.getMonth() + 1 === month && d.getFullYear() === year && e?.status !== 'rejected' && e?.status !== 'pending';
      });
    },
    [expenses, month, year]
  );

  const totalSpent = useMemo(() => (fiscalExpenses || []).reduce((s, e) => s + (e?.amount || 0), 0), [fiscalExpenses]);
  const totalIncome = useMemo(
    () => {
      if (!Array.isArray(incomes)) return 0;
      return incomes.filter((i: any) => i?.month === month && i?.year === year && i?.status !== 'pending' && i?.status !== 'rejected').reduce((s: number, i: any) => s + (i?.amount || 0), 0);
    },
    [incomes, month, year]
  );

  const balance = (totalIncome || 0) - (totalSpent || 0);
  const savingsRate = (totalIncome || 0) > 0 ? Math.round(((balance || 0) / (totalIncome || 0)) * 100) : 0;
  const expenseRate = (totalIncome || 0) > 0 ? Math.round(((totalSpent || 0) / (totalIncome || 0)) * 100) : 0;

  // Advanced insights
  const funds = useMemo(() => fundsSummary(incomes || [], expenses || [], advances || []), [incomes, expenses, advances]);
  const currentPools = useMemo(() => {
    if (!Array.isArray(budgetPools)) return [];
    return budgetPools.filter(p => p?.month === month && p?.year === year);
  }, [budgetPools, month, year]);
  const poolData = useMemo(() => poolsSummary(currentPools, expenses || []), [currentPools, expenses]);

  const smartAnalysis = useMemo(() => analyzeSpendingPatterns(expenses || []), [expenses]);
  const velocityInsight = useMemo(() => {
    if (!smartAnalysis?.patterns || !smartAnalysis?.predictions) return null;
    return getVelocityInsight(smartAnalysis.patterns, smartAnalysis.predictions);
  }, [smartAnalysis]);

  const insights = useMemo(() => ({
    savings: calculateSavingsPotential(expenses || []),
    velocity: getSpendingVelocity(expenses || []),
  }), [expenses]);

  const trends = useMemo(() => getSpendingTrends(expenses || [], 3), [expenses]);
  const comparison = useMemo(() => compareSpending(expenses || []), [expenses]);

  const dailyRate = useMemo(() => dailySpendRate(expenses || []), [expenses]);
  const daysLeft = useMemo(() => daysRemainingInMonth(), []);

  // Health score (0-100): based on savings rate
  const healthScore = Math.min(100, Math.max(0, savingsRate + 50));

  // Pending approvals
  const pendingApprovals = useMemo(
    () => expenses.filter(e => e.status === 'pending').length,
    [expenses]
  );

  // Due recurring expenses (next 7 days)
  const dueRecurring = useMemo(
    () => recurrenceRules.filter(r => {
      if (!r.active) return false;
      const daysUntil = Math.ceil((new Date(r.nextDueDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntil >= 0 && daysUntil <= 7;
    }),
    [recurrenceRules, now]
  );

  // Expense breakdown by type
  const breakdown = useMemo(() => {
    const personal = fiscalExpenses.filter(e => e.type === 'personal').reduce((s, e) => s + e.amount, 0);
    const office = fiscalExpenses.filter(e => e.type === 'office').reduce((s, e) => s + e.amount, 0);
    const farm = fiscalExpenses.filter(e => e.type === 'farm').reduce((s, e) => s + e.amount, 0);
    return { personal, office, farm };
  }, [fiscalExpenses]);

  // Recent transactions
  const recent = useMemo(
    () => [...fiscalExpenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5),
    [fiscalExpenses]
  );

  // Category breakdown - top 5
  const topCategories = useMemo(() => {
    const byCategory: Record<string, number> = {};
    fiscalExpenses.forEach(e => {
      byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
    });
    return Object.entries(byCategory).sort(([, a], [, b]) => b - a).slice(0, 5);
  }, [fiscalExpenses]);

  const handleApproval = async (expenseId: string) => {
    await approveExpense(expenseId, 'approved');
    Alert.alert('Approved', 'Expense approved successfully');
  };

  return (
    <View style={styles.container}>
      {/* HEADER - Extended to top */}
      <LinearGradient colors={GRADIENTS.header as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.headerGradient}>
        <SafeAreaView style={styles.headerSafeArea}>
          <View style={styles.headerContent}>
            <View style={styles.headerTop}>
              <View>
                <Text style={styles.greeting}>👋 {currentUser?.name}</Text>
                <Text style={styles.headerSubtitle}>{format(now, 'MMMM yyyy')}</Text>
              </View>
              <View style={styles.healthScore}>
                <View style={[styles.healthCircle, { backgroundColor: healthScore > 70 ? '#4ADE80' : healthScore > 50 ? '#FCD34D' : '#F87171' }]}>
                  <Text style={styles.healthText}>{healthScore}</Text>
                </View>
                <Text style={styles.healthLabel}>Health</Text>
              </View>
            </View>

            {/* Main Balance Card */}
            <View style={styles.balanceCard}>
              <Text style={styles.balanceLabel}>💰 Main Balance</Text>
              <Text style={styles.balanceAmount}>{formatMoney(funds.mainBalance)}</Text>
              <Text style={styles.balanceStatus}>{funds.mainBalance >= 0 ? '✓ Positive' : '⚠️ Deficit'}</Text>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* Content Area */}
      <SafeAreaView style={styles.safe}>
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* KEY METRICS - Income, Expense, Savings */}
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>📈 Income</Text>
            <Text style={styles.metricValue}>{formatPKRCompact(totalIncome)}</Text>
            <View style={styles.metricBar}>
              <View style={[styles.metricFill, { width: '100%', backgroundColor: '#4ADE80' }]} />
            </View>
            <Text style={styles.metricPercent}>100%</Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>💸 Expense</Text>
            <Text style={styles.metricValue}>{formatPKRCompact(totalSpent)}</Text>
            <View style={styles.metricBar}>
              <View style={[styles.metricFill, { width: `${Math.min(100, expenseRate)}%`, backgroundColor: '#F87171' }]} />
            </View>
            <Text style={styles.metricPercent}>{expenseRate}%</Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>💾 Savings</Text>
            <Text style={styles.metricValue}>{formatPKRCompact(balance)}</Text>
            <View style={styles.metricBar}>
              <View style={[styles.metricFill, { width: `${Math.max(0, savingsRate + 50)}%`, backgroundColor: '#60A5FA' }]} />
            </View>
            <Text style={styles.metricPercent}>{savingsRate}%</Text>
          </View>
        </View>

        {/* ADVANCES OVERVIEW */}
        {advanceBalanceEntries && advanceBalanceEntries.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💰 Advances</Text>
            <View style={styles.advancesGrid}>
              {advanceBalanceEntries.slice(0, 4).map((adv) => {
                const isGiver = adv?.giverEmail === currentUser?.email;
                const otherPerson = isGiver ? adv?.receiverName : adv?.giverName;
                const settlementPercent = adv?.amount > 0 ? Math.round(((adv?.returnedAmount || 0) / adv?.amount) * 100) : 0;
                return (
                  <View key={adv?.id} style={styles.advanceQuickCard}>
                    <View style={styles.advanceQuickHeader}>
                      <Text style={styles.advanceQuickEmoji}>{isGiver ? '📤' : '📥'}</Text>
                      <Text style={styles.advanceQuickLabel}>{isGiver ? 'To' : 'From'}</Text>
                    </View>
                    <Text style={styles.advanceQuickName} numberOfLines={1}>{otherPerson}</Text>
                    <Text style={styles.advanceQuickAmount}>{formatMoney(adv?.amount || 0)}</Text>
                    <View style={styles.advanceQuickProgressBar}>
                      <View style={[styles.advanceQuickProgressFill, { width: `${settlementPercent}%` }]} />
                    </View>
                    <Text style={styles.advanceQuickStatus}>{settlementPercent}% {adv?.status === 'settled' ? '✓' : '◊'}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* SPENDING BREAKDOWN by Type */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Spending by Type</Text>
          <View style={styles.typeBreakdown}>
            <View style={styles.typeItem}>
              <View style={styles.typeBar}>
                <View style={[styles.typeFill, { width: `${breakdown.personal > 0 ? (breakdown.personal / totalSpent) * 100 : 0}%`, backgroundColor: '#1A1A1A' }]} />
              </View>
              <View style={styles.typeLabel}>
                <Text style={styles.typeName}>Personal</Text>
                <Text style={styles.typeValue}>{formatPKRCompact(breakdown.personal)} ({totalSpent > 0 ? Math.round((breakdown.personal / totalSpent) * 100) : 0}%)</Text>
              </View>
            </View>

            <View style={styles.typeItem}>
              <View style={styles.typeBar}>
                <View style={[styles.typeFill, { width: `${breakdown.office > 0 ? (breakdown.office / totalSpent) * 100 : 0}%`, backgroundColor: '#F5B700' }]} />
              </View>
              <View style={styles.typeLabel}>
                <Text style={styles.typeName}>Office</Text>
                <Text style={styles.typeValue}>{formatPKRCompact(breakdown.office)} ({totalSpent > 0 ? Math.round((breakdown.office / totalSpent) * 100) : 0}%)</Text>
              </View>
            </View>

            <View style={styles.typeItem}>
              <View style={styles.typeBar}>
                <View style={[styles.typeFill, { width: `${breakdown.farm > 0 ? (breakdown.farm / totalSpent) * 100 : 0}%`, backgroundColor: '#D99E00' }]} />
              </View>
              <View style={styles.typeLabel}>
                <Text style={styles.typeName}>Farm</Text>
                <Text style={styles.typeValue}>{formatPKRCompact(breakdown.farm)} ({totalSpent > 0 ? Math.round((breakdown.farm / totalSpent) * 100) : 0}%)</Text>
              </View>
            </View>
          </View>
        </View>

        {/* INTELLIGENT SPENDING ANALYSIS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🤖 AI Spending Analysis</Text>

          {/* Velocity Insight */}
          <View style={[styles.card, {
            backgroundColor: velocityInsight.trend === 'accelerating' ? '#FFE5E5' : velocityInsight.trend === 'decreasing' ? '#ECFDF5' : '#E5F5FF',
            marginBottom: 10
          }]}>
            <View style={styles.velocityHeader}>
              <Text style={[styles.velocityLabel, {
                color: velocityInsight.trend === 'accelerating' ? '#991B1B' : velocityInsight.trend === 'decreasing' ? '#166534' : '#0066CC'
              }]}>
                {velocityInsight.trend === 'accelerating' ? '📈 Accelerating' : velocityInsight.trend === 'decreasing' ? '📉 Decreasing' : '➡️ Stable'}
              </Text>
            </View>
            <Text style={[styles.velocityText, {
              color: velocityInsight.trend === 'accelerating' ? '#991B1B' : velocityInsight.trend === 'decreasing' ? '#166534' : '#0066CC'
            }]}>
              {velocityInsight.impact}
            </Text>
            <Text style={[styles.actionText, { marginTop: 8 }]}>{velocityInsight.action}</Text>
          </View>

          {/* Upcoming Predictions */}
          {smartAnalysis.predictions.length > 0 && (
            <View style={[styles.card, { marginBottom: 10 }]}>
              <Text style={styles.cardLabel}>🔮 Predicted Expenses (Next 7 Days)</Text>
              {smartAnalysis.predictions.filter(p => p.daysUntil <= 7).map((pred, idx) => (
                <View key={idx} style={[styles.predictionRow, idx > 0 && { borderTopWidth: 1, borderTopColor: '#E5E5E5', paddingTop: 10, marginTop: 10 }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.predictionCategory}>{pred.category}</Text>
                    <Text style={styles.predictionMeta}>{pred.reason}</Text>
                  </View>
                  <View style={styles.predictionRight}>
                    <Text style={styles.predictionAmount}>{formatMoney(pred.predictedAmount)}</Text>
                    <Text style={styles.predictionDays}>{pred.daysUntil === 0 ? 'Today' : `In ${pred.daysUntil}d`}</Text>
                    <Text style={styles.predictionConfidence}>{Math.round(pred.confidence * 100)}% sure</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Recommendation */}
          <View style={[styles.card, { backgroundColor: '#FFFAED', borderLeftWidth: 4, borderLeftColor: '#F59E0B' }]}>
            <Text style={styles.cardLabel}>💡 Smart Recommendation</Text>
            <Text style={styles.recommendationText}>{smartAnalysis.recommendation}</Text>
            {smartAnalysis.savingsPotential && smartAnalysis.savingsPotential !== 'Insufficient data' && (
              <Text style={styles.savingsPotentialText}>💰 {smartAnalysis.savingsPotential}</Text>
            )}
          </View>

          {/* Risk Warning */}
          {smartAnalysis.riskWarning && (
            <View style={[styles.card, { backgroundColor: '#FFE5E5', borderLeftWidth: 4, borderLeftColor: '#DC2626', marginTop: 10 }]}>
              <Text style={styles.riskText}>{smartAnalysis.riskWarning}</Text>
            </View>
          )}
        </View>

        {/* SAVINGS OPPORTUNITY */}
        {insights.savings.potentialSavings > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💡 Savings Opportunity</Text>
            <View style={[styles.card, { backgroundColor: '#ECFDF5', borderLeftWidth: 4, borderLeftColor: '#4ADE80' }]}>
              <Text style={styles.savingsTitle}>Save {formatMoney(insights.savings.potentialSavings)}</Text>
              <Text style={styles.savingsSubtitle}>by matching your historical average</Text>
              <View style={styles.savingsRow}>
                <View style={styles.savingsStat}>
                  <Text style={styles.savingsLabel}>On Track</Text>
                  <Text style={styles.savingsValue}>{formatPKRCompact(insights.savings.currentOnTrack)}</Text>
                </View>
                <View style={styles.savingsStat}>
                  <Text style={styles.savingsLabel}>Average</Text>
                  <Text style={styles.savingsValue}>{formatPKRCompact(insights.savings.historicalAverage)}</Text>
                </View>
                <View style={styles.savingsStat}>
                  <Text style={styles.savingsLabel}>Gap</Text>
                  <Text style={styles.savingsValue}>{formatPKRCompact(insights.savings.potentialSavings)}</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* MONTHLY COMPARISON */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Month Comparison</Text>
          <View style={styles.compGrid}>
            <View style={styles.compCard}>
              <Text style={styles.compLabel}>This Month</Text>
              <Text style={styles.compValue}>{formatPKRCompact(comparison.thisMonth)}</Text>
            </View>
            <View style={styles.compCard}>
              <Text style={styles.compLabel}>Last Month</Text>
              <Text style={styles.compValue}>{formatPKRCompact(comparison.lastMonth)}</Text>
            </View>
          </View>
          <View style={[styles.card, { backgroundColor: comparison.percentChange > 0 ? '#FFE5E5' : '#ECFDF5', marginTop: 10 }]}>
            <Text style={[styles.compTrend, { color: comparison.percentChange > 0 ? '#991B1B' : '#166534' }]}>
              {comparison.percentChange > 0 ? '📈' : '📉'} {Math.abs(Math.round(comparison.percentChange))}% {comparison.percentChange > 0 ? 'higher' : 'lower'} than last month
            </Text>
          </View>
        </View>

        {/* BUDGET POOLS ALERT */}
        {poolData.alertedPools > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📦 Budget Pools Alert</Text>
            <TouchableOpacity style={[styles.card, { backgroundColor: '#FFE5E5', borderLeftWidth: 4, borderLeftColor: '#DC2626' }]} onPress={() => navigation.navigate('Pools')}>
              <Text style={styles.alertTitle}>⚠️ {poolData.alertedPools} pool{poolData.alertedPools !== 1 ? 's' : ''} at alert threshold</Text>
              <Text style={styles.alertSubtitle}>Tap to manage</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* TOP SPENDING CATEGORIES */}
        {topCategories.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🏆 Top 5 Categories</Text>
            {topCategories.map(([cat, amount], idx) => (
              <View key={idx} style={styles.categoryRow}>
                <Text style={styles.categoryEmoji}>{CATEGORY_EMOJI[cat] || '💰'}</Text>
                <View style={styles.categoryBar}>
                  <View style={styles.categoryBarLabel}>
                    <Text style={styles.categoryName}>{cat}</Text>
                    <Text style={styles.categoryAmount}>{formatPKRCompact(amount)}</Text>
                  </View>
                  <View style={styles.categoryBarBg}>
                    <View style={[styles.categoryBarFill, { width: `${(amount / totalSpent) * 100}%` }]} />
                  </View>
                  <Text style={styles.categoryPercent}>{Math.round((amount / totalSpent) * 100)}%</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* RECURRING EXPENSES DUE */}
        {dueRecurring.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔄 Due Recurring Expenses</Text>
            {dueRecurring.map(r => (
              <View key={r.id} style={[styles.card, { marginBottom: 10 }]}>
                <View style={styles.recurRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.recurName}>{r.expenseTemplate.category}</Text>
                    <Text style={styles.recurFreq}>{r.frequency}</Text>
                  </View>
                  <Text style={styles.recurAmount}>{formatMoney(r.expenseTemplate.amount)}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* PENDING APPROVALS */}
        {pendingApprovals > 0 && currentUser?.role === 'admin' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⏳ Pending Approvals ({pendingApprovals})</Text>
            {expenses.filter(e => e.status === 'pending').slice(0, 3).map(e => (
              <View key={e.id} style={[styles.card, { marginBottom: 10 }]}>
                <View style={styles.approvalRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.approvalCat}>{CATEGORY_EMOJI[e.category] || '💰'} {e.category}</Text>
                    <Text style={styles.approvalMeta}>{e.type} • {format(new Date(e.date), 'MMM dd')}</Text>
                  </View>
                  <Text style={styles.approvalAmount}>{formatMoney(e.amount)}</Text>
                  <TouchableOpacity style={styles.approveBtn} onPress={() => handleApproval(e.id)}>
                    <Text style={styles.approveBtnText}>✓</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* RECENT TRANSACTIONS */}
        {recent.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📜 Recent Transactions</Text>
            {recent.slice(0, 5).map(e => (
              <View key={e.id} style={styles.txRow}>
                <Text style={styles.txEmoji}>{CATEGORY_EMOJI[e.category] || '💰'}</Text>
                <View style={styles.txInfo}>
                  <Text style={styles.txCat}>{e.category}</Text>
                  <Text style={styles.txMeta}>{format(new Date(e.date), 'MMM dd')} • {e.type}</Text>
                </View>
                <Text style={styles.txAmount}>{formatMoney(e.amount)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* QUICK ACTIONS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚡ Quick Actions</Text>
          <View style={styles.actionGrid}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('AddExpense')}>
              <Text style={styles.actionEmoji}>💸</Text>
              <Text style={styles.actionLabel}>Add Expense</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Earnings')}>
              <Text style={styles.actionEmoji}>📈</Text>
              <Text style={styles.actionLabel}>Add Income</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Funds')}>
              <Text style={styles.actionEmoji}>🤝</Text>
              <Text style={styles.actionLabel}>Advances</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Trends')}>
              <Text style={styles.actionEmoji}>📊</Text>
              <Text style={styles.actionLabel}>Trends</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAF7' },
  safe: { flex: 1, backgroundColor: '#FAFAF7' },
  scroll: { flex: 1 },
  headerGradient: { width: '100%' },
  headerSafeArea: { paddingHorizontal: 16 },
  headerContent: { paddingBottom: 24 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  greeting: { fontSize: responsiveFontSize(20), fontWeight: '800', color: '#1A1A1A' },
  headerSubtitle: { fontSize: responsiveFontSize(12), color: 'rgba(26,26,26,0.6)', marginTop: 2, fontWeight: '600' },
  healthScore: { alignItems: 'center' },
  healthCircle: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  healthText: { fontSize: responsiveFontSize(18), fontWeight: '800', color: '#fff' },
  healthLabel: { fontSize: responsiveFontSize(10), fontWeight: '700', color: '#1A1A1A' },
  balanceCard: { backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 16, padding: 16 },
  balanceLabel: { fontSize: responsiveFontSize(12), color: 'rgba(26,26,26,0.6)', fontWeight: '700' },
  balanceAmount: { fontSize: responsiveFontSize(32), fontWeight: '800', color: '#1A1A1A', marginTop: 8 },
  balanceStatus: { fontSize: responsiveFontSize(12), color: '#4ADE80', fontWeight: '700', marginTop: 8 },
  metricsGrid: { flexDirection: 'row', paddingHorizontal: 16, marginVertical: 16, gap: 10 },
  metricCard: { flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 12, alignItems: 'center' },
  metricLabel: { fontSize: responsiveFontSize(11), color: '#52525B', fontWeight: '700' },
  metricValue: { fontSize: responsiveFontSize(16), fontWeight: '800', color: '#1A1A1A', marginTop: 6 },
  metricBar: { width: '100%', height: 4, backgroundColor: '#ECECE6', borderRadius: 2, marginTop: 6, overflow: 'hidden' },
  metricFill: { height: '100%' },
  metricPercent: { fontSize: responsiveFontSize(10), color: '#9C9C95', fontWeight: '700', marginTop: 6 },
  section: { paddingHorizontal: 16, marginBottom: 20 },
  sectionTitle: { fontSize: responsiveFontSize(15), fontWeight: '800', color: '#1A1A1A', marginBottom: 12 },
  advancesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  advanceQuickCard: { flex: 1, minWidth: '48%', backgroundColor: '#fff', borderRadius: 12, padding: 12, alignItems: 'center' },
  advanceQuickHeader: { flexDirection: 'row', gap: 6, alignItems: 'center', marginBottom: 6 },
  advanceQuickEmoji: { fontSize: 20 },
  advanceQuickLabel: { fontSize: responsiveFontSize(10), fontWeight: '700', color: '#52525B' },
  advanceQuickName: { fontSize: responsiveFontSize(11), fontWeight: '700', color: '#1A1A1A', marginBottom: 4, textAlign: 'center' },
  advanceQuickAmount: { fontSize: responsiveFontSize(13), fontWeight: '800', color: '#1A1A1A', marginBottom: 6 },
  advanceQuickProgressBar: { width: '100%', height: 6, backgroundColor: '#ECECE6', borderRadius: 3, overflow: 'hidden', marginBottom: 4 },
  advanceQuickProgressFill: { height: '100%', backgroundColor: '#10B981' },
  advanceQuickStatus: { fontSize: responsiveFontSize(10), fontWeight: '700', color: '#52525B' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 12 },
  typeBreakdown: { gap: 10 },
  typeItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  typeBar: { flex: 1, height: 24, backgroundColor: '#ECECE6', borderRadius: 6, overflow: 'hidden' },
  typeFill: { height: '100%' },
  typeLabel: { width: 120 },
  typeName: { fontSize: responsiveFontSize(11), fontWeight: '700', color: '#1A1A1A' },
  typeValue: { fontSize: responsiveFontSize(10), color: '#9C9C95', fontWeight: '600', marginTop: 2 },
  velocityHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  velocityLabel: { fontSize: responsiveFontSize(13), fontWeight: '700' },
  velocityPercent: { fontSize: responsiveFontSize(16), fontWeight: '800' },
  velocityText: { fontSize: responsiveFontSize(11), fontWeight: '600', marginTop: 4 },
  forecastRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  forecastCol: { alignItems: 'center' },
  forecastLabel: { fontSize: responsiveFontSize(10), color: '#52525B', fontWeight: '700' },
  forecastValue: { fontSize: responsiveFontSize(14), fontWeight: '800', color: '#1A1A1A', marginTop: 4 },
  cardLabel: { fontSize: responsiveFontSize(12), fontWeight: '700', color: '#1A1A1A', marginBottom: 10 },
  savingsTitle: { fontSize: responsiveFontSize(14), fontWeight: '800', color: '#166534' },
  savingsSubtitle: { fontSize: responsiveFontSize(11), color: '#4B5563', fontWeight: '600', marginTop: 2 },
  savingsRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 12 },
  savingsStat: { alignItems: 'center' },
  savingsLabel: { fontSize: responsiveFontSize(10), color: '#52525B', fontWeight: '700' },
  savingsValue: { fontSize: responsiveFontSize(14), fontWeight: '800', color: '#166534', marginTop: 4 },
  compGrid: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  compCard: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 12, alignItems: 'center' },
  compLabel: { fontSize: responsiveFontSize(11), color: '#52525B', fontWeight: '700' },
  compValue: { fontSize: responsiveFontSize(16), fontWeight: '800', color: '#1A1A1A', marginTop: 6 },
  compTrend: { fontSize: responsiveFontSize(12), fontWeight: '700' },
  alertTitle: { fontSize: responsiveFontSize(12), fontWeight: '800', color: '#7F1D1D' },
  alertSubtitle: { fontSize: responsiveFontSize(10), color: '#7F1D1D', fontWeight: '600', marginTop: 4 },
  categoryRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  categoryEmoji: { fontSize: 18 },
  categoryBar: { flex: 1 },
  categoryBarLabel: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  categoryName: { fontSize: responsiveFontSize(11), fontWeight: '700', color: '#1A1A1A' },
  categoryAmount: { fontSize: responsiveFontSize(11), fontWeight: '700', color: '#52525B' },
  categoryBarBg: { height: 6, backgroundColor: '#ECECE6', borderRadius: 3, overflow: 'hidden' },
  categoryBarFill: { height: '100%', backgroundColor: '#1A1A1A' },
  categoryPercent: { fontSize: responsiveFontSize(10), color: '#9C9C95', fontWeight: '700', marginTop: 4 },
  recurRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  recurName: { fontSize: responsiveFontSize(12), fontWeight: '700', color: '#1A1A1A' },
  recurFreq: { fontSize: responsiveFontSize(10), color: '#9C9C95', fontWeight: '600', marginTop: 2 },
  recurAmount: { fontSize: responsiveFontSize(13), fontWeight: '800', color: '#1A1A1A' },
  approvalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  approvalCat: { fontSize: responsiveFontSize(12), fontWeight: '700', color: '#1A1A1A' },
  approvalMeta: { fontSize: responsiveFontSize(10), color: '#9C9C95', fontWeight: '600', marginTop: 2 },
  approvalAmount: { fontSize: responsiveFontSize(13), fontWeight: '800', color: '#1A1A1A' },
  approveBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#4ADE80', alignItems: 'center', justifyContent: 'center' },
  approveBtnText: { color: '#fff', fontWeight: '800', fontSize: responsiveFontSize(16) },
  txRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 10 },
  txEmoji: { fontSize: 18, marginRight: 10 },
  txInfo: { flex: 1 },
  txCat: { fontSize: responsiveFontSize(12), fontWeight: '700', color: '#1A1A1A' },
  txMeta: { fontSize: responsiveFontSize(10), color: '#9C9C95', fontWeight: '600', marginTop: 2 },
  txAmount: { fontSize: responsiveFontSize(13), fontWeight: '800', color: '#1A1A1A' },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionBtn: { width: '48%', backgroundColor: '#fff', borderRadius: 12, padding: 16, alignItems: 'center' },
  actionEmoji: { fontSize: 32, marginBottom: 8 },
  actionLabel: { fontSize: responsiveFontSize(12), fontWeight: '700', color: '#1A1A1A', textAlign: 'center' },
  predictionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  predictionCategory: { fontSize: responsiveFontSize(12), fontWeight: '700', color: '#1A1A1A' },
  predictionMeta: { fontSize: responsiveFontSize(10), color: '#9C9C95', fontWeight: '600', marginTop: 2 },
  predictionRight: { alignItems: 'flex-end' },
  predictionAmount: { fontSize: responsiveFontSize(13), fontWeight: '800', color: '#1A1A1A' },
  predictionDays: { fontSize: responsiveFontSize(10), color: '#52525B', fontWeight: '700', marginTop: 2 },
  predictionConfidence: { fontSize: responsiveFontSize(9), color: '#9C9C95', fontWeight: '600', marginTop: 1 },
  recommendationText: { fontSize: responsiveFontSize(12), color: '#1A1A1A', fontWeight: '600', marginTop: 6 },
  savingsPotentialText: { fontSize: responsiveFontSize(11), color: '#92400E', fontWeight: '700', marginTop: 8 },
  actionText: { fontSize: responsiveFontSize(11), color: '#52525B', fontWeight: '600' },
  riskText: { fontSize: responsiveFontSize(12), color: '#7F1D1D', fontWeight: '700' },
});
