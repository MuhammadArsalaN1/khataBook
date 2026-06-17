import React, { useState, useMemo } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  SafeAreaView, TextInput, Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { format } from 'date-fns';
import { useStore } from '../../store/useStore';
import { COLORS, TYPE_COLORS, TYPE_LABELS, USERS } from '../../constants';
import { Expense, ExpenseType, ExpenseStatus } from '../../types';

const STATUS_COLORS: Record<ExpenseStatus, string> = {
  draft: COLORS.textLight,
  pending: COLORS.warning,
  approved: COLORS.success,
  rejected: COLORS.danger,
};

export default function ExpensesScreen() {
  const { expenses, currentUser, deleteExpense, approveExpense } = useStore();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<ExpenseType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<ExpenseStatus | 'all'>(route.params?.filter ?? 'all');
  const [filterUser, setFilterUser] = useState<string>('all');

  const filtered = useMemo(() => {
    return expenses
      .filter(e => filterType === 'all' || e.type === filterType)
      .filter(e => filterStatus === 'all' || e.status === filterStatus)
      .filter(e => filterUser === 'all' || e.enteredBy === filterUser)
      .filter(e =>
        !search ||
        e.category.toLowerCase().includes(search.toLowerCase()) ||
        e.notes.toLowerCase().includes(search.toLowerCase()) ||
        e.amount.toString().includes(search)
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expenses, filterType, filterStatus, filterUser, search]);

  const handleDelete = (e: Expense) => {
    if (e.status === 'approved' && currentUser?.role !== 'admin') {
      Alert.alert('Locked', 'Approved entries cannot be deleted.');
      return;
    }
    Alert.alert('Delete', 'Are you sure you want to delete this expense?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteExpense(e.id) },
    ]);
  };

  const handleApprove = (e: Expense, status: 'approved' | 'rejected') => {
    Alert.alert(status === 'approved' ? 'Approve' : 'Reject', `Are you sure?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: status === 'approved' ? 'Approve' : 'Reject', onPress: () => approveExpense(e.id, status) },
    ]);
  };

  const renderItem = ({ item }: { item: Expense }) => {
    const user = USERS.find(u => u.id === item.enteredBy);
    const canEdit = currentUser?.role === 'admin' || (item.enteredBy === currentUser?.id && item.status !== 'approved');
    const canDelete = currentUser?.role === 'admin' || (item.enteredBy === currentUser?.id && item.status !== 'approved');

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={[styles.typeBadge, { backgroundColor: TYPE_COLORS[item.type] + '20' }]}>
            <Text style={[styles.typeBadgeText, { color: TYPE_COLORS[item.type] }]}>{TYPE_LABELS[item.type]}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[item.status] + '20' }]}>
            <Text style={[styles.statusText, { color: STATUS_COLORS[item.status] }]}>{item.status}</Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.cardMain}>
            <Text style={styles.category}>{item.category}</Text>
            <Text style={styles.amount}>Rs. {item.amount.toLocaleString()}</Text>
          </View>
          <Text style={styles.meta}>{format(new Date(item.date), 'dd MMM yyyy')} • {user?.name} • {item.paymentMethod}</Text>
          {item.notes ? <Text style={styles.notes}>{item.notes}</Text> : null}
          {item.isRecurring && <Text style={styles.recurring}>🔁 Recurring</Text>}
          {item.receiptUri ? <Text style={styles.receipt}>📎 Receipt attached</Text> : null}
        </View>

        <View style={styles.actions}>
          {canEdit && (
            <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('AddExpense', { expenseId: item.id })}>
              <Text style={styles.actionBtnText}>✏️ Edit</Text>
            </TouchableOpacity>
          )}
          {canDelete && (
            <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]} onPress={() => handleDelete(item)}>
              <Text style={[styles.actionBtnText, { color: COLORS.danger }]}>🗑️ Delete</Text>
            </TouchableOpacity>
          )}
          {currentUser?.role === 'admin' && item.status === 'pending' && (
            <>
              <TouchableOpacity style={[styles.actionBtn, styles.approveBtn]} onPress={() => handleApprove(item, 'approved')}>
                <Text style={[styles.actionBtnText, { color: COLORS.success }]}>✓ Approve</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, styles.rejectBtn]} onPress={() => handleApprove(item, 'rejected')}>
                <Text style={[styles.actionBtnText, { color: COLORS.danger }]}>✕ Reject</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Expenses</Text>

        <TextInput
          style={styles.search}
          value={search}
          onChangeText={setSearch}
          placeholder="Search by category, amount, notes..."
          placeholderTextColor={COLORS.textLight}
        />

        {/* Type Filter */}
        <View style={styles.filterRow}>
          {(['all', 'personal', 'office', 'farm'] as const).map(t => (
            <TouchableOpacity
              key={t}
              style={[styles.filterChip, filterType === t && styles.filterChipActive]}
              onPress={() => setFilterType(t)}
            >
              <Text style={[styles.filterChipText, filterType === t && styles.filterChipTextActive]}>
                {t === 'all' ? 'All' : TYPE_LABELS[t]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Status Filter */}
        <View style={styles.filterRow}>
          {(['all', 'pending', 'approved', 'rejected'] as const).map(s => (
            <TouchableOpacity
              key={s}
              style={[styles.filterChip, filterStatus === s && styles.filterChipActive]}
              onPress={() => setFilterStatus(s)}
            >
              <Text style={[styles.filterChipText, filterStatus === s && styles.filterChipTextActive]}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* User Filter */}
        <View style={styles.filterRow}>
          {(['all', ...USERS.map(u => u.id)] as const).map(uid => (
            <TouchableOpacity
              key={uid}
              style={[styles.filterChip, filterUser === uid && styles.filterChipActive]}
              onPress={() => setFilterUser(uid)}
            >
              <Text style={[styles.filterChipText, filterUser === uid && styles.filterChipTextActive]}>
                {uid === 'all' ? 'All Users' : USERS.find(u => u.id === uid)?.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.count}>{filtered.length} entries</Text>

        <FlatList
          data={filtered}
          keyExtractor={i => i.id}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No expenses found</Text>
              <TouchableOpacity onPress={() => navigation.navigate('AddExpense')}>
                <Text style={styles.emptyAdd}>+ Add your first expense</Text>
              </TouchableOpacity>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  title: { fontSize: 22, fontWeight: '800', color: COLORS.text, marginBottom: 12 },
  search: { backgroundColor: COLORS.white, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, padding: 12, fontSize: 14, color: COLORS.text, marginBottom: 10 },
  filterRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: 8 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.white },
  filterChipActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary },
  filterChipText: { fontSize: 12, color: COLORS.textLight },
  filterChipTextActive: { color: COLORS.white, fontWeight: '600' },
  count: { fontSize: 12, color: COLORS.textLight, marginBottom: 8 },
  card: { backgroundColor: COLORS.white, borderRadius: 12, marginBottom: 10, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 14, paddingTop: 12 },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  typeBadgeText: { fontSize: 11, fontWeight: '700' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '700' },
  cardBody: { padding: 14, paddingTop: 8 },
  cardMain: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  category: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  amount: { fontSize: 18, fontWeight: '800', color: COLORS.primary },
  meta: { fontSize: 11, color: COLORS.textLight },
  notes: { fontSize: 12, color: COLORS.textLight, marginTop: 4, fontStyle: 'italic' },
  recurring: { fontSize: 11, color: COLORS.secondary, marginTop: 3, fontWeight: '600' },
  receipt: { fontSize: 11, color: COLORS.success, marginTop: 3 },
  actions: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: COLORS.border },
  actionBtn: { flex: 1, padding: 10, alignItems: 'center', borderRightWidth: 1, borderRightColor: COLORS.border },
  actionBtnText: { fontSize: 12, fontWeight: '600', color: COLORS.textLight },
  deleteBtn: { borderRightWidth: 0 },
  approveBtn: {},
  rejectBtn: { borderRightWidth: 0 },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, color: COLORS.textLight, marginBottom: 12 },
  emptyAdd: { color: COLORS.primary, fontWeight: '700', fontSize: 14 },
});
