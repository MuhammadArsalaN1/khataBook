import React, { useMemo, useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Dimensions, StatusBar, Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { format } from 'date-fns';
import { useStore } from '../../store/useStore';
import { COLORS, USERS, WALLETS, CURRENCIES, CATEGORY_EMOJI } from '../../constants';
import { ExpenseType } from '../../types';
import { responsiveFontSize } from '../../utils/responsive';
import { formatMoney, toPKR, formatPKRCompact } from '../../utils/currency';
import { getActiveFiscalMonth, getResetCountdown, Countdown } from '../../utils/fiscalMonth';
import AnimatedIcon from '../../components/common/AnimatedIcon';

const W = Dimensions.get('window').width;
const CARD_W = (W - 44) / 2;

const TYPE_COLORS: Record<string, string> = { personal: '#3B82F6', office: '#8B5CF6', farm: '#10B981' };

function useCountdown(): Countdown {
  const [c, setC] = useState<Countdown>(() => getResetCountdown());
  useEffect(() => {
    const t = setInterval(() => setC(getResetCountdown()), 1000);
    return () => clearInterval(t);
  }, []);
  return c;
}

export default function DashboardScreenPremium() {
  const { expenses, incomes, currentUser, wallets, savingsGoals, activityLogs, exchangeRates } = useStore();
  const navigation = useNavigation<any>();
  const [notifOpen, setNotifOpen] = useState(false);

  const now = new Date();
  const fiscal = getActiveFiscalMonth(now);
  const { month, year } = fiscal;
  const countdown = useCountdown();

  // Expenses within the active fiscal month (calendar month, excludes rejected)
  const fiscalExpenses = useMemo(
    () => expenses.filter(e => {
      const d = new Date(e.date);
      return d.getMonth() + 1 === month && d.getFullYear() === year && e.status !== 'rejected';
    }),
    [expenses, month, year]
  );

  const totalSpent = useMemo(() => fiscalExpenses.reduce((s, e) => s + e.amount, 0), [fiscalExpenses]);
  const totalIncome = useMemo(
    () => incomes.filter((i: any) => i.month === month && i.year === year).reduce((s: number, i: any) => s + i.amount, 0),
    [incomes, month, year]
  );
  const balance = totalIncome - totalSpent;
  const isPositive = balance >= 0;
  const savingsRate = totalIncome > 0 ? Math.round((balance / totalIncome) * 100) : 0;

  // Wallets for active fiscal month, converted to PKR
  const walletData = useMemo(() => {
    return WALLETS.map(meta => {
      const docs = wallets.filter(
        w => w.userId === currentUser?.id && w.provider === meta.id &&
          w.month === month && w.year === year
      );
      const pkr = docs.reduce((s, w) => s + toPKR(w.balance, w.currency ?? 'PKR', exchangeRates), 0);
      const primary = docs[0];
      return { meta, pkr, docs, primary };
    });
  }, [wallets, currentUser, month, year, exchangeRates]);

  const totalLiquid = useMemo(() => walletData.reduce((s, w) => s + w.pkr, 0), [walletData]);

  // 5 latest transactions, most recent first
  const recent = useMemo(
    () => [...expenses].sort((a, b) => {
      const t = new Date(b.date).getTime() - new Date(a.date).getTime();
      return t !== 0 ? t : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }).slice(0, 5),
    [expenses]
  );

  // Notifications: pending approvals (admin) + latest activity
  const pendingCount = useMemo(() => expenses.filter(e => e.status === 'pending').length, [expenses]);
  const notifications = useMemo(() => {
    const items: { icon: string; title: string; sub: string; ts: string }[] = [];
    if (currentUser?.role === 'admin' && pendingCount > 0) {
      items.push({ icon: '⏳', title: `${pendingCount} expense${pendingCount > 1 ? 's' : ''} awaiting approval`, sub: 'Tap to review in Expenses', ts: '' });
    }
    if (countdown.days <= 2) {
      items.push({ icon: '🔄', title: 'Fiscal month resets soon', sub: `Dashboard rolls over in ${countdown.days}d ${countdown.hours}h`, ts: '' });
    }
    activityLogs.slice(0, 8).forEach(l =>
      items.push({ icon: actionEmoji(l.action), title: l.details, sub: `${l.userName} · ${format(new Date(l.timestamp), 'dd MMM, hh:mm a')}`, ts: l.timestamp })
    );
    return items;
  }, [activityLogs, pendingCount, currentUser, countdown]);
  const notifBadge = (currentUser?.role === 'admin' ? pendingCount : 0) + (countdown.days <= 2 ? 1 : 0);

  const greeting = now.getHours() < 12 ? 'Good Morning' : now.getHours() < 17 ? 'Good Afternoon' : 'Good Evening';

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <LinearGradient colors={['#7C3AED', '#6D28D9', '#5B21B6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.headerGrad}>
        <SafeAreaView edges={['top']} style={{ width: '100%' }}>
          {/* Top row */}
          <View style={styles.topRow}>
            <TouchableOpacity style={styles.avatarRow} onPress={() => navigation.navigate('Settings')}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{currentUser?.name?.charAt(0) ?? 'A'}</Text>
              </View>
              <View>
                <Text style={styles.greeting}>{greeting}</Text>
                <Text style={styles.userName}>{currentUser?.name}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.bellBtn} onPress={() => setNotifOpen(true)}>
              <AnimatedIcon name="bell" size={26} emojiSize={20} />
              {notifBadge > 0 && (
                <View style={styles.bellBadge}>
                  <Text style={styles.bellBadgeText}>{notifBadge}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Balance */}
          <View style={styles.balanceSection}>
            <Text style={styles.balanceLabel}>{isPositive ? 'Available Balance' : 'Over Budget'}</Text>
            <Text style={styles.balanceAmount}>{formatMoney(Math.abs(balance))}</Text>
            <View style={styles.balanceMetaRow}>
              <View style={styles.fiscalPill}>
                <Text style={styles.fiscalPillText}>📅 {fiscal.label}</Text>
              </View>
              <View style={styles.fiscalPill}>
                <Text style={styles.fiscalPillText}>⏳ Resets in {countdown.days}d {countdown.hours}h {countdown.minutes}m</Text>
              </View>
            </View>
          </View>

          {/* Income / Expense glass cards */}
          <View style={styles.moneyRow}>
            <View style={styles.moneyCard}>
              <View style={[styles.moneyIcon, { backgroundColor: 'rgba(134,239,172,0.25)' }]}>
                <AnimatedIcon name="income" size={26} emojiSize={18} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.moneyLabel}>Income</Text>
                <Text style={styles.moneyAmount}>{formatMoney(totalIncome)}</Text>
              </View>
            </View>
            <View style={styles.moneyDivider} />
            <View style={styles.moneyCard}>
              <View style={[styles.moneyIcon, { backgroundColor: 'rgba(252,165,165,0.25)' }]}>
                <AnimatedIcon name="expense" size={26} emojiSize={18} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.moneyLabel}>Expenses</Text>
                <Text style={[styles.moneyAmount, { color: '#FCA5A5' }]}>{formatMoney(totalSpent)}</Text>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Insight banner */}
        <TouchableOpacity style={styles.insightBanner} onPress={() => navigation.navigate('Analytics')} activeOpacity={0.85}>
          <Text style={styles.insightIcon}>{isPositive ? '✨' : '⚠️'}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.insightText}>
              {isPositive ? `Surplus of ${formatMoney(balance)} this month` : `Deficit of ${formatMoney(Math.abs(balance))} this month`}
            </Text>
            <Text style={styles.insightSub}>Savings rate {savingsRate}% · {fiscalExpenses.length} entries</Text>
          </View>
          <Text style={styles.insightArrow}>›</Text>
        </TouchableOpacity>

        {/* Quick actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.qaRow}>
            {[
              { lottie: 'expense', label: 'Add Expense', grad: ['#FEE2E2', '#FECACA'], to: () => navigation.navigate('AddExpense') },
              { lottie: 'income', label: 'Add Income', grad: ['#D1FAE5', '#A7F3D0'], to: () => navigation.navigate('Earnings') },
              { lottie: 'wallet', label: 'Wallets', grad: ['#EDE9FE', '#DDD6FE'], to: () => navigation.navigate('Wallet') },
              { lottie: 'analytics', label: 'Analytics', grad: ['#DBEAFE', '#BFDBFE'], to: () => navigation.navigate('Analytics') },
            ].map(qa => (
              <TouchableOpacity key={qa.label} style={styles.qaBtn} onPress={qa.to} activeOpacity={0.7}>
                <LinearGradient colors={qa.grad as any} style={styles.qaIconBg}>
                  <AnimatedIcon name={qa.lottie} size={34} emojiSize={26} />
                </LinearGradient>
                <Text style={styles.qaLabel}>{qa.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Wallets — premium per-wallet cards (horizontal) */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Wallets</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Wallet')}>
              <Text style={styles.seeAll}>Manage ›</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.liquidRow}>
            <Text style={styles.liquidLabel}>Total Liquid Assets</Text>
            <Text style={styles.liquidAmount}>{formatPKRCompact(totalLiquid)}</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingRight: 16 }}>
            {walletData.map(({ meta, pkr, docs }) => (
              <TouchableOpacity key={meta.id} activeOpacity={0.85} onPress={() => navigation.navigate('Wallet')}>
                <LinearGradient colors={meta.gradient as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.walletMini}>
                  <View style={styles.walletMiniTop}>
                    <View style={styles.walletMiniIcon}>
                      <AnimatedIcon name={meta.lottie} size={28} emojiSize={20} />
                    </View>
                    <Text style={styles.walletMiniName}>{meta.name}</Text>
                  </View>
                  <View style={styles.walletMiniInner}>
                    {meta.currencies.length === 1 ? (
                      <Text style={styles.walletMiniBal}>{formatMoney(docs[0]?.balance ?? 0, meta.currencies[0])}</Text>
                    ) : (
                      <>
                        {meta.currencies.map(c => {
                          const d = docs.find(x => x.currency === c);
                          return (
                            <Text key={c} style={styles.walletMiniMulti}>
                              {CURRENCIES[c].flag} {formatMoney(d?.balance ?? 0, c)}
                            </Text>
                          );
                        })}
                      </>
                    )}
                    <Text style={styles.walletMiniPkr}>≈ {formatPKRCompact(pkr)}</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Savings goals */}
        {savingsGoals.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Savings Goals</Text>
            </View>
            {savingsGoals.slice(0, 2).map(goal => {
              const pct = goal.targetAmount > 0 ? Math.min(goal.currentAmount / goal.targetAmount, 1) : 0;
              return (
                <View key={goal.id} style={styles.goalCard}>
                  <View style={styles.goalIconBubble}>
                    <AnimatedIcon name="goal" size={26} emojiSize={20} />
                  </View>
                  <View style={{ flex: 1, marginHorizontal: 12 }}>
                    <Text style={styles.goalName}>{goal.name}</Text>
                    <Text style={styles.goalSub}>{formatMoney(goal.currentAmount)} / {formatMoney(goal.targetAmount)}</Text>
                    <View style={styles.goalBarBg}><View style={[styles.goalBarFill, { width: `${pct * 100}%` as any }]} /></View>
                  </View>
                  <View style={styles.goalCircle}><Text style={styles.goalPct}>{Math.round(pct * 100)}%</Text></View>
                </View>
              );
            })}
          </View>
        )}

        {/* 5 latest transactions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Expenses')}>
              <Text style={styles.seeAll}>View All ›</Text>
            </TouchableOpacity>
          </View>
          {recent.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={{ fontSize: 40 }}>📭</Text>
              <Text style={styles.emptyText}>No transactions yet</Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={() => navigation.navigate('AddExpense')}>
                <Text style={styles.emptyBtnText}>Add your first expense</Text>
              </TouchableOpacity>
            </View>
          ) : (
            recent.map(exp => {
              const user = USERS.find(u => u.id === exp.enteredBy);
              return (
                <TouchableOpacity key={exp.id} style={styles.txRow}
                  onPress={() => navigation.navigate('AddExpense', { expenseId: exp.id })} activeOpacity={0.7}>
                  <View style={[styles.txIcon, { backgroundColor: (TYPE_COLORS[exp.type] ?? '#7C3AED') + '15' }]}>
                    <Text style={{ fontSize: 20 }}>{CATEGORY_EMOJI[exp.category] ?? '💰'}</Text>
                  </View>
                  <View style={styles.txInfo}>
                    <Text style={styles.txCategory}>{exp.category}</Text>
                    <Text style={styles.txMeta}>
                      {exp.type.charAt(0).toUpperCase() + exp.type.slice(1)}{user ? ` · ${user.name}` : ''} · {format(new Date(exp.date), 'dd MMM')}
                    </Text>
                  </View>
                  <View style={styles.txRight}>
                    <Text style={[styles.txAmount, { color: COLORS.danger }]}>-{formatMoney(exp.amount)}</Text>
                    {exp.status === 'pending' && <Text style={styles.txPending}>pending</Text>}
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* Monthly summary grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>This Month</Text>
          <View style={styles.summaryGrid}>
            <SummaryCard emoji="📈" bg="#F0FDF4" label="Income" color="#15803D" amt={formatMoney(totalIncome)} />
            <SummaryCard emoji="📉" bg="#FEF2F2" label="Expenses" color="#DC2626" amt={formatMoney(totalSpent)} />
            <SummaryCard emoji="💧" bg="#EFF6FF" label="Liquid Assets" color="#1D4ED8" amt={formatPKRCompact(totalLiquid)} />
            <SummaryCard emoji={isPositive ? '✅' : '⚠️'} bg={isPositive ? '#F0FDF4' : '#FEF2F2'}
              label={isPositive ? 'Surplus' : 'Deficit'} color={isPositive ? '#15803D' : '#DC2626'} amt={formatMoney(Math.abs(balance))} />
          </View>
        </View>
      </ScrollView>

      {/* Notifications modal */}
      <Modal visible={notifOpen} transparent animationType="slide" onRequestClose={() => setNotifOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.notifSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.notifHeader}>
              <Text style={styles.notifTitle}>Notifications</Text>
              <TouchableOpacity onPress={() => setNotifOpen(false)}><Text style={styles.notifClose}>Done</Text></TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 460 }} showsVerticalScrollIndicator={false}>
              {notifications.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={{ fontSize: 40 }}>🔔</Text>
                  <Text style={styles.emptyText}>You're all caught up</Text>
                </View>
              ) : notifications.map((n, i) => (
                <View key={i} style={styles.notifRow}>
                  <Text style={styles.notifRowIcon}>{n.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.notifRowTitle}>{n.title}</Text>
                    <Text style={styles.notifRowSub}>{n.sub}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function SummaryCard({ emoji, bg, label, color, amt }: { emoji: string; bg: string; label: string; color: string; amt: string }) {
  return (
    <View style={[styles.summaryCard, { backgroundColor: bg }]}>
      <Text style={styles.summaryEmoji}>{emoji}</Text>
      <Text style={[styles.summaryLabel, { color }]}>{label}</Text>
      <Text style={[styles.summaryAmt, { color }]}>{amt}</Text>
    </View>
  );
}

function actionEmoji(action: string): string {
  return action === 'add' ? '➕' : action === 'edit' ? '✏️' : action === 'delete' ? '🗑️'
    : action === 'approve' ? '✅' : action === 'reject' ? '❌' : '•';
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8FAFC' },
  headerGrad: { paddingBottom: 22, paddingHorizontal: 20 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, marginBottom: 18 },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)',
  },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 18 },
  greeting: { color: 'rgba(255,255,255,0.75)', fontSize: responsiveFontSize(12), fontWeight: '500' },
  userName: { color: '#fff', fontSize: responsiveFontSize(16), fontWeight: '800', marginTop: 1 },
  bellBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
  },
  bellBadge: {
    position: 'absolute', top: 4, right: 4, minWidth: 18, height: 18, borderRadius: 9,
    backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4,
  },
  bellBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  balanceSection: { alignItems: 'center', marginBottom: 20 },
  balanceLabel: { color: 'rgba(255,255,255,0.75)', fontSize: responsiveFontSize(13), fontWeight: '500', marginBottom: 6 },
  balanceAmount: { color: '#fff', fontSize: responsiveFontSize(36), fontWeight: '800', letterSpacing: -0.5 },
  balanceMetaRow: { flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap', justifyContent: 'center' },
  fiscalPill: {
    backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)',
  },
  fiscalPillText: { color: '#fff', fontSize: responsiveFontSize(11), fontWeight: '600' },
  moneyRow: {
    flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 18,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', paddingVertical: 14, paddingHorizontal: 16,
  },
  moneyCard: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  moneyDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 14 },
  moneyIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  moneyLabel: { color: 'rgba(255,255,255,0.7)', fontSize: responsiveFontSize(11), fontWeight: '500' },
  moneyAmount: { color: '#fff', fontSize: responsiveFontSize(14), fontWeight: '800', marginTop: 2 },

  content: { flex: 1, backgroundColor: '#F8FAFC' },
  insightBanner: {
    margin: 16, marginBottom: 4, backgroundColor: '#1E293B', borderRadius: 16,
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12,
  },
  insightIcon: { fontSize: 20 },
  insightText: { color: '#fff', fontSize: responsiveFontSize(13), fontWeight: '700' },
  insightSub: { color: '#94A3B8', fontSize: responsiveFontSize(11), fontWeight: '500', marginTop: 2 },
  insightArrow: { color: '#A78BFA', fontSize: 24, fontWeight: '300' },

  section: { paddingLeft: 16, marginTop: 20, paddingRight: 0 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingRight: 16 },
  sectionTitle: { fontSize: responsiveFontSize(16), fontWeight: '800', color: COLORS.text, marginBottom: 12, paddingRight: 16 },
  seeAll: { fontSize: responsiveFontSize(12), color: COLORS.primary, fontWeight: '700' },

  qaRow: { flexDirection: 'row', justifyContent: 'space-between', paddingRight: 16 },
  qaBtn: { alignItems: 'center', flex: 1 },
  qaIconBg: { width: 60, height: 60, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  qaLabel: { fontSize: responsiveFontSize(11), fontWeight: '600', color: COLORS.textMed, textAlign: 'center' },

  liquidRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingRight: 16, marginBottom: 12, marginTop: -4 },
  liquidLabel: { fontSize: responsiveFontSize(12), color: COLORS.textLight, fontWeight: '600' },
  liquidAmount: { fontSize: responsiveFontSize(15), color: COLORS.text, fontWeight: '800' },
  walletMini: { width: 168, borderRadius: 20, padding: 14, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  walletMiniTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  walletMiniIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },
  walletMiniName: { color: '#fff', fontSize: responsiveFontSize(14), fontWeight: '800' },
  walletMiniInner: { backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 14, padding: 12 },
  walletMiniBal: { fontSize: responsiveFontSize(16), fontWeight: '800', color: '#1E293B' },
  walletMiniMulti: { fontSize: responsiveFontSize(12), fontWeight: '700', color: '#334155', marginBottom: 3 },
  walletMiniPkr: { fontSize: responsiveFontSize(10), fontWeight: '600', color: '#7C3AED', marginTop: 4 },

  goalCard: {
    backgroundColor: COLORS.card, borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center',
    marginBottom: 10, marginRight: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  goalIconBubble: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#EDE9FE', alignItems: 'center', justifyContent: 'center' },
  goalName: { fontSize: responsiveFontSize(14), fontWeight: '700', color: COLORS.text },
  goalSub: { fontSize: responsiveFontSize(11), color: COLORS.textLight, fontWeight: '500', marginTop: 2, marginBottom: 8 },
  goalBarBg: { height: 6, backgroundColor: '#E2E8F0', borderRadius: 3 },
  goalBarFill: { height: 6, backgroundColor: COLORS.primary, borderRadius: 3 },
  goalCircle: { width: 50, height: 50, borderRadius: 25, borderWidth: 2.5, borderColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  goalPct: { fontSize: responsiveFontSize(12), fontWeight: '800', color: COLORS.primary },

  txRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, borderRadius: 14,
    padding: 13, marginBottom: 8, marginRight: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  txIcon: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  txInfo: { flex: 1 },
  txCategory: { fontSize: responsiveFontSize(14), fontWeight: '700', color: COLORS.text },
  txMeta: { fontSize: responsiveFontSize(11), color: COLORS.textLight, marginTop: 2, fontWeight: '500' },
  txRight: { alignItems: 'flex-end' },
  txAmount: { fontSize: responsiveFontSize(14), fontWeight: '800' },
  txPending: { fontSize: responsiveFontSize(9), color: COLORS.warning, fontWeight: '700', marginTop: 2 },

  emptyState: { alignItems: 'center', paddingVertical: 40, backgroundColor: COLORS.card, borderRadius: 16, marginRight: 16 },
  emptyText: { fontSize: responsiveFontSize(14), color: COLORS.textLight, fontWeight: '600', marginTop: 10, marginBottom: 16 },
  emptyBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: responsiveFontSize(13) },

  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingRight: 16 },
  summaryCard: { width: CARD_W, borderRadius: 14, padding: 14 },
  summaryEmoji: { fontSize: 22, marginBottom: 6 },
  summaryLabel: { fontSize: responsiveFontSize(11), fontWeight: '600', marginBottom: 4 },
  summaryAmt: { fontSize: responsiveFontSize(14), fontWeight: '800' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.5)', justifyContent: 'flex-end' },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#CBD5E1', alignSelf: 'center', marginVertical: 10 },
  notifSheet: { backgroundColor: '#F8FAFC', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingBottom: 30 },
  notifHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 12 },
  notifTitle: { fontSize: responsiveFontSize(18), fontWeight: '800', color: COLORS.text },
  notifClose: { fontSize: responsiveFontSize(14), color: COLORS.primary, fontWeight: '700' },
  notifRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 8, padding: 14, borderRadius: 14 },
  notifRowIcon: { fontSize: 22 },
  notifRowTitle: { fontSize: responsiveFontSize(13), fontWeight: '700', color: COLORS.text },
  notifRowSub: { fontSize: responsiveFontSize(11), color: COLORS.textLight, fontWeight: '500', marginTop: 2 },
});
