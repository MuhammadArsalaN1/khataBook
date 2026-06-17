import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Dimensions, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { format, startOfMonth, subMonths } from 'date-fns';
import { useStore } from '../../store/useStore';
import { COLORS, TYPE_LABELS, TYPE_COLORS, TYPE_LIGHT, TYPE_ICONS, USERS } from '../../constants';
import { getDashboardStats, getMonthlyComparisons, getCategoryBreakdown, filterByDateRange, sumByType } from '../../utils/analytics';
import { ExpenseType } from '../../types';
import DonutChart from '../../components/charts/DonutChart';
import BarChart from '../../components/charts/BarChart';

const W = Dimensions.get('window').width;

export default function DashboardScreenNew() {
  const { expenses, incomes, currentUser, budgets } = useStore();
  const navigation = useNavigation<any>();
  const [refreshing, setRefreshing] = useState(false);
  const now = new Date();
  const monthStr = format(now, 'yyyy-MM');
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const stats = useMemo(() => getDashboardStats(expenses), [expenses]);
  const comparisons = useMemo(() => getMonthlyComparisons(expenses, 6), [expenses]);
  const catBreakdown = useMemo(() => getCategoryBreakdown(expenses).slice(0, 6), [expenses]);

  // Income calculations
  const incomeByType = useMemo(() => {
    const result: Record<ExpenseType, number> = { personal: 0, office: 0, farm: 0 };
    incomes.filter(i => i.month === month && i.year === year).forEach(i => {
      if (i.type in result) result[i.type as ExpenseType] = i.amount;
    });
    return result;
  }, [incomes, month, year]);

  const totalIncome = Object.values(incomeByType).reduce((a, b) => a + b, 0);
  const balances = useMemo(() => ({
    personal: incomeByType.personal - stats.byType.personal,
    office: incomeByType.office - stats.byType.office,
    farm: incomeByType.farm - stats.byType.farm,
  }), [incomeByType, stats]);

  const totalBalance = totalIncome - stats.monthly;

  // User stats
  const userStats = useMemo(() => USERS.map(u => ({
    user: u,
    entries: expenses.filter(e => e.enteredBy === u.id && e.date.startsWith(monthStr)).length,
    amount: expenses.filter(e => e.enteredBy === u.id && e.date.startsWith(monthStr) && e.status !== 'rejected').reduce((s, e) => s + e.amount, 0),
  })), [expenses, monthStr]);

  // Recent entries
  const recent = useMemo(() =>
    [...expenses].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5),
    [expenses]
  );

  const handleGoToType = (type: ExpenseType) => {
    navigation.navigate('Expenses', { filterType: type });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => setRefreshing(false)} tintColor={COLORS.white} />}
      >
        {/* ── DARK HEADER ────────────────────────────── */}
        <View style={styles.header}>
          <View style={styles.headerGreeting}>
            <Text style={styles.greetingText}>
              {getTimeGreeting()}, {currentUser?.name}
            </Text>
            <Text style={styles.dateText}>{format(now, 'EEE, dd MMM yyyy')}</Text>
          </View>
          <TouchableOpacity style={styles.fabMini} onPress={() => navigation.navigate('AddExpense')}>
            <Text style={styles.fabMiniText}>+</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.body}>
          {/* ── INCOME VS EXPENSE CARDS ────────────────── */}
          <View style={styles.balanceRow}>
            <View style={[styles.balanceCard, { backgroundColor: COLORS.success + '15', borderColor: COLORS.success }]}>
              <Text style={[styles.balanceLabel, { color: COLORS.success }]}>💰 Income</Text>
              <Text style={[styles.balanceAmount, { color: COLORS.success }]}>Rs. {totalIncome.toLocaleString()}</Text>
              <Text style={styles.balanceSub}>{format(now, 'MMMM')}</Text>
            </View>
            <View style={[styles.balanceCard, { backgroundColor: COLORS.danger + '15', borderColor: COLORS.danger }]}>
              <Text style={[styles.balanceLabel, { color: COLORS.danger }]}>💸 Spent</Text>
              <Text style={[styles.balanceAmount, { color: COLORS.danger }]}>Rs. {stats.monthly.toLocaleString()}</Text>
              <Text style={styles.balanceSub}>{((stats.monthly / totalIncome) * 100 || 0).toFixed(0)}% of income</Text>
            </View>
            <View style={[styles.balanceCard, {
              backgroundColor: totalBalance >= 0 ? COLORS.success + '15' : COLORS.danger + '15',
              borderColor: totalBalance >= 0 ? COLORS.success : COLORS.danger,
            }]}>
              <Text style={[styles.balanceLabel, { color: totalBalance >= 0 ? COLORS.success : COLORS.danger }]}>
                {totalBalance >= 0 ? '✓ Balance' : '✗ Deficit'}
              </Text>
              <Text style={[styles.balanceAmount, { color: totalBalance >= 0 ? COLORS.success : COLORS.danger }]}>
                Rs. {Math.abs(totalBalance).toLocaleString()}
              </Text>
              <Text style={styles.balanceSub}>{totalBalance >= 0 ? 'Remaining' : 'Overspent'}</Text>
            </View>
          </View>

          {/* ── INCOME BY TYPE ────────────────────────── */}
          <Text style={styles.sectionTitle}>Income vs Spending by Type</Text>
          {(['personal', 'office', 'farm'] as ExpenseType[]).map(type => {
            const income = incomeByType[type];
            const spent = stats.byType[type];
            const balance = income - spent;
            const pct = income > 0 ? (spent / income) * 100 : 0;

            return (
              <TouchableOpacity
                key={type}
                style={[styles.typeBreakdown, { backgroundColor: TYPE_LIGHT[type] }]}
                onPress={() => handleGoToType(type)}
                activeOpacity={0.7}
              >
                <View style={styles.typeBreakdownLeft}>
                  <Text style={styles.typeBreakdownIcon}>{TYPE_ICONS[type]}</Text>
                  <View>
                    <Text style={[styles.typeBreakdownLabel, { color: TYPE_COLORS[type] }]}>{TYPE_LABELS[type]}</Text>
                    <View style={styles.typeBreakdownMeta}>
                      <Text style={styles.typeMeta}>Income: Rs. {income.toLocaleString()}</Text>
                      <Text style={styles.typeMeta}>Spent: Rs. {spent.toLocaleString()}</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.typeBreakdownRight}>
                  <View style={[styles.typeBalance, { backgroundColor: balance >= 0 ? COLORS.success + '20' : COLORS.danger + '20' }]}>
                    <Text style={[styles.typeBalanceText, { color: balance >= 0 ? COLORS.success : COLORS.danger }]}>
                      {balance >= 0 ? '+' : ''}Rs. {Math.abs(balance).toLocaleString()}
                    </Text>
                  </View>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${Math.min(pct, 100)}%`, backgroundColor: pct >= 100 ? COLORS.danger : pct >= 80 ? COLORS.warning : COLORS.success }]} />
                  </View>
                  <Text style={styles.progressPct}>{pct.toFixed(0)}%</Text>
                </View>
              </TouchableOpacity>
            );
          })}

          {/* ── MONTHLY TREND CHART ───────────────────── */}
          <Text style={styles.sectionTitle}>6-Month Spending Trend</Text>
          <View style={styles.card}>
            <BarChart
              data={comparisons.map(c => ({ label: c.label, value: c.total }))}
              height={150}
              width={W - 48}
            />
          </View>

          {/* ── EXPENSE BREAKDOWN DONUT ───────────────── */}
          <Text style={styles.sectionTitle}>Expense Type Breakdown</Text>
          <View style={styles.card}>
            <View style={styles.donutContainer}>
              <DonutChart
                data={[
                  { label: 'Personal', value: stats.byType.personal, color: COLORS.personal },
                  { label: 'Office', value: stats.byType.office, color: COLORS.office },
                  { label: 'Farm', value: stats.byType.farm, color: COLORS.farm },
                ]}
                size={140}
                strokeWidth={24}
                centerLabel={`Rs.${stats.monthly >= 1000 ? `${(stats.monthly / 1000).toFixed(1)}k` : stats.monthly}`}
                centerSub="total"
              />
              <View style={styles.donutLegend}>
                {[
                  { label: 'Personal', value: stats.byType.personal, color: COLORS.personal },
                  { label: 'Office', value: stats.byType.office, color: COLORS.office },
                  { label: 'Farm', value: stats.byType.farm, color: COLORS.farm },
                ].map((item, i) => (
                  <TouchableOpacity key={i} style={styles.legendItem} onPress={() => handleGoToType(item.label.toLowerCase() as ExpenseType)} activeOpacity={0.7}>
                    <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                    <View style={styles.legendInfo}>
                      <Text style={styles.legendLabel}>{item.label}</Text>
                      <Text style={[styles.legendAmount, { color: item.color }]}>Rs. {item.value.toLocaleString()}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* ── TOP CATEGORIES ────────────────────────── */}
          <Text style={styles.sectionTitle}>Top Spending Categories</Text>
          <View style={styles.card}>
            {catBreakdown.length === 0 ? (
              <Text style={styles.emptyText}>No expenses this month</Text>
            ) : (
              catBreakdown.map((cat, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.categoryRow, i < catBreakdown.length - 1 && styles.categoryRowBorder]}
                  activeOpacity={0.7}
                >
                  <View style={[styles.catRank, { backgroundColor: COLORS.chart[i % COLORS.chart.length] + '20' }]}>
                    <Text style={[styles.catRankText, { color: COLORS.chart[i % COLORS.chart.length] }]}>#{i + 1}</Text>
                  </View>
                  <View style={styles.catDetails}>
                    <Text style={styles.catName}>{cat.category}</Text>
                    <View style={styles.catBar}>
                      <View style={[styles.catBarFill, { width: `${(cat.amount / catBreakdown[0].amount) * 100}%`, backgroundColor: COLORS.chart[i % COLORS.chart.length] }]} />
                    </View>
                  </View>
                  <Text style={styles.catAmount}>Rs. {cat.amount.toLocaleString()}</Text>
                </TouchableOpacity>
              ))
            )}
          </View>

          {/* ── USER ACTIVITY ─────────────────────────── */}
          <Text style={styles.sectionTitle}>User Activity ({format(now, 'MMMM')})</Text>
          <View style={styles.card}>
            {userStats.map(({ user, entries, amount }, i) => (
              <TouchableOpacity
                key={user.id}
                style={[styles.userActivityRow, i < userStats.length - 1 && styles.userActivityRowBorder]}
                onPress={() => navigation.navigate('Expenses', { filterUser: user.id })}
                activeOpacity={0.7}
              >
                <View style={[styles.userActivityAvatar, { backgroundColor: user.role === 'admin' ? COLORS.primary : COLORS.secondary }]}>
                  <Text style={styles.userActivityAvatarText}>{user.name[0]}</Text>
                </View>
                <View style={styles.userActivityInfo}>
                  <Text style={styles.userActivityName}>{user.name}</Text>
                  <Text style={styles.userActivityMeta}>
                    📝 {entries} entries • 💰 Rs. {amount.toLocaleString()}
                  </Text>
                </View>
                <View style={styles.userActivityRole}>
                  <Text style={[styles.userActivityRoleText, { color: user.role === 'admin' ? COLORS.primary : COLORS.secondary }]}>
                    {user.role === 'admin' ? '👑' : '👤'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── RECENT ENTRIES ────────────────────────── */}
          <Text style={styles.sectionTitle}>Recent Entries</Text>
          <View style={styles.card}>
            {recent.length === 0 ? (
              <Text style={styles.emptyText}>No entries yet</Text>
            ) : (
              recent.map((entry, i) => {
                const user = USERS.find(u => u.id === entry.enteredBy);
                return (
                  <TouchableOpacity
                    key={entry.id}
                    style={[styles.recentRow, i < recent.length - 1 && styles.recentRowBorder]}
                    onPress={() => navigation.navigate('AddExpense', { expenseId: entry.id })}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.recentIcon, { backgroundColor: TYPE_LIGHT[entry.type] }]}>
                      <Text style={styles.recentIconText}>{TYPE_ICONS[entry.type]}</Text>
                    </View>
                    <View style={styles.recentInfo}>
                      <Text style={styles.recentCategory}>{entry.category}</Text>
                      <Text style={styles.recentMeta}>
                        {user?.name} • {format(new Date(entry.date), 'dd MMM')} • {entry.paymentMethod}
                      </Text>
                    </View>
                    <View style={styles.recentRight}>
                      <Text style={styles.recentAmount}>Rs. {entry.amount.toLocaleString()}</Text>
                      <View style={[styles.statusDot, {
                        backgroundColor: entry.status === 'approved' ? COLORS.success : entry.status === 'pending' ? COLORS.warning : entry.status === 'rejected' ? COLORS.danger : COLORS.textLight,
                      }]} />
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function getTimeGreeting() {
  const h = new Date().getHours();
  if (h < 12) return '🌅 Good Morning';
  if (h < 17) return '☀️ Good Afternoon';
  return '🌙 Good Evening';
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.dark },
  header: { backgroundColor: COLORS.dark, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
  headerGreeting: {},
  greetingText: { fontSize: 18, fontWeight: '800', color: COLORS.white },
  dateText: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4 },
  fabMini: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', shadowColor: COLORS.primary, shadowOpacity: 0.4, shadowRadius: 8, elevation: 5 },
  fabMiniText: { color: COLORS.white, fontSize: 24, fontWeight: '300' },
  body: { backgroundColor: COLORS.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 16, paddingTop: 16 },
  balanceRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  balanceCard: { flex: 1, borderRadius: 12, padding: 12, borderWidth: 2 },
  balanceLabel: { fontSize: 11, fontWeight: '600' },
  balanceAmount: { fontSize: 16, fontWeight: '800', marginTop: 4 },
  balanceSub: { fontSize: 9, color: COLORS.textLight, marginTop: 2 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginTop: 16, marginBottom: 10 },
  typeBreakdown: { borderRadius: 12, padding: 12, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  typeBreakdownLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  typeBreakdownIcon: { fontSize: 24, marginRight: 12 },
  typeBreakdownLabel: { fontSize: 14, fontWeight: '700' },
  typeBreakdownMeta: { marginTop: 4 },
  typeMeta: { fontSize: 10, color: COLORS.textLight, marginTop: 1 },
  typeBreakdownRight: { alignItems: 'flex-end', width: 100 },
  typeBalance: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginBottom: 4 },
  typeBalanceText: { fontSize: 11, fontWeight: '700' },
  progressBar: { height: 3, backgroundColor: COLORS.border, borderRadius: 2, width: 100, overflow: 'hidden', marginBottom: 3 },
  progressFill: { height: 3, borderRadius: 2 },
  progressPct: { fontSize: 9, color: COLORS.textLight, fontWeight: '600' },
  card: { backgroundColor: COLORS.card, borderRadius: 14, padding: 14, marginBottom: 14, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  donutContainer: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  donutLegend: { flex: 1 },
  legendItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  legendInfo: { flex: 1 },
  legendLabel: { fontSize: 11, color: COLORS.textMed, fontWeight: '600' },
  legendAmount: { fontSize: 12, fontWeight: '700', marginTop: 1 },
  categoryRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  categoryRowBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.divider },
  catRank: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  catRankText: { fontSize: 11, fontWeight: '800' },
  catDetails: { flex: 1 },
  catName: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  catBar: { height: 4, backgroundColor: COLORS.border, borderRadius: 2, marginTop: 4, overflow: 'hidden' },
  catBarFill: { height: 4, borderRadius: 2 },
  catAmount: { fontSize: 13, fontWeight: '700', color: COLORS.text, width: 90, textAlign: 'right' },
  userActivityRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  userActivityRowBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.divider },
  userActivityAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  userActivityAvatarText: { fontSize: 16, fontWeight: '700', color: COLORS.white },
  userActivityInfo: { flex: 1 },
  userActivityName: { fontSize: 13, fontWeight: '700', color: COLORS.text },
  userActivityMeta: { fontSize: 11, color: COLORS.textLight, marginTop: 2 },
  userActivityRole: { width: 30, alignItems: 'center' },
  userActivityRoleText: { fontSize: 16 },
  recentRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  recentRowBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.divider },
  recentIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  recentIconText: { fontSize: 16 },
  recentInfo: { flex: 1 },
  recentCategory: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  recentMeta: { fontSize: 10, color: COLORS.textLight, marginTop: 2 },
  recentRight: { alignItems: 'flex-end' },
  recentAmount: { fontSize: 13, fontWeight: '700', color: COLORS.text },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginTop: 4 },
  emptyText: { textAlign: 'center', color: COLORS.textLight, paddingVertical: 20, fontSize: 13 },
});
