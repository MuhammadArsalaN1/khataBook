import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { format } from 'date-fns';
import { useStore } from '../../store/useStore';
import { COLORS, TYPE_LABELS, TYPE_ICONS, USERS } from '../../constants';
import { getDashboardStats, getMonthlyComparisons, getCategoryBreakdown } from '../../utils/analytics';
import { getCategoryTrends } from '../../utils/advancedAnalytics';
import { ExpenseType } from '../../types';
import { responsiveFontSize, responsiveSpacing } from '../../utils/responsive';
import DonutChart from '../../components/charts/DonutChart';

const W = Dimensions.get('window').width;

export default function DashboardScreenPremium() {
  const { expenses, incomes, currentUser, wallets } = useStore();
  const navigation = useNavigation<any>();
  const [refreshing, setRefreshing] = useState(false);

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const stats = useMemo(() => getDashboardStats(expenses), [expenses]);
  const categoryTrends = useMemo(() => getCategoryTrends(expenses), [expenses]);

  // Income calculations
  const incomeByType = useMemo(() => {
    const result: Record<ExpenseType, number> = { personal: 0, office: 0, farm: 0 };
    incomes
      .filter(i => i.month === month && i.year === year)
      .forEach(i => {
        if (i.type in result) result[i.type as ExpenseType] = i.amount;
      });
    return result;
  }, [incomes, month, year]);

  const totalIncome = Object.values(incomeByType).reduce((a, b) => a + b, 0);
  const totalBalance = totalIncome - stats.monthly;

  // Wallet totals
  const totalWallets = useMemo(
    () =>
      wallets
        .filter(w => w.month === month && w.year === year)
        .reduce((sum, w) => sum + w.balance, 0),
    [wallets, month, year]
  );

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>👋 Good {new Date().getHours() < 12 ? 'Morning' : 'Afternoon'}</Text>
            <Text style={styles.userName}>{currentUser?.name}</Text>
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('AddExpense')}>
            <Text style={styles.addBtnText}>+</Text>
          </TouchableOpacity>
        </View>

        {/* Fiscal Month Info */}
        <View style={styles.fiscalInfo}>
          <Text style={styles.fiscalLabel}>Fiscal Month</Text>
          <Text style={styles.fiscalMonth}>{format(now, 'MMM yyyy')}</Text>
        </View>

        {/* Key Stats Row */}
        <View style={styles.statsRow}>
          <LinearGradient
            colors={COLORS.incomeGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.statCard, styles.incomeCard]}
          >
            <Text style={styles.statLabel}>Income</Text>
            <Text style={styles.statAmount}>Rs. {totalIncome.toLocaleString()}</Text>
          </LinearGradient>

          <LinearGradient
            colors={COLORS.expenseGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.statCard, styles.expenseCard]}
          >
            <Text style={styles.statLabel}>Spent</Text>
            <Text style={styles.statAmount}>Rs. {stats.monthly.toLocaleString()}</Text>
          </LinearGradient>

          <LinearGradient
            colors={totalBalance >= 0 ? COLORS.incomeGradient : COLORS.expenseGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.statCard, styles.balanceCard]}
          >
            <Text style={styles.statLabel}>Balance</Text>
            <Text style={styles.statAmount}>Rs. {Math.abs(totalBalance).toLocaleString()}</Text>
          </LinearGradient>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity
              style={styles.quickActionBtn}
              onPress={() => navigation.navigate('AddExpense')}
            >
              <View style={[styles.qaIcon, { backgroundColor: COLORS.danger + '20' }]}>
                <Text style={styles.qaIconText}>➕</Text>
              </View>
              <Text style={styles.qaLabel}>Add Expense</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionBtn}
              onPress={() => navigation.navigate('Earnings')}
            >
              <View style={[styles.qaIcon, { backgroundColor: COLORS.success + '20' }]}>
                <Text style={styles.qaIconText}>💰</Text>
              </View>
              <Text style={styles.qaLabel}>Add Income</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionBtn}
              onPress={() => navigation.navigate('Wallet')}
            >
              <View style={[styles.qaIcon, { backgroundColor: COLORS.primary + '20' }]}>
                <Text style={styles.qaIconText}>👛</Text>
              </View>
              <Text style={styles.qaLabel}>Wallets</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionBtn}
              onPress={() => navigation.navigate('Analytics')}
            >
              <View style={[styles.qaIcon, { backgroundColor: COLORS.secondary + '20' }]}>
                <Text style={styles.qaIconText}>📊</Text>
              </View>
              <Text style={styles.qaLabel}>Analytics</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Wallets Section */}
        {totalWallets > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>💳 Wallets</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Wallet')}>
                <Text style={styles.seeAll}>See All →</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.walletCard}>
              <Text style={styles.walletLabel}>Total Liquid Assets</Text>
              <Text style={styles.walletAmount}>Rs. {totalWallets.toLocaleString()}</Text>
              <Text style={styles.walletTime}>Updated: {format(now, 'HH:mm')}</Text>
            </View>
          </View>
        )}

        {/* Category Insights */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>📈 Category Insights</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Analytics')}>
              <Text style={styles.seeAll}>View All →</Text>
            </TouchableOpacity>
          </View>

          {categoryTrends.slice(0, 3).map((trend, i) => (
            <View key={i} style={styles.insightRow}>
              <View style={styles.insightLeft}>
                <Text style={styles.insightCategory}>{trend.category}</Text>
                <Text style={styles.insightAmount}>Rs. {trend.thisMonth.toLocaleString()}</Text>
              </View>
              <View style={styles.insightRight}>
                <Text style={[styles.insightTrend, { color: trend.trend === 'up' ? COLORS.danger : COLORS.success }]}>
                  {trend.trend === 'up' ? '↑' : '↓'} {Math.abs(trend.change).toFixed(1)}%
                </Text>
                <Text style={styles.insightCompare}>vs last month</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Expense Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💹 Expense Breakdown</Text>
          <View style={styles.chartCard}>
            <DonutChart
              data={[
                { label: 'Personal', value: stats.byType.personal, color: COLORS.personal },
                { label: 'Office', value: stats.byType.office, color: COLORS.office },
                { label: 'Farm', value: stats.byType.farm, color: COLORS.farm },
              ]}
              size={120}
              strokeWidth={20}
              centerLabel={`Rs.${stats.monthly >= 1000 ? `${(stats.monthly / 1000).toFixed(1)}k` : stats.monthly}`}
              centerSub="total"
            />
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1 },
  header: {
    paddingHorizontal: responsiveSpacing(16),
    paddingTop: responsiveSpacing(12),
    paddingBottom: responsiveSpacing(16),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  greeting: {
    fontSize: responsiveFontSize(14),
    color: COLORS.textLight,
    fontWeight: '500',
  },
  userName: {
    fontSize: responsiveFontSize(18),
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 2,
  },
  addBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addBtnText: { color: COLORS.white, fontSize: 24, fontWeight: '300' },
  fiscalInfo: {
    paddingHorizontal: responsiveSpacing(16),
    paddingVertical: responsiveSpacing(12),
  },
  fiscalLabel: {
    fontSize: responsiveFontSize(12),
    color: COLORS.textLight,
    fontWeight: '600',
  },
  fiscalMonth: {
    fontSize: responsiveFontSize(14),
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 2,
  },
  statsRow: {
    paddingHorizontal: responsiveSpacing(16),
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    borderRadius: 14,
    padding: responsiveSpacing(14),
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  incomeCard: {},
  expenseCard: {},
  balanceCard: {},
  statLabel: {
    fontSize: responsiveFontSize(11),
    fontWeight: '600',
    color: COLORS.white,
    opacity: 0.85,
  },
  statAmount: {
    fontSize: responsiveFontSize(16),
    fontWeight: '800',
    color: COLORS.white,
    marginTop: 6,
  },
  section: {
    paddingHorizontal: responsiveSpacing(16),
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: responsiveFontSize(16),
    fontWeight: '700',
    color: COLORS.text,
  },
  seeAll: {
    fontSize: responsiveFontSize(12),
    color: COLORS.primary,
    fontWeight: '600',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  quickActionBtn: {
    flex: 1,
    alignItems: 'center',
  },
  qaIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  qaIconText: { fontSize: 24 },
  qaLabel: {
    fontSize: responsiveFontSize(11),
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
  },
  walletCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: responsiveSpacing(14),
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  walletLabel: {
    fontSize: responsiveFontSize(12),
    color: COLORS.textLight,
    fontWeight: '600',
  },
  walletAmount: {
    fontSize: responsiveFontSize(22),
    fontWeight: '800',
    color: COLORS.text,
    marginTop: 6,
  },
  walletTime: {
    fontSize: responsiveFontSize(10),
    color: COLORS.textLight,
    marginTop: 4,
    fontWeight: '500',
  },
  insightRow: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: responsiveSpacing(12),
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  insightLeft: {},
  insightCategory: {
    fontSize: responsiveFontSize(14),
    fontWeight: '700',
    color: COLORS.text,
  },
  insightAmount: {
    fontSize: responsiveFontSize(12),
    color: COLORS.textLight,
    marginTop: 2,
    fontWeight: '500',
  },
  insightRight: { alignItems: 'flex-end' },
  insightTrend: {
    fontSize: responsiveFontSize(13),
    fontWeight: '700',
  },
  insightCompare: {
    fontSize: responsiveFontSize(10),
    color: COLORS.textLight,
    marginTop: 1,
  },
  chartCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: responsiveSpacing(16),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
});
