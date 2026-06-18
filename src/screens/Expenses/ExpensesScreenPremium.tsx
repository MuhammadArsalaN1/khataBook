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

const STATUS_COLORS: Record<ExpenseStatus, string> = {
  draft: COLORS.textLight, pending: COLORS.warning, approved: COLORS.success, rejected: COLORS.danger,
};
const CAT_PALETTE = COLORS.chart;

export default function ExpensesScreenPremium() {
  const { expenses, currentUser, deleteExpense, approveExpense } = useStore();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const fiscal = getActiveFiscalMonth();
  const [view, setView] = useState<'charts' | 'entries'>('entries');
  const [scope, setScope] = useState<'month' | 'all'>('month');
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<ExpenseType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<ExpenseStatus | 'all'>(route.params?.filter ?? 'all');

  // Scope expenses to active fiscal month (resets monthly) or all-time
  const scoped = useMemo(() => {
    if (scope === 'all') return expenses;
    return expenses.filter(e => {
      const d = new Date(e.date);
      return d.getMonth() + 1 === fiscal.month && d.getFullYear() === fiscal.year;
    });
  }, [expenses, scope, fiscal.month, fiscal.year]);

  const filtered = useMemo(() => {
    return scoped
      .filter(e => filterType === 'all' || e.type === filterType)
      .filter(e => filterStatus === 'all' || e.status === filterStatus)
      .filter(e => !search ||
        e.category.toLowerCase().includes(search.toLowerCase()) ||
        e.notes.toLowerCase().includes(search.toLowerCase()) ||
        e.amount.toString().includes(search))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [scoped, filterType, filterStatus, search]);

  // Chart data (uses scoped, excludes rejected)
  const valid = useMemo(() => scoped.filter(e => e.status !== 'rejected'), [scoped]);
  const total = useMemo(() => valid.reduce((s, e) => s + e.amount, 0), [valid]);
  const byType = useMemo(() => ({
    personal: valid.filter(e => e.type === 'personal').reduce((s, e) => s + e.amount, 0),
    office: valid.filter(e => e.type === 'office').reduce((s, e) => s + e.amount, 0),
    farm: valid.filter(e => e.type === 'farm').reduce((s, e) => s + e.amount, 0),
  }), [valid]);
  const byCategory = useMemo(() => {
    const m: Record<string, number> = {};
    valid.forEach(e => { m[e.category] = (m[e.category] ?? 0) + e.amount; });
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
    const user = USERS.find(u => u.id === item.enteredBy);
    const canEdit = currentUser?.role === 'admin' || (item.enteredBy === currentUser?.id && item.status !== 'approved');
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={[styles.typeIcon, { backgroundColor: (TYPE_COLORS[item.type]) + '15' }]}>
            <Text style={{ fontSize: 20 }}>{CATEGORY_EMOJI[item.category] ?? '💰'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardCategory}>{item.category}</Text>
            <Text style={styles.cardMeta}>{TYPE_LABELS[item.type]} · {user?.name} · {format(new Date(item.date), 'dd MMM')}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.cardAmount}>{formatMoney(item.amount)}</Text>
            <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[item.status] + '20' }]}>
              <Text style={[styles.statusText, { color: STATUS_COLORS[item.status] }]}>{item.status}</Text>
            </View>
          </View>
        </View>
        {item.notes ? <Text style={styles.cardNotes}>📝 {item.notes}</Text> : null}
        {(canEdit || (currentUser?.role === 'admin' && item.status === 'pending')) && (
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
                  <View key={t} style={styles.legendRow}>
                    <View style={[styles.legendDot, { backgroundColor: TYPE_COLORS[t] }]} />
                    <Text style={styles.legendLabel}>{TYPE_LABELS[t]}</Text>
                    <Text style={styles.legendVal}>{formatMoney(byType[t])}</Text>
                  </View>
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
                    <View key={c.category} style={styles.legendRow}>
                      <View style={[styles.legendDot, { backgroundColor: CAT_PALETTE[i % CAT_PALETTE.length] }]} />
                      <Text style={styles.legendLabel} numberOfLines={1}>{c.category}</Text>
                      <Text style={styles.legendVal}>{total > 0 ? Math.round((c.amount / total) * 100) : 0}%</Text>
                    </View>
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
            {(['all', 'pending', 'approved', 'rejected'] as const).map(s => (
              <TouchableOpacity key={s} style={[styles.filterChip, filterStatus === s && styles.filterChipActive]} onPress={() => setFilterStatus(s)}>
                <Text style={[styles.filterText, filterStatus === s && styles.filterTextActive]}>{s === 'all' ? 'All Status' : s.charAt(0).toUpperCase() + s.slice(1)}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View style={styles.summaryStrip}>
            <Text style={styles.summaryStripText}>{filtered.length} entries</Text>
            <Text style={styles.summaryStripTotal}>{formatMoney(filtered.reduce((s, e) => e.status !== 'rejected' ? s + e.amount : s, 0))}</Text>
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
        <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('AddExpense')}>
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
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
        data={view === 'entries' ? filtered : []}
        keyExtractor={i => i.id}
        renderItem={renderItem}
        ListHeaderComponent={Header}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={view === 'entries' ? (
          <View style={styles.empty}><Text style={{ fontSize: 44 }}>📭</Text><Text style={styles.emptyText}>No expenses found</Text></View>
        ) : null}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
  title: { fontSize: responsiveFontSize(24), fontWeight: '800', color: COLORS.text },
  subtitle: { fontSize: responsiveFontSize(12), color: COLORS.textLight, fontWeight: '500', marginTop: 2 },
  addBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 16, paddingVertical: 9, borderRadius: 12 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: responsiveFontSize(13) },
  viewToggle: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 14, backgroundColor: '#E9EDF3', borderRadius: 12, padding: 4 },
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
  chartTitle: { fontSize: responsiveFontSize(15), fontWeight: '700', color: COLORS.text, marginBottom: 14 },
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
  actions: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: COLORS.divider, marginTop: 12, paddingTop: 4 },
  actionBtn: { flex: 1, paddingVertical: 8, alignItems: 'center' },
  actionText: { fontSize: responsiveFontSize(12), fontWeight: '700' },
  empty: { alignItems: 'center', paddingVertical: 50 },
  emptyText: { fontSize: responsiveFontSize(14), color: COLORS.textLight, fontWeight: '600', marginTop: 10 },
});
