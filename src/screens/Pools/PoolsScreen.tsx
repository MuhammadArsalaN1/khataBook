import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { format } from 'date-fns';
import { useStore } from '../../store/useStore';
import { COLORS, GRADIENTS, TYPE_LABELS } from '../../constants';
import { ExpenseType, BudgetPool } from '../../types';
import { formatMoney } from '../../utils/currency';
import { poolSpent, withBalance, poolsSummary } from '../../utils/pools';
import { responsiveFontSize } from '../../utils/responsive';

export default function PoolsScreen() {
  const { budgetPools, expenses, saveBudgetPool, updateBudgetPool, deleteBudgetPool } = useStore();
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  // Current month pools only
  const currentPools = useMemo(() =>
    budgetPools.filter(p => p.month === month && p.year === year),
    [budgetPools, month, year]
  );

  const summary = useMemo(() => poolsSummary(currentPools, expenses), [currentPools, expenses]);

  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'personal' as ExpenseType,
    allocatedAmount: '',
    linkedCategories: [] as string[],
    alertThreshold: '80',
  });

  const handleCreate = async () => {
    if (!formData.name.trim() || !formData.allocatedAmount) {
      Alert.alert('Missing', 'Fill in pool name and amount.');
      return;
    }
    const amount = Number(formData.allocatedAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Invalid', 'Enter a valid amount.');
      return;
    }
    try {
      await saveBudgetPool({
        name: formData.name.trim(),
        type: formData.type,
        allocatedAmount: amount,
        month,
        year,
        linkedCategories: formData.linkedCategories,
        alertThreshold: Number(formData.alertThreshold),
      });
      setFormData({ name: '', type: 'personal', allocatedAmount: '', linkedCategories: [], alertThreshold: '80' });
      setModalOpen(false);
    } catch (e) {
      Alert.alert('Error', 'Failed to create pool.');
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete', 'Remove this pool?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', onPress: () => deleteBudgetPool(id), style: 'destructive' },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={GRADIENTS.header as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Budget Pools</Text>
          <Text style={styles.headerSubtitle}>{format(now, 'MMMM yyyy')}</Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Summary */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Allocated</Text>
            <Text style={styles.summaryValue}>{formatMoney(summary.totalAllocated)}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Spent</Text>
            <Text style={styles.summaryValue}>{formatMoney(summary.totalSpent)}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Remaining</Text>
            <Text style={[styles.summaryValue, { color: COLORS.success }]}>{formatMoney(summary.totalRemaining)}</Text>
          </View>
        </View>

        {summary.alertedPools > 0 && (
          <View style={styles.alertBanner}>
            <Text style={styles.alertText}>⚠️ {summary.alertedPools} pool{summary.alertedPools !== 1 ? 's' : ''} at alert threshold</Text>
          </View>
        )}

        {/* Pools */}
        {currentPools.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📦</Text>
            <Text style={styles.emptyText}>No budget pools yet</Text>
            <Text style={styles.emptyHint}>Create a pool to allocate spending to specific categories</Text>
          </View>
        ) : (
          currentPools.map(pool => {
            const enriched = withBalance(pool, expenses);
            return (
              <TouchableOpacity key={pool.id} style={[styles.poolCard, enriched.isAlerted && { borderColor: COLORS.warning, borderWidth: 2 }]}>
                <View style={styles.poolHeader}>
                  <View>
                    <Text style={styles.poolName}>{pool.name}</Text>
                    <Text style={styles.poolType}>{TYPE_LABELS[pool.type]}</Text>
                  </View>
                  <TouchableOpacity onPress={() => handleDelete(pool.id)}>
                    <Text style={styles.deleteBtn}>🗑️</Text>
                  </TouchableOpacity>
                </View>

                {/* Progress */}
                <View style={styles.progressContainer}>
                  <View style={[styles.progressBar, { width: `${Math.min(enriched.percentUsed, 100)}%`, backgroundColor: enriched.isAlerted ? COLORS.warning : COLORS.success }]} />
                </View>

                {/* Stats */}
                <View style={styles.statsRow}>
                  <View style={styles.stat}>
                    <Text style={styles.statLabel}>Budget</Text>
                    <Text style={styles.statValue}>{formatMoney(pool.allocatedAmount)}</Text>
                  </View>
                  <View style={styles.stat}>
                    <Text style={styles.statLabel}>Spent</Text>
                    <Text style={styles.statValue}>{formatMoney(enriched.spent)}</Text>
                  </View>
                  <View style={styles.stat}>
                    <Text style={styles.statLabel}>Left</Text>
                    <Text style={[styles.statValue, { color: enriched.isAlerted ? COLORS.warning : COLORS.success }]}>{formatMoney(enriched.remaining)}</Text>
                  </View>
                  <View style={styles.stat}>
                    <Text style={styles.statLabel}>Used</Text>
                    <Text style={styles.statValue}>{Math.round(enriched.percentUsed)}%</Text>
                  </View>
                </View>

                {/* Categories */}
                {pool.linkedCategories.length > 0 && (
                  <View style={styles.categoriesRow}>
                    <Text style={styles.categoriesLabel}>Categories: {pool.linkedCategories.join(', ')}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Create button */}
      <TouchableOpacity style={styles.fab} onPress={() => setModalOpen(true)}>
        <Text style={styles.fabIcon}>➕</Text>
      </TouchableOpacity>

      {/* Create Pool Modal */}
      <Modal visible={modalOpen} transparent animationType="slide" onRequestClose={() => setModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
              <Text style={styles.modalTitle}>Create Budget Pool</Text>

              <Text style={styles.label}>Pool Name</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={v => setFormData(prev => ({ ...prev, name: v }))}
                placeholder="e.g. Diesel, Labor, Maintenance"
                placeholderTextColor={COLORS.textLight}
              />

              <Text style={styles.label}>Type</Text>
              <View style={styles.typeRow}>
                {(['personal', 'office', 'farm'] as ExpenseType[]).map(t => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.typeChip, formData.type === t && styles.typeChipActive]}
                    onPress={() => setFormData(prev => ({ ...prev, type: t }))}
                  >
                    <Text style={[styles.typeChipText, formData.type === t && styles.typeChipTextActive]}>{TYPE_LABELS[t]}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Monthly Allocation (Rs.)</Text>
              <TextInput
                style={styles.input}
                value={formData.allocatedAmount}
                onChangeText={v => setFormData(prev => ({ ...prev, allocatedAmount: v }))}
                placeholder="50000"
                placeholderTextColor={COLORS.textLight}
                keyboardType="numeric"
              />

              <Text style={styles.label}>Alert Threshold (%)</Text>
              <TextInput
                style={styles.input}
                value={formData.alertThreshold}
                onChangeText={v => setFormData(prev => ({ ...prev, alertThreshold: v }))}
                placeholder="80"
                placeholderTextColor={COLORS.textLight}
                keyboardType="numeric"
              />

              <TouchableOpacity style={styles.createBtn} onPress={handleCreate}>
                <Text style={styles.createBtnText}>Create Pool</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAFAF7' },
  header: { paddingHorizontal: 20, paddingVertical: 20, paddingBottom: 24 },
  headerTop: { marginTop: 8 },
  headerTitle: { fontSize: responsiveFontSize(26), fontWeight: '800', color: '#1A1A1A' },
  headerSubtitle: { fontSize: responsiveFontSize(13), color: 'rgba(26,26,26,0.6)', marginTop: 4, fontWeight: '600' },
  scroll: { flex: 1, paddingHorizontal: 16 },
  summaryRow: { flexDirection: 'row', gap: 10, marginTop: 16, marginBottom: 16 },
  summaryCard: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 12, alignItems: 'center' },
  summaryLabel: { fontSize: responsiveFontSize(11), color: COLORS.textLight, fontWeight: '700' },
  summaryValue: { fontSize: responsiveFontSize(16), color: COLORS.text, fontWeight: '800', marginTop: 4 },
  alertBanner: { backgroundColor: '#FEF3C7', borderRadius: 12, padding: 12, marginBottom: 16 },
  alertText: { color: '#1A1A1A', fontSize: responsiveFontSize(12), fontWeight: '700' },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: responsiveFontSize(16), fontWeight: '700', color: COLORS.text },
  emptyHint: { fontSize: responsiveFontSize(12), color: COLORS.textLight, marginTop: 8, textAlign: 'center' },
  poolCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
  poolHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  poolName: { fontSize: responsiveFontSize(15), fontWeight: '800', color: COLORS.text },
  poolType: { fontSize: responsiveFontSize(11), color: COLORS.textLight, fontWeight: '600', marginTop: 2 },
  deleteBtn: { fontSize: 18, padding: 4 },
  progressContainer: { height: 8, backgroundColor: '#ECECE6', borderRadius: 4, overflow: 'hidden', marginBottom: 12 },
  progressBar: { height: '100%', borderRadius: 4 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginBottom: 12 },
  stat: { flex: 1, alignItems: 'center' },
  statLabel: { fontSize: responsiveFontSize(10), color: COLORS.textLight, fontWeight: '600' },
  statValue: { fontSize: responsiveFontSize(14), fontWeight: '800', color: COLORS.text, marginTop: 2 },
  categoriesRow: { paddingTop: 12, borderTopWidth: 1, borderTopColor: COLORS.divider },
  categoriesLabel: { fontSize: responsiveFontSize(11), color: COLORS.textMed, fontWeight: '600' },
  fab: { position: 'absolute', bottom: 32, right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  fabIcon: { fontSize: 24 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(26,26,26,0.55)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#FAFAF7', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 10, paddingHorizontal: 16, maxHeight: '85%' },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#ECECE6', alignSelf: 'center', marginBottom: 20 },
  modalTitle: { fontSize: responsiveFontSize(18), fontWeight: '800', color: COLORS.text, marginBottom: 20 },
  label: { fontSize: responsiveFontSize(13), fontWeight: '700', color: COLORS.text, marginBottom: 10, marginTop: 14 },
  input: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, padding: 14, fontSize: responsiveFontSize(15), color: COLORS.text },
  typeRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  typeChip: { flex: 1, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  typeChipActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary },
  typeChipText: { fontSize: responsiveFontSize(12), fontWeight: '700', color: COLORS.textMed },
  typeChipTextActive: { color: '#fff' },
  createBtn: { backgroundColor: COLORS.primary, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 24 },
  createBtnText: { color: '#fff', fontWeight: '800', fontSize: responsiveFontSize(16) },
});
