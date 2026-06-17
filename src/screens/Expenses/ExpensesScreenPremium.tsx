import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { format } from 'date-fns';
import { useStore } from '../../store/useStore';
import { COLORS, TYPE_COLORS, TYPE_LABELS, USERS } from '../../constants';
import { Expense, ExpenseType, ExpenseStatus } from '../../types';
import { responsiveFontSize, responsiveSpacing } from '../../utils/responsive';

const STATUS_COLORS: Record<ExpenseStatus, string> = {
  draft: COLORS.textLight,
  pending: COLORS.warning,
  approved: COLORS.success,
  rejected: COLORS.danger,
};

export default function ExpensesScreenPremium() {
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
      .filter(
        e =>
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
    const canDelete =
      currentUser?.role === 'admin' || (item.enteredBy === currentUser?.id && item.status !== 'approved');

    return (
      <View style={styles.expenseCard}>
        <View style={styles.expenseHeader}>
          <View style={[styles.typeIcon, { backgroundColor: TYPE_COLORS[item.type] + '20' }]}>
            <Text style={styles.typeIconText}>{item.category.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.expenseInfo}>
            <Text style={styles.expenseCategory}>{item.category}</Text>
            <Text style={styles.expenseMeta}>
              {user?.name} • {format(new Date(item.date), 'dd MMM')}
            </Text>
          </View>
          <View style={styles.expenseRight}>
            <Text style={styles.expenseAmount}>Rs. {item.amount.toLocaleString()}</Text>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: STATUS_COLORS[item.status] + '20',
                },
              ]}
            >
              <Text style={[styles.statusText, { color: STATUS_COLORS[item.status] }]}>
                {item.status}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.expenseActions}>
          {canEdit && (
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => navigation.navigate('AddExpense', { expenseId: item.id })}
            >
              <Text style={[styles.actionText, { color: COLORS.primary }]}>✏️ Edit</Text>
            </TouchableOpacity>
          )}
          {canDelete && (
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
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Expenses</Text>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => navigation.navigate('AddExpense')}
          >
            <Text style={styles.addBtnText}>+ Add</Text>
          </TouchableOpacity>
        </View>

        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search expenses..."
          placeholderTextColor={COLORS.textLight}
        />

        {/* Type Filter */}
        <View style={styles.filterRow}>
          {(['all', 'personal', 'office', 'farm'] as const).map(t => (
            <TouchableOpacity
              key={t}
              style={[styles.filterBtn, filterType === t && styles.filterBtnActive]}
              onPress={() => setFilterType(t)}
            >
              <Text style={[styles.filterText, filterType === t && styles.filterTextActive]}>
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
              style={[styles.filterBtn, filterStatus === s && styles.filterBtnActive]}
              onPress={() => setFilterStatus(s)}
            >
              <Text style={[styles.filterText, filterStatus === s && styles.filterTextActive]}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
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
              <Text style={styles.emptyIcon}>📝</Text>
              <Text style={styles.emptyText}>No expenses found</Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1, paddingHorizontal: responsiveSpacing(16) },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: responsiveSpacing(12),
    paddingBottom: responsiveSpacing(12),
  },
  title: { fontSize: responsiveFontSize(24), fontWeight: '700', color: COLORS.text },
  addBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: responsiveSpacing(14),
    paddingVertical: responsiveSpacing(8),
    borderRadius: 8,
  },
  addBtnText: { color: COLORS.white, fontWeight: '700', fontSize: responsiveFontSize(12) },
  searchInput: {
    backgroundColor: COLORS.cardSecondary,
    borderRadius: 10,
    paddingHorizontal: responsiveSpacing(12),
    paddingVertical: responsiveSpacing(10),
    fontSize: responsiveFontSize(14),
    color: COLORS.text,
    marginBottom: responsiveSpacing(12),
  },
  filterRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 10 },
  filterBtn: {
    paddingHorizontal: responsiveSpacing(12),
    paddingVertical: responsiveSpacing(6),
    borderRadius: 8,
    backgroundColor: COLORS.cardSecondary,
  },
  filterBtnActive: { backgroundColor: COLORS.primary },
  filterText: { fontSize: responsiveFontSize(12), color: COLORS.textLight, fontWeight: '600' },
  filterTextActive: { color: COLORS.white, fontWeight: '700' },
  count: { fontSize: responsiveFontSize(12), color: COLORS.textLight, marginBottom: 10, fontWeight: '600' },
  expenseCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    marginBottom: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  expenseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: responsiveSpacing(12),
  },
  typeIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: responsiveSpacing(10),
  },
  typeIconText: { fontSize: responsiveFontSize(16), fontWeight: '700', color: COLORS.text },
  expenseInfo: { flex: 1 },
  expenseCategory: { fontSize: responsiveFontSize(14), fontWeight: '700', color: COLORS.text },
  expenseMeta: { fontSize: responsiveFontSize(11), color: COLORS.textLight, marginTop: 2 },
  expenseRight: { alignItems: 'flex-end' },
  expenseAmount: { fontSize: responsiveFontSize(14), fontWeight: '800', color: COLORS.text },
  statusBadge: { marginTop: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusText: { fontSize: responsiveFontSize(10), fontWeight: '700' },
  expenseActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  actionBtn: {
    flex: 1,
    padding: responsiveSpacing(10),
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: COLORS.divider,
  },
  actionText: { fontSize: responsiveFontSize(12), fontWeight: '700' },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: responsiveFontSize(14), color: COLORS.textLight, fontWeight: '600' },
});
