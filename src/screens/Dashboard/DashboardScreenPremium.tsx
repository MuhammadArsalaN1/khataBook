import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { useStore } from '../../store/useStore';
import { COLORS, USERS } from '../../constants';
import { getDashboardStats, getMonthlyComparisons } from '../../utils/analytics';
import { ExpenseType } from '../../types';
import { responsiveFontSize, responsiveSpacing } from '../../utils/responsive';

const W = Dimensions.get('window').width;
const CARD_W = (W - 48) / 2;

export default function DashboardScreenPremium() {
  const { expenses, incomes, currentUser, wallets, savingsGoals } = useStore();
  const navigation = useNavigation<any>();

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const stats = useMemo(() => getDashboardStats(expenses), [expenses]);

  const totalIncome = useMemo(() => {
    return incomes
      .filter(i => i.month === month && i.year === year)
      .reduce((s: number, i: any) => s + i.amount, 0);
  }, [incomes, month, year]);

  const totalWallets = useMemo(
    () => wallets.filter(w => w.month === month && w.year === year).reduce((s, w) => s + w.balance, 0),
    [wallets, month, year]
  );

  const balance = totalIncome - stats.monthly;
  const isPositive = balance >= 0;

  // Last 5 recent transactions
  const recentExpenses = useMemo(
    () => [...expenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5),
    [expenses]
  );

  const lastMonthExpenses = useMemo(() => {
    const lastMonth = subMonths(now, 1);
    const from = startOfMonth(lastMonth);
    const to = endOfMonth(lastMonth);
    return expenses
      .filter(e => {
        const d = new Date(e.date);
        return d >= from && d <= to && e.status !== 'rejected';
      })
      .reduce((s, e) => s + e.amount, 0);
  }, [expenses]);

  const weekChange = stats.monthly > 0 && lastMonthExpenses > 0
    ? ((stats.monthly - lastMonthExpenses) / lastMonthExpenses * 100).toFixed(0)
    : null;

  const greeting = now.getHours() < 12 ? 'Good Morning' : now.getHours() < 17 ? 'Good Afternoon' : 'Good Evening';
  const greetingEmoji = now.getHours() < 12 ? '☀️' : now.getHours() < 17 ? '🌤️' : '🌙';

  const CATEGORY_ICONS: Record<string, string> = {
    'Grocery': '🛒', 'Fuel': '⛽', 'Utility Bills': '💡', 'Internet': '🌐',
    'Medical': '💊', 'Education': '📚', 'Dining': '🍽️', 'Shopping': '🛍️',
    'Travel': '✈️', 'Entertainment': '🎬', 'Subscriptions': '📱',
    'Rent': '🏠', 'Electricity': '⚡', 'Hosting & Domains': '🖥️',
    'Software Subscriptions': '💻', 'Marketing & Ads': '📣', 'Salaries': '💼',
    'Office Supplies': '🗂️', 'Equipment': '🔧', 'Maintenance': '🔨',
    'Feed': '🌾', 'Medicine': '💉', 'Labor': '👷', 'Transportation': '🚛',
    'Miscellaneous': '📦',
  };

  const getCategoryIcon = (cat: string) => CATEGORY_ICONS[cat] ?? '💰';

  const TYPE_COLORS: Record<string, string> = {
    personal: '#3B82F6',
    office: '#8B5CF6',
    farm: '#10B981',
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Purple gradient header */}
      <LinearGradient
        colors={['#7C3AED', '#6D28D9', '#5B21B6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGrad}
      >
        <SafeAreaView edges={['top']} style={{ width: '100%' }}>
          {/* Top row: avatar + month + bell */}
          <View style={styles.topRow}>
            <TouchableOpacity style={styles.avatarBtn} onPress={() => navigation.navigate('Settings')}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{currentUser?.name?.charAt(0) ?? 'A'}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.monthPill}>
              <Text style={styles.monthText}>{format(now, 'MMMM yyyy')}</Text>
              <Text style={styles.monthChevron}>  ▾</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.bellBtn}>
              <Text style={styles.bellIcon}>🔔</Text>
            </TouchableOpacity>
          </View>

          {/* Balance section */}
          <View style={styles.balanceSection}>
            <Text style={styles.balanceLabel}>Current Balance</Text>
            <Text style={styles.balanceAmount}>
              Rs. {Math.abs(balance).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
            </Text>
            {weekChange !== null && (
              <Text style={[styles.balanceChange, { color: isPositive ? '#86EFAC' : '#FCA5A5' }]}>
                {isPositive ? '+' : '-'}{weekChange}% than last month
              </Text>
            )}
          </View>

          {/* Your Money cards */}
          <View style={styles.moneyCardRow}>
            <View style={styles.moneyCard}>
              <View style={styles.moneyCardIcon}>
                <Text style={{ fontSize: 18 }}>💰</Text>
              </View>
              <View>
                <Text style={styles.moneyCardLabel}>Income</Text>
                <Text style={styles.moneyCardAmount}>
                  Rs. {totalIncome.toLocaleString()}
                </Text>
              </View>
            </View>
            <View style={styles.moneyCardDivider} />
            <View style={styles.moneyCard}>
              <View style={[styles.moneyCardIcon, { backgroundColor: 'rgba(239,68,68,0.2)' }]}>
                <Text style={{ fontSize: 18 }}>📤</Text>
              </View>
              <View>
                <Text style={styles.moneyCardLabel}>Expenses</Text>
                <Text style={[styles.moneyCardAmount, { color: '#FCA5A5' }]}>
                  Rs. {stats.monthly.toLocaleString()}
                </Text>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* White scrollable content */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Insight banner */}
        <TouchableOpacity
          style={styles.insightBanner}
          onPress={() => navigation.navigate('Analytics')}
          activeOpacity={0.85}
        >
          <Text style={styles.insightBannerIcon}>✨</Text>
          <Text style={styles.insightBannerText}>
            {isPositive
              ? `Surplus of Rs. ${balance.toLocaleString()} this month`
              : `Deficit of Rs. ${Math.abs(balance).toLocaleString()} this month`}
          </Text>
          <Text style={styles.insightBannerArrow}>View →</Text>
        </TouchableOpacity>

        {/* Quick Actions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
          </View>
          <View style={styles.quickActionsRow}>
            <TouchableOpacity
              style={styles.qaBtn}
              onPress={() => navigation.navigate('AddExpense')}
            >
              <LinearGradient
                colors={['#FEE2E2', '#FECACA']}
                style={styles.qaIconBg}
              >
                <Text style={styles.qaIconEmoji}>➕</Text>
              </LinearGradient>
              <Text style={styles.qaLabel}>Expense</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.qaBtn}
              onPress={() => navigation.navigate('Earnings')}
            >
              <LinearGradient
                colors={['#D1FAE5', '#A7F3D0']}
                style={styles.qaIconBg}
              >
                <Text style={styles.qaIconEmoji}>💵</Text>
              </LinearGradient>
              <Text style={styles.qaLabel}>Income</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.qaBtn}
              onPress={() => navigation.navigate('Wallet')}
            >
              <LinearGradient
                colors={['#EDE9FE', '#DDD6FE']}
                style={styles.qaIconBg}
              >
                <Text style={styles.qaIconEmoji}>👛</Text>
              </LinearGradient>
              <Text style={styles.qaLabel}>Wallet</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.qaBtn}
              onPress={() => navigation.navigate('Analytics')}
            >
              <LinearGradient
                colors={['#DBEAFE', '#BFDBFE']}
                style={styles.qaIconBg}
              >
                <Text style={styles.qaIconEmoji}>📊</Text>
              </LinearGradient>
              <Text style={styles.qaLabel}>Analytics</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Wallets summary */}
        {totalWallets > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Wallets</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Wallet')}>
                <Text style={styles.seeAll}>Details →</Text>
              </TouchableOpacity>
            </View>
            <LinearGradient
              colors={['#7C3AED', '#6D28D9']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.walletCard}
            >
              <View>
                <Text style={styles.walletCardLabel}>Total Liquid Assets</Text>
                <Text style={styles.walletCardAmount}>Rs. {totalWallets.toLocaleString()}</Text>
                <Text style={styles.walletCardSub}>Last updated: {format(now, 'dd MMM, hh:mm a')}</Text>
              </View>
              <Text style={{ fontSize: 52 }}>👛</Text>
            </LinearGradient>
          </View>
        )}

        {/* Savings Goals */}
        {savingsGoals.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Savings Goals</Text>
              <TouchableOpacity>
                <Text style={styles.seeAll}>View All →</Text>
              </TouchableOpacity>
            </View>
            {savingsGoals.slice(0, 2).map(goal => {
              const pct = goal.targetAmount > 0 ? Math.min(goal.currentAmount / goal.targetAmount, 1) : 0;
              return (
                <View key={goal.id} style={styles.goalCard}>
                  <View style={styles.goalCardLeft}>
                    <Text style={styles.goalName}>{goal.name}</Text>
                    <Text style={styles.goalSub}>
                      Rs. {goal.currentAmount.toLocaleString()} / Rs. {goal.targetAmount.toLocaleString()}
                    </Text>
                    <View style={styles.goalBarBg}>
                      <View style={[styles.goalBarFill, { width: `${pct * 100}%` as any }]} />
                    </View>
                  </View>
                  <View style={styles.goalCircle}>
                    <Text style={styles.goalPct}>{Math.round(pct * 100)}%</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Transactions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Transactions</Text>
            <View style={styles.transactionHeaderRight}>
              <View style={styles.periodPill}>
                <Text style={styles.periodPillText}>For the Period</Text>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('Expenses')}>
                <Text style={styles.seeAll}> View All</Text>
              </TouchableOpacity>
            </View>
          </View>

          {recentExpenses.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={{ fontSize: 40 }}>📭</Text>
              <Text style={styles.emptyText}>No transactions yet</Text>
              <TouchableOpacity
                style={styles.emptyBtn}
                onPress={() => navigation.navigate('AddExpense')}
              >
                <Text style={styles.emptyBtnText}>Add your first expense</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.txDateRow}>
                <Text style={styles.txDateLabel}>
                  {format(now, 'EEEE, dd MMMM yyyy')}
                </Text>
                <Text style={styles.txDateTotal}>
                  Total Rs. {stats.today.toLocaleString()}
                </Text>
              </View>
              {recentExpenses.map(exp => {
                const user = USERS.find(u => u.id === exp.enteredBy);
                return (
                  <TouchableOpacity
                    key={exp.id}
                    style={styles.txRow}
                    onPress={() => navigation.navigate('AddExpense', { expenseId: exp.id })}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.txIcon, { backgroundColor: (TYPE_COLORS[exp.type] ?? '#7C3AED') + '15' }]}>
                      <Text style={{ fontSize: 20 }}>{getCategoryIcon(exp.category)}</Text>
                    </View>
                    <View style={styles.txInfo}>
                      <Text style={styles.txCategory}>{exp.category}</Text>
                      <Text style={styles.txMeta}>
                        {exp.type.charAt(0).toUpperCase() + exp.type.slice(1)}
                        {user ? ` • ${user.name}` : ''}
                      </Text>
                    </View>
                    <View style={styles.txRight}>
                      <Text style={[styles.txAmount, { color: COLORS.danger }]}>
                        -{exp.amount.toLocaleString()}
                      </Text>
                      <Text style={styles.txTime}>
                        {format(new Date(exp.date), 'hh:mm a')}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </>
          )}
        </View>

        {/* Monthly summary cards */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>This Month</Text>
          </View>
          <View style={styles.summaryGrid}>
            <View style={[styles.summaryCard, { backgroundColor: '#F0FDF4' }]}>
              <Text style={styles.summaryCardEmoji}>📈</Text>
              <Text style={[styles.summaryCardLabel, { color: '#15803D' }]}>Income</Text>
              <Text style={[styles.summaryCardAmt, { color: '#166534' }]}>
                Rs. {totalIncome.toLocaleString()}
              </Text>
            </View>
            <View style={[styles.summaryCard, { backgroundColor: '#FEF2F2' }]}>
              <Text style={styles.summaryCardEmoji}>📉</Text>
              <Text style={[styles.summaryCardLabel, { color: '#DC2626' }]}>Expenses</Text>
              <Text style={[styles.summaryCardAmt, { color: '#991B1B' }]}>
                Rs. {stats.monthly.toLocaleString()}
              </Text>
            </View>
            <View style={[styles.summaryCard, { backgroundColor: '#EFF6FF' }]}>
              <Text style={styles.summaryCardEmoji}>💡</Text>
              <Text style={[styles.summaryCardLabel, { color: '#1D4ED8' }]}>Avg/Day</Text>
              <Text style={[styles.summaryCardAmt, { color: '#1E3A8A' }]}>
                Rs. {Math.round(stats.avgDaily).toLocaleString()}
              </Text>
            </View>
            <View style={[styles.summaryCard, { backgroundColor: isPositive ? '#F0FDF4' : '#FEF2F2' }]}>
              <Text style={styles.summaryCardEmoji}>{isPositive ? '✅' : '⚠️'}</Text>
              <Text style={[styles.summaryCardLabel, { color: isPositive ? '#15803D' : '#DC2626' }]}>
                {isPositive ? 'Surplus' : 'Deficit'}
              </Text>
              <Text style={[styles.summaryCardAmt, { color: isPositive ? '#166534' : '#991B1B' }]}>
                Rs. {Math.abs(balance).toLocaleString()}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8FAFC' },
  headerGrad: {
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 20,
  },
  avatarBtn: {},
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  monthPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  monthText: { color: '#fff', fontWeight: '600', fontSize: responsiveFontSize(13) },
  monthChevron: { color: 'rgba(255,255,255,0.8)', fontSize: 11 },
  bellBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  bellIcon: { fontSize: 18 },
  balanceSection: { alignItems: 'center', marginBottom: 24 },
  balanceLabel: { color: 'rgba(255,255,255,0.75)', fontSize: responsiveFontSize(13), fontWeight: '500', marginBottom: 6 },
  balanceAmount: { color: '#fff', fontSize: responsiveFontSize(36), fontWeight: '800', letterSpacing: -0.5 },
  balanceChange: { fontSize: responsiveFontSize(12), fontWeight: '500', marginTop: 4 },
  moneyCardRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  moneyCard: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  moneyCardDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 16 },
  moneyCardIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(134,239,172,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moneyCardLabel: { color: 'rgba(255,255,255,0.7)', fontSize: responsiveFontSize(11), fontWeight: '500' },
  moneyCardAmount: { color: '#fff', fontSize: responsiveFontSize(14), fontWeight: '700', marginTop: 2 },

  content: { flex: 1, backgroundColor: '#F8FAFC' },
  insightBanner: {
    margin: 16,
    backgroundColor: '#1E293B',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  insightBannerIcon: { fontSize: 18 },
  insightBannerText: { flex: 1, color: '#fff', fontSize: responsiveFontSize(13), fontWeight: '600' },
  insightBannerArrow: { color: '#A78BFA', fontSize: responsiveFontSize(12), fontWeight: '700' },

  section: { paddingHorizontal: 16, marginBottom: 20 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: responsiveFontSize(16), fontWeight: '700', color: COLORS.text },
  seeAll: { fontSize: responsiveFontSize(12), color: COLORS.primary, fontWeight: '600' },

  quickActionsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  qaBtn: { alignItems: 'center', flex: 1 },
  qaIconBg: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  qaIconEmoji: { fontSize: 26 },
  qaLabel: { fontSize: responsiveFontSize(11), fontWeight: '600', color: COLORS.textMed, textAlign: 'center' },

  walletCard: {
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  walletCardLabel: { color: 'rgba(255,255,255,0.75)', fontSize: responsiveFontSize(12), fontWeight: '500', marginBottom: 4 },
  walletCardAmount: { color: '#fff', fontSize: responsiveFontSize(26), fontWeight: '800' },
  walletCardSub: { color: 'rgba(255,255,255,0.6)', fontSize: responsiveFontSize(10), marginTop: 4, fontWeight: '500' },

  goalCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  goalCardLeft: { flex: 1, marginRight: 12 },
  goalName: { fontSize: responsiveFontSize(14), fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  goalSub: { fontSize: responsiveFontSize(11), color: COLORS.textLight, fontWeight: '500', marginBottom: 10 },
  goalBarBg: { height: 6, backgroundColor: '#E2E8F0', borderRadius: 3 },
  goalBarFill: { height: 6, backgroundColor: COLORS.primary, borderRadius: 3 },
  goalCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.primaryLight + '20',
    borderWidth: 2.5,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalPct: { fontSize: responsiveFontSize(12), fontWeight: '800', color: COLORS.primary },

  transactionHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  periodPill: {
    backgroundColor: COLORS.primaryLight + '25',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  periodPillText: { fontSize: responsiveFontSize(10), color: COLORS.primary, fontWeight: '600' },
  txDateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  txDateLabel: { fontSize: responsiveFontSize(12), color: COLORS.textLight, fontWeight: '600' },
  txDateTotal: { fontSize: responsiveFontSize(12), color: COLORS.textMed, fontWeight: '600' },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  txIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  txInfo: { flex: 1 },
  txCategory: { fontSize: responsiveFontSize(14), fontWeight: '700', color: COLORS.text },
  txMeta: { fontSize: responsiveFontSize(11), color: COLORS.textLight, marginTop: 2, fontWeight: '500' },
  txRight: { alignItems: 'flex-end' },
  txAmount: { fontSize: responsiveFontSize(14), fontWeight: '800' },
  txTime: { fontSize: responsiveFontSize(10), color: COLORS.textLight, marginTop: 2, fontWeight: '500' },

  emptyState: { alignItems: 'center', paddingVertical: 40, backgroundColor: COLORS.card, borderRadius: 16 },
  emptyText: { fontSize: responsiveFontSize(14), color: COLORS.textLight, fontWeight: '600', marginTop: 10, marginBottom: 16 },
  emptyBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: responsiveFontSize(13) },

  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  summaryCard: {
    width: CARD_W,
    borderRadius: 14,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  summaryCardEmoji: { fontSize: 22, marginBottom: 6 },
  summaryCardLabel: { fontSize: responsiveFontSize(11), fontWeight: '600', marginBottom: 4 },
  summaryCardAmt: { fontSize: responsiveFontSize(14), fontWeight: '800' },
});
