import React, { useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet, 
  TouchableOpacity, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { format, startOfMonth, differenceInDays } from 'date-fns';
import { useStore } from '../../store/useStore';
import { COLORS, TYPE_LABELS, TYPE_COLORS, USERS } from '../../constants';
import StatCard from '../../components/common/StatCard';
import BudgetBar from '../../components/common/BudgetBar';
import { getDashboardStats, getSmartInsights, getMonthlyComparisons } from '../../utils/analytics';

export default function DashboardScreen() {
  const { expenses, budgets, currentUser, activityLogs } = useStore();
  const navigation = useNavigation<any>();
  const [refreshing, setRefreshing] = React.useState(false);

  const stats = useMemo(() => getDashboardStats(expenses), [expenses]);
  const insights = useMemo(() => getSmartInsights(expenses), [expenses]);

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const monthBudgets = useMemo(() =>
    budgets.filter(b => b.month === currentMonth && b.year === currentYear),
    [budgets, currentMonth, currentYear]
  );

  // User activity alerts
  const alerts = useMemo(() => {
    const msgs: string[] = [];
    const todayStr = format(now, 'yyyy-MM-dd');
    USERS.forEach(u => {
      const userExp = expenses.filter(e => e.enteredBy === u.id);
      const todayExp = userExp.filter(e => e.date.startsWith(todayStr));
      if (todayExp.length === 0) msgs.push(`${u.name} has not added any expense today`);
      const lastEntry = userExp.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
      if (lastEntry) {
        const daysSince = differenceInDays(now, new Date(lastEntry.date));
        if (daysSince >= 3) msgs.push(`${u.name} inactive for ${daysSince} days`);
      }
    });
    return msgs;
  }, [expenses]);

  // Budget alerts
  const budgetAlerts = useMemo(() => {
    const msgs: string[] = [];
    monthBudgets.forEach(b => {
      const spent = stats.byType[b.type];
      const pct = (spent / b.limit) * 100;
      if (pct >= 100) msgs.push(`⚠️ ${TYPE_LABELS[b.type]} budget exceeded!`);
      else if (pct >= 80) msgs.push(`🔔 ${TYPE_LABELS[b.type]} budget at ${pct.toFixed(0)}%`);
      else if (pct >= 50) msgs.push(`📊 ${TYPE_LABELS[b.type]} budget at 50%`);
    });
    return msgs;
  }, [monthBudgets, stats]);

  const pendingCount = expenses.filter(e => e.status === 'pending').length;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => setRefreshing(false)} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello, {currentUser?.name} 👋</Text>
            <Text style={styles.date}>{format(now, 'EEEE, dd MMMM yyyy')}</Text>
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('AddExpense')}>
            <Text style={styles.addBtnText}>+ Add</Text>
          </TouchableOpacity>
        </View>

        {/* Alerts */}
        {[...alerts, ...budgetAlerts].length > 0 && (
          <View style={styles.alertsContainer}>
            {[...alerts, ...budgetAlerts].map((a, i) => (
              <View key={i} style={styles.alert}>
                <Text style={styles.alertText}>⚡ {a}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Pending Approvals */}
        {currentUser?.role === 'admin' && pendingCount > 0 && (
          <TouchableOpacity style={styles.pendingBanner} onPress={() => navigation.navigate('Expenses', { filter: 'pending' })}>
            <Text style={styles.pendingText}>🔔 {pendingCount} expense(s) pending approval → Review</Text>
          </TouchableOpacity>
        )}

        {/* Summary Cards */}
        <Text style={styles.sectionTitle}>Summary</Text>
        <StatCard label="Today" value={`Rs. ${stats.today.toLocaleString()}`} icon="📅" color={COLORS.primary} />
        <StatCard label="This Week" value={`Rs. ${stats.weekly.toLocaleString()}`} icon="📆" color={COLORS.secondary} />
        <StatCard label="This Month" value={`Rs. ${stats.monthly.toLocaleString()}`} icon="🗓️" color={COLORS.success} change={stats.monthVsLast.change} />
        <StatCard label="This Year" value={`Rs. ${stats.yearly.toLocaleString()}`} icon="📊" color={COLORS.warning} />

        {/* Type Breakdown */}
        <Text style={styles.sectionTitle}>This Month by Category</Text>
        <View style={styles.typeRow}>
          {(['personal', 'office', 'farm'] as const).map(t => (
            <View key={t} style={[styles.typeCard, { borderTopColor: TYPE_COLORS[t] }]}>
              <Text style={styles.typeLabel}>{TYPE_LABELS[t]}</Text>
              <Text style={[styles.typeAmount, { color: TYPE_COLORS[t] }]}>
                Rs. {stats.byType[t].toLocaleString()}
              </Text>
            </View>
          ))}
        </View>

        {/* Balance Insight */}
        <Text style={styles.sectionTitle}>Balance Insights</Text>
        <View style={styles.insightCard}>
          <View style={styles.insightRow}>
            <Text style={styles.insightLabel}>Avg Daily Spend</Text>
            <Text style={styles.insightValue}>Rs. {stats.avgDaily.toFixed(0)}</Text>
          </View>
          <View style={styles.insightRow}>
            <Text style={styles.insightLabel}>Top Category</Text>
            <Text style={styles.insightValue}>{insights.highestCat}</Text>
          </View>
          <View style={styles.insightRow}>
            <Text style={styles.insightLabel}>Spending Trend</Text>
            <Text style={[styles.insightValue, { color: insights.trend === 'increasing' ? COLORS.danger : COLORS.success }]}>
              {insights.trend === 'increasing' ? '▲ Rising' : '▼ Falling'}
            </Text>
          </View>
          <View style={styles.insightRow}>
            <Text style={styles.insightLabel}>Avg Monthly</Text>
            <Text style={styles.insightValue}>Rs. {insights.avgMonthly.toFixed(0)}</Text>
          </View>
          <View style={[styles.insightRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.insightLabel}>Most Active</Text>
            <Text style={styles.insightValue}>{insights.mostActive === 'arsalan' ? 'Arsalan' : 'Rehan'}</Text>
          </View>
        </View>

        {/* Budgets */}
        {monthBudgets.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Budget Tracker</Text>
            <View style={styles.insightCard}>
              {(['personal', 'office', 'farm'] as const).map(t => (
                <BudgetBar
                  key={t}
                  type={t}
                  budget={monthBudgets.find(b => b.type === t)}
                  spent={stats.byType[t]}
                />
              ))}
            </View>
          </>
        )}

        {/* User Activity */}
        <Text style={styles.sectionTitle}>User Activity</Text>
        <View style={styles.insightCard}>
          {USERS.map(u => {
            const userExp = expenses.filter(e => e.enteredBy === u.id);
            const monthExp = userExp.filter(e => e.date.startsWith(format(now, 'yyyy-MM')));
            const last = userExp.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
            return (
              <View key={u.id} style={[styles.insightRow, u.id === USERS[USERS.length - 1].id && { borderBottomWidth: 0 }]}>
                <View>
                  <Text style={styles.insightLabel}>{u.name}</Text>
                  <Text style={styles.subLabel}>{monthExp.length} entries this month</Text>
                  <Text style={styles.subLabel}>Last: {last ? format(new Date(last.createdAt), 'dd MMM') : 'Never'}</Text>
                </View>
                <View style={[styles.roleBadge, { backgroundColor: u.role === 'admin' ? COLORS.primary + '20' : COLORS.secondary + '20' }]}>
                  <Text style={[styles.roleText, { color: u.role === 'admin' ? COLORS.primary : COLORS.secondary }]}>
                    {u.role}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1, paddingHorizontal: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, paddingBottom: 12 },
  greeting: { fontSize: 20, fontWeight: '800', color: COLORS.text },
  date: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
  addBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10 },
  addBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 14 },
  alertsContainer: { marginBottom: 8 },
  alert: { backgroundColor: '#FEF3C7', borderRadius: 8, padding: 10, marginBottom: 6, borderLeftWidth: 3, borderLeftColor: COLORS.warning },
  alertText: { fontSize: 12, color: '#1A1A1A', fontWeight: '500' },
  pendingBanner: { backgroundColor: COLORS.primary + '15', borderRadius: 10, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: COLORS.primary + '40' },
  pendingText: { color: COLORS.primary, fontWeight: '600', fontSize: 13 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginTop: 16, marginBottom: 10 },
  typeRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  typeCard: { flex: 1, backgroundColor: COLORS.white, borderRadius: 10, padding: 12, borderTopWidth: 3, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
  typeLabel: { fontSize: 11, color: COLORS.textLight, fontWeight: '500' },
  typeAmount: { fontSize: 14, fontWeight: '800', marginTop: 4 },
  insightCard: { backgroundColor: COLORS.white, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 4, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  insightRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  insightLabel: { fontSize: 13, color: COLORS.textLight },
  insightValue: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  subLabel: { fontSize: 11, color: COLORS.textLight, marginTop: 1 },
  roleBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  roleText: { fontSize: 11, fontWeight: '600' },
});
