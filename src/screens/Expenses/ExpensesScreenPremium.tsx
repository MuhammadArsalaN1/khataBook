import React, { useState, useMemo } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, Alert, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { format } from 'date-fns';
import { useStore } from '../../store/useStore';
import { COLORS, TYPE_COLORS, TYPE_LABELS, USERS, CATEGORY_EMOJI } from '../../constants';
import { Expense, ExpenseType, ExpenseStatus } from '../../types';
import { responsiveFontSize } from '../../utils/responsive';
import { formatMoney } from '../../utils/currency';
import { getActiveFiscalMonth } from '../../utils/fiscalMonth';
import DonutChart from '../../components/charts/DonutChart';
import DrillDownModal from '../../components/common/DrillDownModal';

const STATUS_COLORS: Record<ExpenseStatus, string> = {
  draft: COLORS.textLight, pending: COLORS.warning, approved: COLORS.success, rejected: COLORS.danger,
};
const CAT_PALETTE = COLORS.chart;

export default function ExpensesScreenPremium() {
  const { expenses = [], currentUser, deleteExpense, approveExpense, advances = [], advanceBalanceEntries = [], syncData, dataLoading } = useStore();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const fiscal = getActiveFiscalMonth();
  const [view, setView] = useState<'charts' | 'entries'>('entries');
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await syncData?.();
    setRefreshing(false);
  };

  const [scope, setScope] = useState<'month' | 'all'>('month');
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<ExpenseType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<ExpenseStatus | 'all'>(route?.params?.filter ?? 'all');
  const [drill, setDrill] = useState<{ title: string; color: string; entries: Expense[] } | null>(null);

  // Scope expenses to active fiscal month (resets monthly) or all-time
  const scoped = useMemo(() => {
    if (!expenses || !Array.isArray(expenses) || expenses.length === 0) return [];
    if (scope === 'all') return expenses;
    return expenses.filter(e => {
      if (!e?.date) return false;
      const d = new Date(e.date);
      return d.getMonth() + 1 === fiscal.month && d.getFullYear() === fiscal.year;
    });
  }, [expenses, scope, fiscal.month, fiscal.year]);

  // Get advances for current user
  const userAdvances = useMemo(() => {
    if (!Array.isArray(advanceBalanceEntries)) return [];
    return advanceBalanceEntries.filter(
      e => e?.giverEmail === currentUser?.email || e?.receiverEmail === currentUser?.email
    );
  }, [advanceBalanceEntries, currentUser]);

  // Count entries by status (must be after scoped definition)
  const statusCounts = useMemo(() => ({
    draft: (scoped || []).filter(e => e?.status === 'draft').length,
    pending: (scoped || []).filter(e => e?.status === 'pending').length,
    approved: (scoped || []).filter(e => e?.status === 'approved').length,
    rejected: (scoped || []).filter(e => e?.status === 'rejected').length,
  }), [scoped]);

  const filtered = useMemo(() => {
    if (!Array.isArray(scoped) || scoped.length === 0) return [];
    return scoped
      .filter(e => !e || filterType === 'all' || e?.type === filterType)
      .filter(e => !e || filterStatus === 'all' || e?.status === filterStatus)
      .filter(e => !e || !search ||
        (e?.category || '').toLowerCase().includes(search.toLowerCase()) ||
        (e?.notes || '').toLowerCase().includes(search.toLowerCase()) ||
        (e?.amount || 0).toString().includes(search))
      .sort((a, b) => {
        if (!a?.date || !b?.date) return 0;
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
  }, [scoped, filterType, filterStatus, search]);

  // Chart data (uses scoped, excludes rejected)
  const valid = useMemo(() => {
    if (!Array.isArray(scoped)) return [];
    return scoped.filter(e => e?.status !== 'rejected' && e?.status !== 'pending');
  }, [scoped]);
  const total = useMemo(() => (valid || []).reduce((s, e) => s + (e?.amount || 0), 0), [valid]);
  const byType = useMemo(() => ({
    personal: (valid || []).filter(e => e?.type === 'personal').reduce((s, e) => s + (e?.amount || 0), 0),
    office: (valid || []).filter(e => e?.type === 'office').reduce((s, e) => s + (e?.amount || 0), 0),
    farm: (valid || []).filter(e => e?.type === 'farm').reduce((s, e) => s + (e?.amount || 0), 0),
  }), [valid]);
  const byCategory = useMemo(() => {
    const m: Record<string, number> = {};
    (valid || []).forEach(e => {
      if (e?.category) m[e.category] = (m[e.category] ?? 0) + (e?.amount || 0);
    });
    return Object.entries(m).map(([category, amount]) => ({ category, amount })).sort((a, b) => b.amount - a.amount).slice(0, 8);
  }, [valid]);

  const handleDelete = (e: Expense) => {
    if (e.status === 'approved' && currentUser?.role !== 'admin') { Alert.alert('Locked', 'Approved entries cannot be deleted.'); return; }
    Alert.alert('Delete', 'Delete this expense?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteExpense(e.id) },
    ]);
  };
  const handleApprove = (e: Expense, status: 'approved' | 'rejected') => {
    Alert.alert(status === 'approved' ? 'Approve' : 'Reject', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: status === 'approved' ? 'Approve' : 'Reject', onPress: () => approveExpense(e.id, status) },
    ]);
  };

  const renderItem = ({ item }: { item: Expense }) => {
    if (!item || !item.id) return null;
    const user = USERS.find(u => u.id === item?.enteredBy);
    const canEdit = currentUser?.role === 'admin' || (item?.enteredBy === currentUser?.id && item?.status !== 'approved');
    const itemType = item?.type || 'personal';
    const itemStatus = item?.status || 'draft';
    const itemAmount = item?.amount || 0;
    const itemDate = item?.date || new Date().toISOString();
    const itemCategory = item?.category || 'Uncategorized';
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={[styles.typeIcon, { backgroundColor: (TYPE_COLORS[itemType] || '#ccc') + '15' }]}>
            <Text style={{ fontSize: 20 }}>{CATEGORY_EMOJI[itemCategory] ?? '💰'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardCategory}>{itemCategory}</Text>
            <Text style={styles.cardMeta}>{TYPE_LABELS[itemType] || 'Unknown'} · {user?.name || 'Unknown'} · {format(new Date(itemDate), 'dd MMM')}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.cardAmount}>{formatMoney(itemAmount)}</Text>
            <View style={[styles.statusBadge, { backgroundColor: (STATUS_COLORS[itemStatus] || '#ccc') + '20' }]}>
              <Text style={[styles.statusText, { color: STATUS_COLORS[itemStatus] || '#ccc' }]}>{itemStatus}</Text>
            </View>
          </View>
        </View>
        {item?.source === 'advance' && item?.advanceEntryId ? (
          <Text style={styles.sourceBadge}>
            🤝 From {advanceBalanceEntries?.find(a => a?.id === item.advanceEntryId)?.giverName ?? 'advance'}
          </Text>
        ) : item?.advanceId ? (
          <Text style={styles.sourceBadge}>
            🤝 From {advances?.find(a => a?.id === item.advanceId)?.person ?? 'advance'}
          </Text>
        ) : null}
        {item?.notes ? <Text style={styles.cardNotes}>📝 {item.notes}</Text> : null}
        {(canEdit || (currentUser?.role === 'admin' && item?.status === 'pending')) && (
          <View style={styles.actions}>
            {canEdit && (
              <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('AddExpense', { expenseId: item.id })}>
                <Text style={[styles.actionText, { color: COLORS.primary }]}>✏️ Edit</Text>
              </TouchableOpacity>
            )}
            {canEdit && (
              <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(item)}>
                <Text style={[styles.actionText, { color: COLORS.danger }]}>🗑️ Delete</Text>
              </TouchableOpacity>
            )}
            {currentUser?.role === 'admin' && item.status === 'pending' && (
              <>
                <TouchableOpacity style={styles.actionBtn} onPress={() => handleApprove(item, 'approved')}>
                  <Text style={[styles.actionText, { color: COLORS.success }]}>✓ Approve</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={() => handleApprove(item, 'rejected')}>
                  <Text style={[styles.actionText, { color: COLORS.danger }]}>✕ Reject</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
      </View>
    );
  };

  const Header = (
    <View>
      {/* Advances Section */}
      {userAdvances && userAdvances.length > 0 && (
        <View style={styles.advancesSection}>
          <Text style={styles.advancesSectionTitle}>💰 Advances</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingRight: 16 }}>
            {userAdvances.map(adv => {
              const isGiver = adv?.giverEmail === currentUser?.email;
              const otherPerson = isGiver ? adv?.receiverName : adv?.giverName;
              const settlementPercent = adv?.amount > 0 ? Math.round(((adv?.returnedAmount || 0) / adv?.amount) * 100) : 0;
              return (
                <View key={adv?.id} style={styles.advanceCard}>
                  <View style={styles.advanceCardHeader}>
                    <Text style={styles.advanceCardEmoji}>{isGiver ? '📤' : '📥'}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.advanceCardTo}>{isGiver ? 'To' : 'From'}: {otherPerson}</Text>
                      <Text style={styles.advanceCardAmount}>{formatMoney(adv?.amount || 0)}</Text>
                    </View>
                  </View>
                  <View style={styles.advanceProgressBar}>
                    <View style={[styles.advanceProgressFill, { width: `${settlementPercent}%` }]} />
                  </View>
                  <Text style={styles.advanceProgressText}>{settlementPercent}% {adv?.status === 'settled' ? '✓' : 'pending'}</Text>
                </View>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Scope toggle */}
      <View style={styles.scopeRow}>
        {(['month', 'all'] as const).map(s => (
          <TouchableOpacity key={s} style={[styles.scopeBtn, scope === s && styles.scopeBtnActive]} onPress={() => setScope(s)}>
            <Text style={[styles.scopeText, scope === s && styles.scopeTextActive]}>
              {s === 'month' ? fiscal.label : 'All Time'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {view === 'charts' ? (
        <>
          {/* Donut by type */}
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>By Type</Text>
            <Text style={styles.chartHint}>Tap a row to see day-by-day detail</Text>
            <View style={styles.donutRow}>
              <DonutChart
                size={140} strokeWidth={24}
                data={[
                  { label: 'Personal', value: byType.personal, color: TYPE_COLORS.personal },
                  { label: 'Office', value: byType.office, color: TYPE_COLORS.office },
                  { label: 'Farm', value: byType.farm, color: TYPE_COLORS.farm },
                ]}
                centerLabel={total >= 1000 ? `${(total / 1000).toFixed(1)}k` : `${total}`}
                centerSub="total"
              />
              <View style={styles.legend}>
                {(['personal', 'office', 'farm'] as ExpenseType[]).map(t => (
                  <TouchableOpacity key={t} style={styles.legendRow} activeOpacity={0.6}
                    onPress={() => setDrill({ title: TYPE_LABELS[t], color: TYPE_COLORS[t], entries: valid.filter(e => e.type === t) })}>
                    <View style={[styles.legendDot, { backgroundColor: TYPE_COLORS[t] }]} />
                    <Text style={styles.legendLabel}>{TYPE_LABELS[t]}</Text>
                    <Text style={styles.legendVal}>{formatMoney(byType[t])}</Text>
                    <Text style={styles.legendChevron}>›</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Donut by category */}
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Top Categories</Text>
            {byCategory.length === 0 ? (
              <View style={styles.empty}><Text style={{ fontSize: 36 }}>📊</Text><Text style={styles.emptyText}>No data this period</Text></View>
            ) : (
              <View style={styles.donutRow}>
                <DonutChart
                  size={140} strokeWidth={24}
                  data={byCategory.map((c, i) => ({ label: c.category, value: c.amount, color: CAT_PALETTE[i % CAT_PALETTE.length] }))}
                  centerLabel={`${byCategory.length}`}
                  centerSub="categories"
                />
                <View style={styles.legend}>
                  {byCategory.slice(0, 6).map((c, i) => (
                    <TouchableOpacity key={c.category} style={styles.legendRow} activeOpacity={0.6}
                      onPress={() => setDrill({ title: c.category, color: CAT_PALETTE[i % CAT_PALETTE.length], entries: valid.filter(e => e.category === c.category) })}>
                      <View style={[styles.legendDot, { backgroundColor: CAT_PALETTE[i % CAT_PALETTE.length] }]} />
                      <Text style={styles.legendLabel} numberOfLines={1}>{c.category}</Text>
                      <Text style={styles.legendVal}>{total > 0 ? Math.round((c.amount / total) * 100) : 0}%</Text>
                      <Text style={styles.legendChevron}>›</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </View>
        </>
      ) : (
        <>
          <TextInput style={styles.search} value={search} onChangeText={setSearch}
            placeholder="Search expenses..." placeholderTextColor={COLORS.textLight} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            {(['all', 'personal', 'office', 'farm'] as const).map(t => (
              <TouchableOpacity key={t} style={[styles.filterChip, filterType === t && styles.filterChipActive]} onPress={() => setFilterType(t)}>
                <Text style={[styles.filterText, filterType === t && styles.filterTextActive]}>{t === 'all' ? 'All Types' : TYPE_LABELS[t]}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            <TouchableOpacity key='all' style={[styles.filterChip, filterStatus === 'all' && styles.filterChipActive]} onPress={() => setFilterStatus('all')}>
              <Text style={[styles.filterText, filterStatus === 'all' && styles.filterTextActive]}>All Status ({scoped.length})</Text>
            </TouchableOpacity>
            <TouchableOpacity key='draft' style={[styles.filterChip, filterStatus === 'draft' && styles.filterChipActive]} onPress={() => setFilterStatus('draft')}>
              <Text style={[styles.filterText, filterStatus === 'draft' && styles.filterTextActive]}>Draft {statusCounts.draft > 0 ? `(${statusCounts.draft})` : ''}</Text>
            </TouchableOpacity>
            <TouchableOpacity key='pending' style={[styles.filterChip, filterStatus === 'pending' && styles.filterChipActive]} onPress={() => setFilterStatus('pending')}>
              <Text style={[styles.filterText, filterStatus === 'pending' && styles.filterTextActive]}>Pending {statusCounts.pending > 0 ? `(${statusCounts.pending})` : ''}</Text>
            </TouchableOpacity>
            <TouchableOpacity key='approved' style={[styles.filterChip, filterStatus === 'approved' && styles.filterChipActive]} onPress={() => setFilterStatus('approved')}>
              <Text style={[styles.filterText, filterStatus === 'approved' && styles.filterTextActive]}>Approved {statusCounts.approved > 0 ? `(${statusCounts.approved})` : ''}</Text>
            </TouchableOpacity>
            <TouchableOpacity key='rejected' style={[styles.filterChip, filterStatus === 'rejected' && styles.filterChipActive]} onPress={() => setFilterStatus('rejected')}>
              <Text style={[styles.filterText, filterStatus === 'rejected' && styles.filterTextActive]}>Rejected {statusCounts.rejected > 0 ? `(${statusCounts.rejected})` : ''}</Text>
            </TouchableOpacity>
          </ScrollView>
          <View style={styles.summaryStrip}>
            <Text style={styles.summaryStripText}>{filtered.length} entries {scoped.length !== filtered.length ? `(${scoped.length} total)` : ''}</Text>
            <Text style={styles.summaryStripTotal}>{formatMoney(filtered.reduce((s, e) => e.status !== 'rejected' && e.status !== 'pending' ? s + e.amount : s, 0))}</Text>
          </View>
        </>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.title}>Expenses</Text>
          <Text style={styles.subtitle}>{scope === 'month' ? fiscal.label : 'All time'}</Text>
        </View>
        <View style={styles.topBarActions}>
          <TouchableOpacity style={styles.syncBtn} onPress={handleRefresh} disabled={refreshing || dataLoading}>
            <Text style={styles.syncBtnText}>{refreshing || dataLoading ? '🔄' : '🔃'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('AddExpense')}>
            <Text style={styles.addBtnText}>+ Add</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* View toggle */}
      <View style={styles.viewToggle}>
        <TouchableOpacity style={[styles.viewBtn, view === 'entries' && styles.viewBtnActive]} onPress={() => setView('entries')}>
          <Text style={[styles.viewBtnText, view === 'entries' && styles.viewBtnTextActive]}>📋 Entries</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.viewBtn, view === 'charts' && styles.viewBtnActive]} onPress={() => setView('charts')}>
          <Text style={[styles.viewBtnText, view === 'charts' && styles.viewBtnTextActive]}>📊 Charts</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={view === 'entries' ? (Array.isArray(filtered) ? filtered : []) : []}
        keyExtractor={(i, idx) => i?.id || `expense_${idx}`}
        renderItem={renderItem}
        ListHeaderComponent={Header}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={view === 'entries' ? (
          <View style={styles.empty}><Text style={{ fontSize: 44 }}>📭</Text><Text style={styles.emptyText}>No expenses found</Text></View>
        ) : null}
      />

      <DrillDownModal
        visible={!!drill}
        onClose={() => setDrill(null)}
        title={drill?.title ?? ''}
        color={drill?.color}
        entries={drill?.entries ?? []}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAFAF7' },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
  title: { fontSize: responsiveFontSize(24), fontWeight: '800', color: COLORS.text },
  subtitle: { fontSize: responsiveFontSize(12), color: COLORS.textLight, fontWeight: '500', marginTop: 2 },
  topBarActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  syncBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F5F5F0', alignItems: 'center', justifyContent: 'center' },
  syncBtnText: { fontSize: 18 },
  addBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 16, paddingVertical: 9, borderRadius: 12 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: responsiveFontSize(13) },
  advancesSection: { paddingHorizontal: 16, marginBottom: 14, paddingTop: 12 },
  advancesSectionTitle: { fontSize: responsiveFontSize(14), fontWeight: '800', color: COLORS.text, marginBottom: 10 },
  advanceCard: { backgroundColor: '#fff', borderRadius: 12, padding: 12, minWidth: 160, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  advanceCardHeader: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  advanceCardEmoji: { fontSize: 20 },
  advanceCardTo: { fontSize: responsiveFontSize(10), color: COLORS.textLight, fontWeight: '600' },
  advanceCardAmount: { fontSize: responsiveFontSize(12), fontWeight: '800', color: COLORS.text, marginTop: 2 },
  advanceProgressBar: { height: 6, backgroundColor: '#ECECE6', borderRadius: 3, overflow: 'hidden', marginBottom: 4 },
  advanceProgressFill: { height: '100%', backgroundColor: '#10B981' },
  advanceProgressText: { fontSize: responsiveFontSize(9), fontWeight: '700', color: COLORS.textMed },
  viewToggle: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 14, backgroundColor: '#F5F5F0', borderRadius: 12, padding: 4 },
  viewBtn: { flex: 1, paddingVertical: 9, borderRadius: 9, alignItems: 'center' },
  viewBtnActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 1 },
  viewBtnText: { fontSize: responsiveFontSize(13), fontWeight: '600', color: COLORS.textLight },
  viewBtnTextActive: { color: COLORS.primary, fontWeight: '700' },
  scopeRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  scopeBtn: { flex: 1, paddingVertical: 9, borderRadius: 10, alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: COLORS.border },
  scopeBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  scopeText: { fontSize: responsiveFontSize(12), fontWeight: '600', color: COLORS.textMed },
  scopeTextActive: { color: '#fff', fontWeight: '700' },
  chartCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 14, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  chartTitle: { fontSize: responsiveFontSize(15), fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  chartHint: { fontSize: responsiveFontSize(11), color: COLORS.accentDark, fontWeight: '600', marginBottom: 14 },
  legendChevron: { fontSize: 18, color: COLORS.textLight, marginLeft: 4 },
  donutRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  legend: { flex: 1, gap: 8 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { flex: 1, fontSize: responsiveFontSize(12), color: COLORS.textMed, fontWeight: '500' },
  legendVal: { fontSize: responsiveFontSize(12), color: COLORS.text, fontWeight: '700' },
  search: { backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontSize: responsiveFontSize(14), color: COLORS.text, marginBottom: 10, borderWidth: 1, borderColor: COLORS.border },
  filterRow: { gap: 8, paddingBottom: 10 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 18, backgroundColor: '#fff', borderWidth: 1, borderColor: COLORS.border },
  filterChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterText: { fontSize: responsiveFontSize(12), color: COLORS.textMed, fontWeight: '600' },
  filterTextActive: { color: '#fff', fontWeight: '700' },
  summaryStrip: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, marginTop: 4 },
  summaryStripText: { fontSize: responsiveFontSize(12), color: COLORS.textLight, fontWeight: '600' },
  summaryStripTotal: { fontSize: responsiveFontSize(14), color: COLORS.text, fontWeight: '800' },
  card: { backgroundColor: '#fff', borderRadius: 14, marginBottom: 10, padding: 14, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  typeIcon: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  cardCategory: { fontSize: responsiveFontSize(14), fontWeight: '700', color: COLORS.text },
  cardMeta: { fontSize: responsiveFontSize(11), color: COLORS.textLight, marginTop: 2, fontWeight: '500' },
  cardAmount: { fontSize: responsiveFontSize(14), fontWeight: '800', color: COLORS.text },
  statusBadge: { marginTop: 4, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  statusText: { fontSize: responsiveFontSize(9), fontWeight: '700' },
  cardNotes: { fontSize: responsiveFontSize(12), color: COLORS.textMed, marginTop: 10, fontWeight: '500' },
  sourceBadge: { fontSize: responsiveFontSize(11), color: COLORS.accentDark, fontWeight: '700', marginTop: 8 },
  actions: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: COLORS.divider, marginTop: 12, paddingTop: 4 },
  actionBtn: { flex: 1, paddingVertical: 8, alignItems: 'center' },
  actionText: { fontSize: responsiveFontSize(12), fontWeight: '700' },
  empty: { alignItems: 'center', paddingVertical: 50 },
  emptyText: { fontSize: responsiveFontSize(14), color: COLORS.textLight, fontWeight: '600', marginTop: 10 },
});
