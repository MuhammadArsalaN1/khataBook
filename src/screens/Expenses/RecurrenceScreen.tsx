import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { format } from 'date-fns';
import { useStore } from '../../store/useStore';
import { COLORS, GRADIENTS, CATEGORIES, CATEGORY_EMOJI, TYPE_LABELS, PAYMENT_METHODS } from '../../constants';
import { ExpenseType, PaymentMethod, RecurrenceFrequency } from '../../types';
import { formatMoney } from '../../utils/currency';
import { withDisplay } from '../../utils/recurrence';
import { responsiveFontSize } from '../../utils/responsive';

const FREQUENCIES: RecurrenceFrequency[] = ['daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly'];

export default function RecurrenceScreen() {
  const { recurrenceRules, createRecurrenceRule, updateRecurrenceRule, deleteRecurrenceRule, currentUser } = useStore();

  const enriched = useMemo(() => recurrenceRules.map(r => withDisplay(r)), [recurrenceRules]);

  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    type: 'personal' as ExpenseType,
    category: '',
    amount: '',
    paymentMethod: 'cash' as PaymentMethod,
    frequency: 'monthly' as RecurrenceFrequency,
    dayOfMonth: '1',
    notes: '',
    startDate: format(new Date(), 'yyyy-MM-dd'),
  });

  const handleCreate = async () => {
    if (!formData.category || !formData.amount) {
      Alert.alert('Missing', 'Fill in category and amount.');
      return;
    }
    const amount = Number(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Invalid', 'Enter a valid amount.');
      return;
    }

    try {
      const nextDueDate = new Date(formData.startDate);
      if (formData.frequency === 'monthly' && formData.dayOfMonth) {
        nextDueDate.setDate(Number(formData.dayOfMonth));
      }

      await createRecurrenceRule({
        expenseTemplate: {
          type: formData.type,
          category: formData.category,
          amount,
          paymentMethod: formData.paymentMethod,
          notes: formData.notes,
        },
        frequency: formData.frequency,
        dayOfMonth: formData.frequency === 'monthly' ? Number(formData.dayOfMonth) : undefined,
        startDate: formData.startDate,
        active: true,
        nextDueDate: nextDueDate.toISOString().split('T')[0],
        createdBy: currentUser?.id ?? '',
      });

      setFormData({
        type: 'personal',
        category: '',
        amount: '',
        paymentMethod: 'cash',
        frequency: 'monthly',
        dayOfMonth: '1',
        notes: '',
        startDate: format(new Date(), 'yyyy-MM-dd'),
      });
      setModalOpen(false);
      Alert.alert('Success', 'Recurring expense created!');
    } catch (e) {
      Alert.alert('Error', 'Failed to create rule.');
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete', 'Remove this recurring rule?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', onPress: () => deleteRecurrenceRule(id), style: 'destructive' },
    ]);
  };

  const handleToggle = async (id: string, active: boolean) => {
    const rule = recurrenceRules.find(r => r.id === id);
    if (rule) {
      await updateRecurrenceRule(id, { active: !active });
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={GRADIENTS.header as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <Text style={styles.headerTitle}>Recurring Expenses</Text>
        <Text style={styles.headerSubtitle}>Auto-create on schedule</Text>
      </LinearGradient>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {enriched.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🔄</Text>
            <Text style={styles.emptyText}>No recurring expenses yet</Text>
            <Text style={styles.emptyHint}>Set up bills, subscriptions, or salaries to auto-create</Text>
          </View>
        ) : (
          enriched.map(rule => (
            <View key={rule.id} style={[styles.ruleCard, !rule.active && { opacity: 0.6 }]}>
              <View style={styles.ruleHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.ruleName}>{rule.displayName}</Text>
                  <Text style={styles.ruleFreq}>{rule.frequency.charAt(0).toUpperCase() + rule.frequency.slice(1)}</Text>
                </View>
                <View style={styles.ruleAmount}>
                  <Text style={styles.ruleAmountText}>{formatMoney(rule.expenseTemplate.amount)}</Text>
                </View>
              </View>

              <View style={styles.ruleDetails}>
                <View style={styles.detail}>
                  <Text style={styles.detailLabel}>Category</Text>
                  <Text style={styles.detailValue}>{rule.expenseTemplate.category}</Text>
                </View>
                <View style={styles.detail}>
                  <Text style={styles.detailLabel}>Next Due</Text>
                  <Text style={[styles.detailValue, rule.isOverdue && { color: COLORS.warning }]}>
                    {rule.daysUntilDue === 0 ? 'Today!' : rule.daysUntilDue > 0 ? `${rule.daysUntilDue}d` : `${Math.abs(rule.daysUntilDue)}d ago`}
                  </Text>
                </View>
                <View style={styles.detail}>
                  <Text style={styles.detailLabel}>Status</Text>
                  <Text style={[styles.detailValue, { color: rule.active ? COLORS.success : COLORS.textLight }]}>
                    {rule.active ? '✓ Active' : '✕ Paused'}
                  </Text>
                </View>
              </View>

              <View style={styles.ruleActions}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => handleToggle(rule.id, rule.active)}>
                  <Text style={styles.actionBtnText}>{rule.active ? '⏸ Pause' : '▶️ Resume'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#FFE5E5' }]} onPress={() => handleDelete(rule.id)}>
                  <Text style={[styles.actionBtnText, { color: '#991B1B' }]}>🗑️ Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => setModalOpen(true)}>
        <Text style={styles.fabIcon}>➕</Text>
      </TouchableOpacity>

      {/* Create Modal */}
      <Modal visible={modalOpen} transparent animationType="slide" onRequestClose={() => setModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
              <Text style={styles.modalTitle}>Create Recurring Expense</Text>

              <Text style={styles.label}>Type</Text>
              <View style={styles.typeRow}>
                {(['personal', 'office', 'farm'] as ExpenseType[]).map(t => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.typeChip, formData.type === t && styles.typeChipActive]}
                    onPress={() => setFormData(prev => ({ ...prev, type: t, category: '' }))}
                  >
                    <Text style={[styles.typeChipText, formData.type === t && styles.typeChipTextActive]}>{TYPE_LABELS[t]}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
                {CATEGORIES[formData.type].map(c => (
                  <TouchableOpacity
                    key={c}
                    style={[styles.catChip, formData.category === c && styles.catChipActive]}
                    onPress={() => setFormData(prev => ({ ...prev, category: c }))}
                  >
                    <Text style={styles.catEmoji}>{CATEGORY_EMOJI[c] ?? '💰'}</Text>
                    <Text style={[styles.catChipText, formData.category === c && styles.catChipTextActive]}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.label}>Amount (Rs.)</Text>
              <TextInput
                style={styles.input}
                value={formData.amount}
                onChangeText={v => setFormData(prev => ({ ...prev, amount: v }))}
                placeholder="5000"
                placeholderTextColor={COLORS.textLight}
                keyboardType="numeric"
              />

              <Text style={styles.label}>Payment Method</Text>
              <View style={styles.methodGrid}>
                {(['cash', 'bank', 'digital'] as PaymentMethod[]).map(m => (
                  <TouchableOpacity
                    key={m}
                    style={[styles.methodChip, formData.paymentMethod === m && styles.methodChipActive]}
                    onPress={() => setFormData(prev => ({ ...prev, paymentMethod: m }))}
                  >
                    <Text style={styles.methodEmoji}>{PAYMENT_METHODS[m]?.icon}</Text>
                    <Text style={[styles.methodLabel, formData.paymentMethod === m && styles.methodLabelActive]}>{PAYMENT_METHODS[m]?.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Frequency</Text>
              <View style={styles.freqGrid}>
                {FREQUENCIES.map(f => (
                  <TouchableOpacity
                    key={f}
                    style={[styles.freqChip, formData.frequency === f && styles.freqChipActive]}
                    onPress={() => setFormData(prev => ({ ...prev, frequency: f }))}
                  >
                    <Text style={[styles.freqLabel, formData.frequency === f && styles.freqLabelActive]}>{f}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {formData.frequency === 'monthly' && (
                <>
                  <Text style={styles.label}>Day of Month</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.dayOfMonth}
                    onChangeText={v => setFormData(prev => ({ ...prev, dayOfMonth: v }))}
                    placeholder="1"
                    placeholderTextColor={COLORS.textLight}
                    keyboardType="numeric"
                  />
                </>
              )}

              <Text style={styles.label}>Start Date</Text>
              <TextInput
                style={styles.input}
                value={formData.startDate}
                onChangeText={v => setFormData(prev => ({ ...prev, startDate: v }))}
                placeholder="yyyy-MM-dd"
                placeholderTextColor={COLORS.textLight}
              />

              <Text style={styles.label}>Notes (optional)</Text>
              <TextInput
                style={[styles.input, styles.textarea]}
                value={formData.notes}
                onChangeText={v => setFormData(prev => ({ ...prev, notes: v }))}
                placeholder="e.g., Electricity bill"
                placeholderTextColor={COLORS.textLight}
                multiline
                numberOfLines={2}
              />

              <TouchableOpacity style={styles.createBtn} onPress={handleCreate}>
                <Text style={styles.createBtnText}>Create Recurring Expense</Text>
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
  headerTitle: { fontSize: responsiveFontSize(26), fontWeight: '800', color: '#1A1A1A' },
  headerSubtitle: { fontSize: responsiveFontSize(13), color: 'rgba(26,26,26,0.6)', marginTop: 4, fontWeight: '600' },
  scroll: { flex: 1, paddingHorizontal: 16 },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: responsiveFontSize(16), fontWeight: '700', color: COLORS.text },
  emptyHint: { fontSize: responsiveFontSize(12), color: COLORS.textLight, marginTop: 8, textAlign: 'center' },
  ruleCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
  ruleHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  ruleName: { fontSize: responsiveFontSize(14), fontWeight: '800', color: COLORS.text },
  ruleFreq: { fontSize: responsiveFontSize(11), color: COLORS.textLight, fontWeight: '600', marginTop: 2 },
  ruleAmount: { backgroundColor: COLORS.accentSoft, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
  ruleAmountText: { fontSize: responsiveFontSize(14), fontWeight: '800', color: COLORS.accentDark },
  ruleDetails: { flexDirection: 'row', gap: 12, marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: COLORS.divider },
  detail: { flex: 1 },
  detailLabel: { fontSize: responsiveFontSize(10), color: COLORS.textLight, fontWeight: '700' },
  detailValue: { fontSize: responsiveFontSize(13), fontWeight: '800', color: COLORS.text, marginTop: 2 },
  ruleActions: { flexDirection: 'row', gap: 8 },
  actionBtn: { flex: 1, backgroundColor: COLORS.primary, borderRadius: 10, paddingVertical: 9, alignItems: 'center' },
  actionBtnText: { color: '#fff', fontWeight: '700', fontSize: responsiveFontSize(12) },
  fab: { position: 'absolute', bottom: 32, right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  fabIcon: { fontSize: 24 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(26,26,26,0.55)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#FAFAF7', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 10, paddingHorizontal: 16, maxHeight: '90%' },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#ECECE6', alignSelf: 'center', marginBottom: 20 },
  modalTitle: { fontSize: responsiveFontSize(18), fontWeight: '800', color: COLORS.text, marginBottom: 20 },
  label: { fontSize: responsiveFontSize(13), fontWeight: '700', color: COLORS.text, marginBottom: 10, marginTop: 14 },
  typeRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  typeChip: { flex: 1, paddingVertical: 10, borderRadius: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  typeChipActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary },
  typeChipText: { fontSize: responsiveFontSize(12), fontWeight: '700', color: COLORS.textMed },
  typeChipTextActive: { color: '#fff' },
  catChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 14, backgroundColor: '#fff', borderWidth: 1, borderColor: COLORS.border, marginRight: 8 },
  catChipActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '12' },
  catEmoji: { fontSize: 15 },
  catChipText: { fontSize: responsiveFontSize(11), color: COLORS.textMed, fontWeight: '600' },
  catChipTextActive: { color: COLORS.primary, fontWeight: '700' },
  input: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, padding: 12, fontSize: responsiveFontSize(14), color: COLORS.text, marginBottom: 10 },
  textarea: { height: 60, textAlignVertical: 'top' },
  methodGrid: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  methodChip: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: COLORS.border },
  methodChipActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '12' },
  methodEmoji: { fontSize: 18, marginBottom: 4 },
  methodLabel: { fontSize: responsiveFontSize(11), fontWeight: '600', color: COLORS.textMed },
  methodLabelActive: { color: COLORS.primary, fontWeight: '700' },
  freqGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  freqChip: { paddingHorizontal: 12, paddingVertical: 9, borderRadius: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: COLORS.border },
  freqChipActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary },
  freqLabel: { fontSize: responsiveFontSize(11), fontWeight: '600', color: COLORS.textMed },
  freqLabelActive: { color: '#fff', fontWeight: '700' },
  createBtn: { backgroundColor: COLORS.primary, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 24 },
  createBtnText: { color: '#fff', fontWeight: '800', fontSize: responsiveFontSize(16) },
});
