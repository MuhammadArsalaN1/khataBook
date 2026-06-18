import React, { useMemo, useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Dimensions, StatusBar, Modal, Share,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { format, subMonths, addMonths } from 'date-fns';
import { useStore } from '../../store/useStore';
import { COLORS, GRADIENTS, USERS, WALLETS, CURRENCIES, CATEGORY_EMOJI, TYPE_LABELS } from '../../constants';
import { ExpenseType } from '../../types';
import { responsiveFontSize } from '../../utils/responsive';
import { formatMoney, toPKR, formatPKRCompact } from '../../utils/currency';
import { getActiveFiscalMonth, getResetCountdown, Countdown } from '../../utils/fiscalMonth';
import { fundsSummary } from '../../utils/funds';
import AnimatedIcon from '../../components/common/AnimatedIcon';
import BrandMark from '../../components/common/BrandMark';

const W = Dimensions.get('window').width;
const CARD_W = (W - 44) / 2;

const TYPE_COLORS: Record<string, string> = { personal: '#1A1A1A', office: '#F5B700', farm: '#D99E00' };

function useCountdown(): Countdown {
  const [c, setC] = useState<Countdown>(() => getResetCountdown());
  useEffect(() => {
    const t = setInterval(() => setC(getResetCountdown()), 1000);
    return () => clearInterval(t);
  }, []);
  return c;
}

export default function DashboardScreenPremium() {
  const { expenses, incomes, currentUser, wallets, savingsGoals, activityLogs, exchangeRates, budgets, approveExpense, approveIncome, advances } = useStore();
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
      return d.getMonth() + 1 === month && d.getFullYear() === year && e.status !== 'rejected' && e.status !== 'pending';
    }),
    [expenses, month, year]
  );

  const totalSpent = useMemo(() => fiscalExpenses.reduce((s, e) => s + e.amount, 0), [fiscalExpenses]);
  const totalIncome = useMemo(
    () => incomes.filter((i: any) => i.month === month && i.year === year && i.status !== 'pending' && i.status !== 'rejected').reduce((s: number, i: any) => s + i.amount, 0),
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

  const funds = useMemo(() => fundsSummary(incomes, expenses, advances), [incomes, expenses, advances]);

  // 5 latest transactions, most recent first
  const recent = useMemo(
    () => [...expenses].sort((a, b) => {
      const t = new Date(b.date).getTime() - new Date(a.date).getTime();
      return t !== 0 ? t : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }).slice(0, 5),
    [expenses]
  );

  // Budget vs actual (per type, fiscal month)
  const budgetData = useMemo(() =>
    (['personal', 'office', 'farm'] as ExpenseType[]).map(t => {
      const b = budgets.find(x => x.type === t && x.month === month && x.year === year);
      const spent = fiscalExpenses.filter(e => e.type === t).reduce((s, e) => s + e.amount, 0);
      return { type: t, limit: b?.limit ?? 0, spent };
    }), [budgets, fiscalExpenses, month, year]);
  const hasBudgets = budgetData.some(b => b.limit > 0);

  // 6-month income vs expense trend + net worth trend
  const trend = useMemo(() => {
    const arr: { label: string; inc: number; exp: number; nw: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = subMonths(now, i);
      const m = d.getMonth() + 1, y = d.getFullYear();
      const exp = expenses.filter(e => { const dd = new Date(e.date); return dd.getMonth() + 1 === m && dd.getFullYear() === y && e.status !== 'rejected' && e.status !== 'pending'; }).reduce((s, e) => s + e.amount, 0);
      const inc = incomes.filter((x: any) => x.month === m && x.year === y && x.status !== 'pending' && x.status !== 'rejected').reduce((s: number, x: any) => s + x.amount, 0);
      const nw = wallets.filter(w => w.userId === currentUser?.id && w.month === m && w.year === y).reduce((s, w) => s + toPKR(w.balance, w.currency ?? 'PKR', exchangeRates), 0);
      arr.push({ label: format(d, 'MMM'), inc, exp, nw });
    }
    return arr;
  }, [expenses, incomes, wallets, currentUser, exchangeRates]);
  const trendMax = Math.max(...trend.flatMap(t => [t.inc, t.exp]), 1);
  const nwMax = Math.max(...trend.map(t => t.nw), 1);

  // Spending by person (fiscal month)
  const byPerson = useMemo(() =>
    USERS.map(u => ({ user: u, total: fiscalExpenses.filter(e => e.enteredBy === u.id).reduce((s, e) => s + e.amount, 0) })),
    [fiscalExpenses]);
  const personTotal = byPerson.reduce((s, p) => s + p.total, 0);

  // Recurring bills (distinct by category), flag if already logged this fiscal month
  const recurring = useMemo(() => {
    const map = new Map<string, any>();
    expenses.filter(e => e.isRecurring).forEach(e => { if (!map.has(e.category)) map.set(e.category, e); });
    return Array.from(map.values()).map(e => ({
      ...e,
      loggedThisMonth: fiscalExpenses.some(x => x.category === e.category),
    }));
  }, [expenses, fiscalExpenses]);

  const shareReport = async () => {
    const top = [...fiscalExpenses].sort((a, b) => b.amount - a.amount).slice(0, 5);
    let t = `📒 KHATA BOOK — ${fiscal.label}\n${'─'.repeat(28)}\n`;
    t += `Income:   ${formatMoney(totalIncome)}\n`;
    t += `Expenses: ${formatMoney(totalSpent)}\n`;
    t += `Balance:  ${formatMoney(balance)} ${isPositive ? '✅' : '⚠️'}\n`;
    t += `Liquid Assets: ${formatPKRCompact(totalLiquid)}\n\n`;
    t += `By person:\n`;
    byPerson.forEach(p => { t += `  • ${p.user.name}: ${formatMoney(p.total)}\n`; });
    t += `\nTop expenses:\n`;
    top.forEach(e => { t += `  • ${e.category}: ${formatMoney(e.amount)}\n`; });
    await Share.share({ message: t });
  };

  // Pending approvals (admin only) — expenses + incomes awaiting review
  const isAdmin = currentUser?.role === 'admin';
  const pendingExpenses = useMemo(() => expenses.filter(e => e.status === 'pending'), [expenses]);
  const pendingIncomes = useMemo(() => incomes.filter((i: any) => i.status === 'pending'), [incomes]);
  const pendingCount = pendingExpenses.length + pendingIncomes.length;

  const notifications = useMemo(() => {
    const items: { icon: string; title: string; sub: string; ts: string }[] = [];
    if (isAdmin && pendingCount > 0) {
      items.push({ icon: '⏳', title: `${pendingCount} entr${pendingCount > 1 ? 'ies' : 'y'} awaiting your approval`, sub: 'Review them in the Approvals card below', ts: '' });
    }
    if (countdown.days <= 2) {
      items.push({ icon: '🔄', title: 'Fiscal month resets soon', sub: `Dashboard rolls over in ${countdown.days}d ${countdown.hours}h`, ts: '' });
    }
    activityLogs.slice(0, 10).forEach(l =>
      items.push({ icon: actionEmoji(l.action), title: l.details, sub: `${l.userName} · ${format(new Date(l.timestamp), 'dd MMM, hh:mm a')}`, ts: l.timestamp })
    );
    return items;
  }, [activityLogs, pendingCount, isAdmin, countdown]);
  const notifBadge = (isAdmin ? pendingCount : 0) + (countdown.days <= 2 ? 1 : 0);

  const greeting = now.getHours() < 12 ? 'Good Morning' : now.getHours() < 17 ? 'Good Afternoon' : 'Good Evening';

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      <LinearGradient colors={GRADIENTS.header as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.headerGrad}>
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
            <Text style={styles.balanceLabel}>{isPositive ? 'Available Balance' : 'Negative Balance'}</Text>
            <Text style={[styles.balanceAmount, !isPositive && styles.balanceNegative]}>
              {isPositive ? '' : '− '}{formatMoney(Math.abs(balance))}
            </Text>
            {!isPositive && (
              <Text style={styles.overBudgetNote}>Expenses exceed income by {formatMoney(Math.abs(balance))}</Text>
            )}
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
              <View style={[styles.moneyIcon, { backgroundColor: 'rgba(245,183,0,0.28)' }]}>
                <AnimatedIcon name="income" size={26} emojiSize={18} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.moneyLabel}>Income</Text>
                <Text style={styles.moneyAmount}>{formatMoney(totalIncome)}</Text>
              </View>
            </View>
            <View style={styles.moneyDivider} />
            <View style={styles.moneyCard}>
              <View style={[styles.moneyIcon, { backgroundColor: 'rgba(26,26,26,0.1)' }]}>
                <AnimatedIcon name="expense" size={26} emojiSize={18} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.moneyLabel}>Expenses</Text>
                <Text style={[styles.moneyAmount, { color: '#1A1A1A' }]}>{formatMoney(totalSpent)}</Text>
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

        {/* Pending Approvals (admin only) */}
        {isAdmin && pendingCount > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>⏳ Pending Approvals</Text>
              <View style={styles.approvalBadge}><Text style={styles.approvalBadgeText}>{pendingCount}</Text></View>
            </View>
            {pendingExpenses.map(e => {
              const u = USERS.find(x => x.id === e.enteredBy);
              return (
                <View key={e.id} style={styles.approvalCard}>
                  <View style={styles.approvalInfo}>
                    <Text style={styles.approvalTitle}>{CATEGORY_EMOJI[e.category] ?? '💰'} {e.category} · {formatMoney(e.amount)}</Text>
                    <Text style={styles.approvalSub}>Expense · {e.type} · by {u?.name ?? '—'}</Text>
                  </View>
                  <View style={styles.approvalActions}>
                    <TouchableOpacity style={[styles.apBtn, styles.apReject]} onPress={() => approveExpense(e.id, 'rejected')}>
                      <Text style={styles.apRejectText}>✕</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.apBtn, styles.apApprove]} onPress={() => approveExpense(e.id, 'approved')}>
                      <Text style={styles.apApproveText}>✓ Approve</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
            {pendingIncomes.map((i: any) => {
              const u = USERS.find(x => x.id === i.enteredBy);
              return (
                <View key={i.id} style={styles.approvalCard}>
                  <View style={styles.approvalInfo}>
                    <Text style={styles.approvalTitle}>🪙 {i.type} income · {formatMoney(i.amount)}</Text>
                    <Text style={styles.approvalSub}>Income · by {u?.name ?? '—'}</Text>
                  </View>
                  <View style={styles.approvalActions}>
                    <TouchableOpacity style={[styles.apBtn, styles.apReject]} onPress={() => approveIncome(i.id, 'rejected')}>
                      <Text style={styles.apRejectText}>✕</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.apBtn, styles.apApprove]} onPress={() => approveIncome(i.id, 'approved')}>
                      <Text style={styles.apApproveText}>✓ Approve</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Quick actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.qaRow}>
            {[
              { lottie: 'expense', label: 'Add Expense', grad: ['#F5F5F0', '#ECECE6'], to: () => navigation.navigate('AddExpense') },
              { lottie: 'income', label: 'Add Income', grad: ['#FEF3C7', '#FEF3C7'], to: () => navigation.navigate('Earnings') },
              { lottie: 'wallet', label: 'Wallets', grad: ['#FEF3C7', '#FDE68A'], to: () => navigation.navigate('Wallet') },
              { lottie: 'analytics', label: 'Analytics', grad: ['#FEF9C3', '#FDE047'], to: () => navigation.navigate('Analytics') },
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

        {/* Funds & Advances */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Funds & Advances</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Funds')}>
              <Text style={styles.seeAll}>Manage ›</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.fundsCard} activeOpacity={0.85} onPress={() => navigation.navigate('Funds')}>
            <View style={styles.fundsTop}>
              <View>
                <Text style={styles.fundsMainLabel}>Main Balance</Text>
                <Text style={styles.fundsMainAmt}>
                  {funds.mainBalance < 0 ? '− ' : ''}{formatMoney(Math.abs(funds.mainBalance))}
                </Text>
              </View>
              <View style={styles.fundsActivePill}>
                <Text style={styles.fundsActivePillText}>{funds.activeCount} active</Text>
              </View>
            </View>
            <View style={styles.fundsStatRow}>
              <View style={styles.fundsStat}><Text style={styles.fundsStatLabel}>Given out</Text><Text style={styles.fundsStatVal}>{formatPKRCompact(funds.totalGiven)}</Text></View>
              <View style={styles.fundsStat}><Text style={styles.fundsStatLabel}>Received</Text><Text style={styles.fundsStatVal}>{formatPKRCompact(funds.totalReceived)}</Text></View>
              <View style={styles.fundsStat}><Text style={styles.fundsStatLabel}>Outstanding</Text><Text style={styles.fundsStatVal}>{formatPKRCompact(funds.outstanding)}</Text></View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Budget vs Actual */}
        {hasBudgets && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Budget vs Actual</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
                <Text style={styles.seeAll}>Edit ›</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.plainCard}>
              {budgetData.filter(b => b.limit > 0).map(b => {
                const pct = b.limit > 0 ? b.spent / b.limit : 0;
                const over = pct > 1;
                const barColor = over ? COLORS.danger : pct > 0.8 ? COLORS.warning : COLORS.success;
                return (
                  <View key={b.type} style={styles.budgetRow}>
                    <View style={styles.budgetTop}>
                      <Text style={styles.budgetType}>{TYPE_LABELS[b.type]}</Text>
                      <Text style={[styles.budgetNums, over && { color: COLORS.danger }]}>
                        {formatMoney(b.spent)} / {formatMoney(b.limit)}
                      </Text>
                    </View>
                    <View style={styles.budgetBarBg}>
                      <View style={[styles.budgetBarFill, { width: `${Math.min(pct, 1) * 100}%` as any, backgroundColor: barColor }]} />
                    </View>
                    {over && <Text style={styles.budgetOver}>⚠️ Over by {formatMoney(b.spent - b.limit)}</Text>}
                  </View>
                );
              })}
            </View>
          </View>
        )}

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
                    {meta.brand === 'cash' || meta.brand === 'bank'
                      ? <Text style={styles.walletMiniName}>{meta.name}</Text>
                      : <BrandMark brand={meta.brand} size={15} />}
                  </View>
                  <View style={styles.walletMiniInner}>
                    {meta.currencies.length === 1 ? (
                      <Text style={styles.walletMiniBal}>
                        {formatMoney(docs.reduce((s, x) => s + x.balance, 0), meta.currencies[0])}
                      </Text>
                    ) : (
                      <>
                        {meta.currencies.map(c => {
                          const sum = docs.filter(x => x.currency === c).reduce((s, x) => s + x.balance, 0);
                          return (
                            <Text key={c} style={styles.walletMiniMulti}>
                              {CURRENCIES[c].flag} {formatMoney(sum, c)}
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

        {/* 6-month income vs expense trend */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6-Month Trend</Text>
          <View style={styles.plainCard}>
            <View style={styles.legendRow}>
              <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#D99E00' }]} /><Text style={styles.legendText}>Income</Text></View>
              <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#1A1A1A' }]} /><Text style={styles.legendText}>Expense</Text></View>
            </View>
            <View style={styles.trendChart}>
              {trend.map((t, i) => (
                <View key={i} style={styles.trendCol}>
                  <View style={styles.trendBars}>
                    <View style={[styles.trendBar, { height: Math.max((t.inc / trendMax) * 90, 2), backgroundColor: '#D99E00' }]} />
                    <View style={[styles.trendBar, { height: Math.max((t.exp / trendMax) * 90, 2), backgroundColor: '#1A1A1A' }]} />
                  </View>
                  <Text style={styles.trendLabel}>{t.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Net worth trend */}
        {nwMax > 1 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Net Worth (Liquid, PKR)</Text>
            <View style={styles.plainCard}>
              <Text style={styles.nwCurrent}>{formatPKRCompact(trend[trend.length - 1].nw)}</Text>
              <View style={styles.trendChart}>
                {trend.map((t, i) => (
                  <View key={i} style={styles.trendCol}>
                    <View style={[styles.nwBar, { height: Math.max((t.nw / nwMax) * 80, 2) }]} />
                    <Text style={styles.trendLabel}>{t.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Spending by person */}
        {personTotal > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Spending by Person</Text>
            <View style={styles.plainCard}>
              {byPerson.map(p => {
                const pct = personTotal > 0 ? p.total / personTotal : 0;
                const color = p.user.role === 'admin' ? COLORS.primary : COLORS.secondary;
                return (
                  <View key={p.user.id} style={styles.budgetRow}>
                    <View style={styles.budgetTop}>
                      <Text style={styles.budgetType}>{p.user.name}</Text>
                      <Text style={styles.budgetNums}>{formatMoney(p.total)} · {Math.round(pct * 100)}%</Text>
                    </View>
                    <View style={styles.budgetBarBg}>
                      <View style={[styles.budgetBarFill, { width: `${pct * 100}%` as any, backgroundColor: color }]} />
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Savings goals */}
        {savingsGoals.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Savings Goals</Text>
            </View>
            {savingsGoals.slice(0, 2).map(goal => {
              const pct = goal.targetAmount > 0 ? Math.min(goal.currentAmount / goal.targetAmount, 1) : 0;
              const remaining = goal.targetAmount - goal.currentAmount;
              const monthlySurplus = balance > 0 ? balance : 0;
              const monthsLeft = monthlySurplus > 0 && remaining > 0 ? Math.ceil(remaining / monthlySurplus) : null;
              const projection = pct >= 1 ? '🎉 Goal reached!'
                : monthsLeft ? `At current pace: ~${format(addMonths(now, monthsLeft), 'MMM yyyy')}`
                : 'Add monthly surplus to project';
              return (
                <View key={goal.id} style={styles.goalCard}>
                  <View style={styles.goalIconBubble}>
                    <AnimatedIcon name="goal" size={26} emojiSize={20} />
                  </View>
                  <View style={{ flex: 1, marginHorizontal: 12 }}>
                    <Text style={styles.goalName}>{goal.name}</Text>
                    <Text style={styles.goalSub}>{formatMoney(goal.currentAmount)} / {formatMoney(goal.targetAmount)}</Text>
                    <View style={styles.goalBarBg}><View style={[styles.goalBarFill, { width: `${pct * 100}%` as any }]} /></View>
                    <Text style={styles.goalProjection}>🔮 {projection}</Text>
                  </View>
                  <View style={styles.goalCircle}><Text style={styles.goalPct}>{Math.round(pct * 100)}%</Text></View>
                </View>
              );
            })}
          </View>
        )}

        {/* Recurring bills due */}
        {recurring.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recurring Bills · {fiscal.label}</Text>
            <View style={styles.plainCard}>
              {recurring.map((r, i) => (
                <View key={r.category + i} style={[styles.recurRow, i < recurring.length - 1 && styles.recurRowBorder]}>
                  <Text style={{ fontSize: 18 }}>{CATEGORY_EMOJI[r.category] ?? '🔁'}</Text>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.recurName}>{r.category}</Text>
                    <Text style={styles.recurAmt}>{formatMoney(r.amount)}</Text>
                  </View>
                  {r.loggedThisMonth ? (
                    <View style={styles.recurPaid}><Text style={styles.recurPaidText}>✓ Paid</Text></View>
                  ) : (
                    <TouchableOpacity style={styles.recurDue} onPress={() => navigation.navigate('AddExpense')}>
                      <Text style={styles.recurDueText}>Due · Add</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
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
                  <View style={[styles.txIcon, { backgroundColor: (TYPE_COLORS[exp.type] ?? COLORS.primary) + '15' }]}>
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
            <SummaryCard emoji="📈" bg="#FFFDF5" label="Income" color="#D99E00" amt={formatMoney(totalIncome)} />
            <SummaryCard emoji="📉" bg="#F5F5F0" label="Expenses" color="#1A1A1A" amt={formatMoney(totalSpent)} />
            <SummaryCard emoji="💧" bg="#FFFDF5" label="Liquid Assets" color="#1A1A1A" amt={formatPKRCompact(totalLiquid)} />
            <SummaryCard emoji={isPositive ? '✅' : '⚠️'} bg={isPositive ? '#FFFDF5' : '#F5F5F0'}
              label={isPositive ? 'Surplus' : 'Deficit'} color={isPositive ? '#D99E00' : '#1A1A1A'} amt={formatMoney(Math.abs(balance))} />
          </View>

          {/* Share report */}
          <TouchableOpacity style={styles.shareBtn} onPress={shareReport} activeOpacity={0.85}>
            <Text style={styles.shareBtnText}>📤  Share {fiscal.label} Report</Text>
          </TouchableOpacity>
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
  root: { flex: 1, backgroundColor: COLORS.background },
  headerGrad: { paddingBottom: 22, paddingHorizontal: 20 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, marginBottom: 18 },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(26,26,26,0.85)',
    alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)',
  },
  avatarText: { color: COLORS.accent, fontWeight: '800', fontSize: 18 },
  greeting: { color: 'rgba(26,26,26,0.65)', fontSize: responsiveFontSize(12), fontWeight: '600' },
  userName: { color: '#1A1A1A', fontSize: responsiveFontSize(16), fontWeight: '800', marginTop: 1 },
  bellBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(26,26,26,0.1)',
  },
  bellBadge: {
    position: 'absolute', top: 4, right: 4, minWidth: 18, height: 18, borderRadius: 9,
    backgroundColor: '#1A1A1A', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4,
  },
  bellBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  balanceSection: { alignItems: 'center', marginBottom: 20 },
  balanceLabel: { color: 'rgba(26,26,26,0.65)', fontSize: responsiveFontSize(13), fontWeight: '600', marginBottom: 6 },
  balanceAmount: { color: '#1A1A1A', fontSize: responsiveFontSize(36), fontWeight: '800', letterSpacing: -0.5 },
  balanceNegative: { color: '#1A1A1A' },
  overBudgetNote: { color: '#1A1A1A', fontSize: responsiveFontSize(11), fontWeight: '700', marginTop: 4, backgroundColor: 'rgba(255,255,255,0.6)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, overflow: 'hidden' },
  balanceMetaRow: { flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap', justifyContent: 'center' },
  fiscalPill: {
    backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1, borderColor: 'rgba(26,26,26,0.08)',
  },
  fiscalPillText: { color: '#1A1A1A', fontSize: responsiveFontSize(11), fontWeight: '700' },
  moneyRow: {
    flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 18,
    borderWidth: 1, borderColor: 'rgba(26,26,26,0.06)', paddingVertical: 14, paddingHorizontal: 16,
  },
  moneyCard: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  moneyDivider: { width: 1, backgroundColor: 'rgba(26,26,26,0.12)', marginHorizontal: 14 },
  moneyIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  moneyLabel: { color: 'rgba(26,26,26,0.6)', fontSize: responsiveFontSize(11), fontWeight: '600' },
  moneyAmount: { color: '#1A1A1A', fontSize: responsiveFontSize(14), fontWeight: '800', marginTop: 2 },

  content: { flex: 1, backgroundColor: COLORS.background },
  insightBanner: {
    margin: 16, marginBottom: 4, backgroundColor: '#1A1A1A', borderRadius: 16,
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12,
  },
  insightIcon: { fontSize: 20 },
  insightText: { color: '#fff', fontSize: responsiveFontSize(13), fontWeight: '700' },
  insightSub: { color: '#9C9C95', fontSize: responsiveFontSize(11), fontWeight: '500', marginTop: 2 },
  insightArrow: { color: COLORS.accent, fontSize: 24, fontWeight: '300' },

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
  walletMiniBal: { fontSize: responsiveFontSize(16), fontWeight: '800', color: '#1A1A1A' },
  walletMiniMulti: { fontSize: responsiveFontSize(12), fontWeight: '700', color: '#52525B', marginBottom: 3 },
  walletMiniPkr: { fontSize: responsiveFontSize(10), fontWeight: '700', color: COLORS.accentDark, marginTop: 4 },

  goalCard: {
    backgroundColor: COLORS.card, borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center',
    marginBottom: 10, marginRight: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  goalIconBubble: { width: 44, height: 44, borderRadius: 14, backgroundColor: COLORS.accentSoft, alignItems: 'center', justifyContent: 'center' },
  goalName: { fontSize: responsiveFontSize(14), fontWeight: '700', color: COLORS.text },
  goalSub: { fontSize: responsiveFontSize(11), color: COLORS.textLight, fontWeight: '500', marginTop: 2, marginBottom: 8 },
  goalBarBg: { height: 6, backgroundColor: '#ECECE6', borderRadius: 3 },
  goalBarFill: { height: 6, backgroundColor: COLORS.accent, borderRadius: 3 },
  goalCircle: { width: 50, height: 50, borderRadius: 25, borderWidth: 2.5, borderColor: COLORS.accent, alignItems: 'center', justifyContent: 'center' },
  goalPct: { fontSize: responsiveFontSize(12), fontWeight: '800', color: COLORS.accentDark },

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

  modalOverlay: { flex: 1, backgroundColor: 'rgba(26,26,26,0.55)', justifyContent: 'flex-end' },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#ECECE6', alignSelf: 'center', marginVertical: 10 },
  notifSheet: { backgroundColor: '#FAFAF7', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingBottom: 30 },
  notifHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 12 },
  notifTitle: { fontSize: responsiveFontSize(18), fontWeight: '800', color: COLORS.text },
  notifClose: { fontSize: responsiveFontSize(14), color: COLORS.primary, fontWeight: '700' },
  notifRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 8, padding: 14, borderRadius: 14 },
  notifRowIcon: { fontSize: 22 },
  notifRowTitle: { fontSize: responsiveFontSize(13), fontWeight: '700', color: COLORS.text },
  notifRowSub: { fontSize: responsiveFontSize(11), color: COLORS.textLight, fontWeight: '500', marginTop: 2 },

  plainCard: { backgroundColor: COLORS.card, borderRadius: 16, padding: 16, marginRight: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 1 },
  budgetRow: { marginBottom: 14 },
  budgetTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  budgetType: { fontSize: responsiveFontSize(13), fontWeight: '700', color: COLORS.text },
  budgetNums: { fontSize: responsiveFontSize(12), fontWeight: '600', color: COLORS.textMed },
  budgetBarBg: { height: 8, backgroundColor: '#F5F5F0', borderRadius: 4, overflow: 'hidden' },
  budgetBarFill: { height: 8, borderRadius: 4 },
  budgetOver: { fontSize: responsiveFontSize(10), color: COLORS.danger, fontWeight: '700', marginTop: 4 },

  legendRow: { flexDirection: 'row', gap: 16, marginBottom: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: responsiveFontSize(11), color: COLORS.textLight, fontWeight: '600' },
  trendChart: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 110 },
  trendCol: { flex: 1, alignItems: 'center' },
  trendBars: { flexDirection: 'row', gap: 3, alignItems: 'flex-end', height: 92 },
  trendBar: { width: 9, borderTopLeftRadius: 3, borderTopRightRadius: 3 },
  trendLabel: { fontSize: 9, color: COLORS.textLight, fontWeight: '600', marginTop: 5 },
  nwCurrent: { fontSize: responsiveFontSize(20), fontWeight: '800', color: COLORS.accentDark, marginBottom: 12 },
  nwBar: { width: 16, borderTopLeftRadius: 4, borderTopRightRadius: 4, backgroundColor: COLORS.accent },
  goalProjection: { fontSize: responsiveFontSize(10), color: COLORS.primary, fontWeight: '600', marginTop: 6 },

  recurRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 11 },
  recurRowBorder: { borderBottomWidth: 1, borderBottomColor: '#F5F5F0' },
  recurName: { fontSize: responsiveFontSize(13), fontWeight: '700', color: COLORS.text },
  recurAmt: { fontSize: responsiveFontSize(11), color: COLORS.textLight, fontWeight: '600', marginTop: 1 },
  recurPaid: { backgroundColor: '#FEF3C7', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  recurPaidText: { fontSize: responsiveFontSize(11), color: '#D99E00', fontWeight: '700' },
  recurDue: { backgroundColor: COLORS.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  recurDueText: { fontSize: responsiveFontSize(11), color: '#fff', fontWeight: '700' },

  shareBtn: { marginTop: 14, marginRight: 16, backgroundColor: '#1A1A1A', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  shareBtnText: { color: '#fff', fontSize: responsiveFontSize(14), fontWeight: '700' },

  fundsCard: { backgroundColor: COLORS.card, borderRadius: 16, padding: 16, marginRight: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  fundsTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  fundsMainLabel: { fontSize: responsiveFontSize(12), color: COLORS.textLight, fontWeight: '600' },
  fundsMainAmt: { fontSize: responsiveFontSize(22), color: COLORS.text, fontWeight: '800', marginTop: 2 },
  fundsActivePill: { backgroundColor: COLORS.accentSoft, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6 },
  fundsActivePillText: { fontSize: responsiveFontSize(11), color: COLORS.accentDark, fontWeight: '700' },
  fundsStatRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: COLORS.divider, paddingTop: 12 },
  fundsStat: { alignItems: 'flex-start' },
  fundsStatLabel: { fontSize: responsiveFontSize(10), color: COLORS.textLight, fontWeight: '600' },
  fundsStatVal: { fontSize: responsiveFontSize(13), color: COLORS.text, fontWeight: '800', marginTop: 2 },
  approvalBadge: { backgroundColor: COLORS.accent, borderRadius: 12, minWidth: 24, paddingHorizontal: 8, paddingVertical: 2, alignItems: 'center' },
  approvalBadgeText: { color: '#1A1A1A', fontWeight: '800', fontSize: responsiveFontSize(12) },
  approvalCard: { backgroundColor: COLORS.card, borderRadius: 14, padding: 14, marginBottom: 10, marginRight: 16, borderLeftWidth: 4, borderLeftColor: COLORS.accent, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 1 },
  approvalInfo: { marginBottom: 10 },
  approvalTitle: { fontSize: responsiveFontSize(14), fontWeight: '700', color: COLORS.text },
  approvalSub: { fontSize: responsiveFontSize(11), color: COLORS.textLight, fontWeight: '500', marginTop: 2 },
  approvalActions: { flexDirection: 'row', gap: 8 },
  apBtn: { flex: 1, paddingVertical: 9, borderRadius: 10, alignItems: 'center' },
  apReject: { backgroundColor: '#F5F5F0', flex: 0, paddingHorizontal: 16 },
  apRejectText: { color: '#1A1A1A', fontWeight: '800', fontSize: responsiveFontSize(13) },
  apApprove: { backgroundColor: COLORS.accent },
  apApproveText: { color: '#1A1A1A', fontWeight: '800', fontSize: responsiveFontSize(13) },
});
