import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
   ScrollView, Alert, Switch, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { format } from 'date-fns';
import { useStore } from '../../store/useStore';
import { COLORS, CATEGORIES, TYPE_LABELS } from '../../constants';
import { ExpenseType, PaymentMethod, Expense } from '../../types';
import * as ImagePicker from 'expo-image-picker';

const TYPES: ExpenseType[] = ['personal', 'office', 'farm'];
const PAYMENTS: PaymentMethod[] = ['cash', 'bank', 'digital'];

export default function AddExpenseScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { currentUser, addExpense, editExpense, approvalMode, expenses } = useStore();

  const editing: Expense | undefined = route.params?.expenseId
    ? expenses.find(e => e.id === route.params.expenseId)
    : undefined;

  const [type, setType] = useState<ExpenseType>(editing?.type ?? 'personal');
  const [category, setCategory] = useState(editing?.category ?? '');
  const [amount, setAmount] = useState(editing?.amount?.toString() ?? '');
  const [date, setDate] = useState(editing?.date ?? format(new Date(), 'yyyy-MM-dd'));
  const [notes, setNotes] = useState(editing?.notes ?? '');
  const [payment, setPayment] = useState<PaymentMethod>(editing?.paymentMethod ?? 'cash');
  const [isRecurring, setIsRecurring] = useState(editing?.isRecurring ?? false);
  const [receiptUri, setReceiptUri] = useState(editing?.receiptUri ?? '');
  const [saving, setSaving] = useState(false);

  const canEdit = currentUser?.role === 'admin' || !editing || editing.enteredBy === currentUser?.id;
  const isApproved = editing?.status === 'approved';

  const pickReceipt = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
    if (!result.canceled) setReceiptUri(result.assets[0].uri);
  };

  const handleSave = async () => {
    if (!category) { Alert.alert('Missing', 'Please select a category.'); return; }
    if (!amount || isNaN(Number(amount))) { Alert.alert('Missing', 'Please enter a valid amount.'); return; }
    if (currentUser?.role !== 'admin' && isApproved) { Alert.alert('Locked', 'Approved entries cannot be edited.'); return; }

    setSaving(true);
    const status = approvalMode && currentUser?.role !== 'admin' ? 'pending' : (editing?.status ?? 'approved');

    if (editing) {
      await editExpense(editing.id, { type, category, amount: Number(amount), date, notes, paymentMethod: payment, isRecurring, receiptUri });
    } else {
      await addExpense({ type, category, amount: Number(amount), date, notes, paymentMethod: payment, enteredBy: currentUser!.id, status, isRecurring, receiptUri });
    }
    setSaving(false);
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{editing ? 'Edit Expense' : 'Add Expense'}</Text>
          <View style={{ width: 60 }} />
        </View>

        <Text style={styles.label}>Expense Type</Text>
        <View style={styles.row}>
          {TYPES.map(t => (
            <TouchableOpacity
              key={t} style={[styles.chip, type === t && styles.chipActive]}
              onPress={() => { setType(t); setCategory(''); }}
            >
              <Text style={[styles.chipText, type === t && styles.chipTextActive]}>{TYPE_LABELS[t]}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Category</Text>
        <View style={styles.categoryGrid}>
          {CATEGORIES[type].map(c => (
            <TouchableOpacity
              key={c} style={[styles.catChip, category === c && styles.catChipActive]}
              onPress={() => setCategory(c)}
            >
              <Text style={[styles.catChipText, category === c && styles.catChipTextActive]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Amount (Rs.)</Text>
        <TextInput
          style={styles.input}
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
          placeholder="0"
          placeholderTextColor={COLORS.textLight}
        />

        <Text style={styles.label}>Date</Text>
        <TextInput
          style={styles.input}
          value={date}
          onChangeText={setDate}
          placeholder="yyyy-MM-dd"
          placeholderTextColor={COLORS.textLight}
        />

        <Text style={styles.label}>Payment Method</Text>
        <View style={styles.row}>
          {PAYMENTS.map(p => (
            <TouchableOpacity
              key={p} style={[styles.chip, payment === p && styles.chipActive]}
              onPress={() => setPayment(p)}
            >
              <Text style={[styles.chipText, payment === p && styles.chipTextActive]}>
                {p === 'cash' ? '💵 Cash' : p === 'bank' ? '🏦 Bank' : '📱 Digital'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Notes</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Optional notes..."
          placeholderTextColor={COLORS.textLight}
          multiline
          numberOfLines={3}
        />

        <View style={styles.switchRow}>
          <Text style={styles.label}>Recurring Expense</Text>
          <Switch value={isRecurring} onValueChange={setIsRecurring} trackColor={{ true: COLORS.primary }} />
        </View>

        <TouchableOpacity style={styles.receiptBtn} onPress={pickReceipt}>
          <Text style={styles.receiptBtnText}>{receiptUri ? '✅ Receipt Attached' : '📎 Attach Receipt'}</Text>
        </TouchableOpacity>

        {approvalMode && currentUser?.role !== 'admin' && (
          <View style={styles.approvalNote}>
            <Text style={styles.approvalNoteText}>⚠️ Approval mode is ON. Your entry will be submitted for review.</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveBtnText}>{saving ? 'Saving...' : editing ? 'Update Expense' : 'Save Expense'}</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1, paddingHorizontal: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16 },
  backBtn: { padding: 4 },
  backText: { color: COLORS.primary, fontWeight: '600', fontSize: 14 },
  title: { fontSize: 18, fontWeight: '800', color: COLORS.text },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.text, marginTop: 16, marginBottom: 8 },
  row: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.white },
  chipActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary },
  chipText: { fontSize: 13, color: COLORS.textLight, fontWeight: '500' },
  chipTextActive: { color: COLORS.white, fontWeight: '700' },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border },
  catChipActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '15' },
  catChipText: { fontSize: 12, color: COLORS.textLight },
  catChipTextActive: { color: COLORS.primary, fontWeight: '700' },
  input: { backgroundColor: COLORS.white, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, padding: 14, fontSize: 15, color: COLORS.text },
  textarea: { height: 80, textAlignVertical: 'top' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  receiptBtn: { backgroundColor: COLORS.border, borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 12 },
  receiptBtnText: { color: COLORS.text, fontWeight: '600' },
  approvalNote: { backgroundColor: '#FEF3C7', borderRadius: 10, padding: 12, marginTop: 12 },
  approvalNoteText: { color: '#92400E', fontSize: 12 },
  saveBtn: { backgroundColor: COLORS.primary, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 24 },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 16 },
});
