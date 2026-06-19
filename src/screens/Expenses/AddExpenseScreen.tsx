import React, { useState, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, Switch, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { format } from 'date-fns';
import { useStore } from '../../store/useStore';
import { COLORS, CATEGORIES, TYPE_LABELS, PAYMENT_METHODS, CATEGORY_EMOJI } from '../../constants';
import { ExpenseType, PaymentMethod, Expense } from '../../types';
import { formatMoney } from '../../utils/currency';
import { responsiveFontSize } from '../../utils/responsive';
import NumberPad from '../../components/common/NumberPad';
import * as ImagePicker from 'expo-image-picker';

const TYPES: ExpenseType[] = ['personal', 'office', 'farm'];
const PAYMENTS: PaymentMethod[] = ['cash', 'bank', 'jazzcash', 'digital', 'paypal', 'payoneer'];

export default function AddExpenseScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { currentUser, addExpense, editExpense, approvalMode, expenses = [], advanceBalanceEntries = [] } = useStore();

  const editing: Expense | undefined = route.params?.expenseId
    ? expenses.find(e => e.id === route.params.expenseId) : undefined;

  const [type, setType] = useState<ExpenseType>(editing?.type ?? 'personal');
  const [category, setCategory] = useState(editing?.category ?? '');
  const [amount, setAmount] = useState(editing?.amount?.toString() ?? '0');
  const [date, setDate] = useState(editing?.date ?? format(new Date(), 'yyyy-MM-dd'));
  const [notes, setNotes] = useState(editing?.notes ?? '');
  const [payment, setPayment] = useState<PaymentMethod>(editing?.paymentMethod ?? 'cash');
  const [isRecurring, setIsRecurring] = useState(editing?.isRecurring ?? false);
  const [receiptUri, setReceiptUri] = useState(editing?.receiptUri ?? '');
  const [saving, setSaving] = useState(false);
  const [padOpen, setPadOpen] = useState(false);
  const [advanceEntryId, setAdvanceEntryId] = useState(editing?.advanceEntryId ?? '');

  const isApproved = editing?.status === 'approved';

  // Get available advances for current user (receiver perspective)
  const userAdvances = useMemo(
    () => advanceBalanceEntries.filter(e => e.receiverEmail === currentUser?.email && e.status === 'active'),
    [advanceBalanceEntries, currentUser]
  );

  // Calculate remaining for each advance (amount - already used in expenses)
  const sources = useMemo(() =>
    userAdvances.map(entry => {
      const used = expenses
        .filter(e => e.advanceEntryId === entry.id && e.source === 'advance' && e.id !== editing?.id && e.status !== 'rejected')
        .reduce((sum, e) => sum + e.amount, 0);
      const remaining = entry.amount - used;
      return { ...entry, used, remaining };
    }).filter(a => a.remaining > 0 || a.id === editing?.advanceEntryId),
    [userAdvances, expenses, editing]
  );

  const selectedSource = sources.find(s => s.id === advanceEntryId);

  const pickReceipt = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
    if (!result.canceled) setReceiptUri(result.assets[0].uri);
  };

  const persist = async (num: number, sourceId: string) => {
    setSaving(true);
    const status = approvalMode && currentUser?.role !== 'admin' ? 'pending' : (editing?.status ?? 'approved');
    const source = sourceId ? 'advance' : 'personal';
    if (editing) {
      await editExpense(editing.id, { type, category, amount: num, date, notes, paymentMethod: payment, isRecurring, receiptUri, source: source as any, advanceEntryId: sourceId });
    } else {
      await addExpense({ type, category, amount: num, date, notes, paymentMethod: payment, enteredBy: currentUser!.id, status, isRecurring, receiptUri, source: source as any, advanceEntryId: sourceId });
    }
    setSaving(false);
    navigation.goBack();
  };

  const handleSave = async () => {
    if (!category) { Alert.alert('Missing', 'Please select a category.'); return; }
    const num = Number(amount);
    if (!amount || isNaN(num) || num <= 0) { Alert.alert('Missing', 'Please enter a valid amount.'); return; }
    if (currentUser?.role !== 'admin' && isApproved) { Alert.alert('Locked', 'Approved entries cannot be edited.'); return; }

    // Balance validation when paying from an advance
    if (selectedSource && num > selectedSource.remaining) {
      Alert.alert(
        'Insufficient Advance Balance',
        `${selectedSource.giverName}'s advance has only ${formatMoney(selectedSource.remaining)} left, but this entry is ${formatMoney(num)}.\n\nShortfall: ${formatMoney(num - selectedSource.remaining)}`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Use Main Balance', onPress: () => { setAdvanceEntryId(''); persist(num, ''); } },
        ]
      );
      return;
    }
    await persist(num, advanceEntryId);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{editing ? 'Edit Expense' : 'Add Expense'}</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Amount — tap to open numpad */}
        <TouchableOpacity style={styles.amountCard} onPress={() => setPadOpen(true)} activeOpacity={0.8}>
          <Text style={styles.amountLabel}>Amount</Text>
          <Text style={styles.amountValue}>{formatMoney(Number(amount) || 0)}</Text>
          <Text style={styles.amountHint}>Tap to enter amount</Text>
        </TouchableOpacity>

        <Text style={styles.label}>Type</Text>
        <View style={styles.row}>
          {TYPES.map(t => (
            <TouchableOpacity key={t} style={[styles.chip, type === t && styles.chipActive]} onPress={() => { setType(t); setCategory(''); }}>
              <Text style={[styles.chipText, type === t && styles.chipTextActive]}>{TYPE_LABELS[t]}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Category</Text>
        <View style={styles.categoryGrid}>
          {CATEGORIES[type].map(c => (
            <TouchableOpacity key={c} style={[styles.catChip, category === c && styles.catChipActive]} onPress={() => setCategory(c)}>
              <Text style={styles.catEmoji}>{CATEGORY_EMOJI[c] ?? '💰'}</Text>
              <Text style={[styles.catChipText, category === c && styles.catChipTextActive]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Payment Method</Text>
        <View style={styles.categoryGrid}>
          {PAYMENTS.map(p => (
            <TouchableOpacity key={p} style={[styles.payChip, payment === p && styles.payChipActive]} onPress={() => setPayment(p)}>
              <Text style={styles.catEmoji}>{PAYMENT_METHODS[p].icon}</Text>
              <Text style={[styles.catChipText, payment === p && styles.catChipTextActive]}>{PAYMENT_METHODS[p].label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Fund source — where is this money coming from? */}
        {sources.length > 0 && (
          <>
            <Text style={styles.label}>Are you using an advance?</Text>
            <View style={styles.categoryGrid}>
              <TouchableOpacity style={[styles.payChip, advanceEntryId === '' && styles.payChipActive]} onPress={() => setAdvanceEntryId('')}>
                <Text style={styles.catEmoji}>🏦</Text>
                <Text style={[styles.catChipText, advanceEntryId === '' && styles.catChipTextActive]}>Main Balance</Text>
              </TouchableOpacity>
              {sources.map(s => (
                <TouchableOpacity key={s.id} style={[styles.payChip, advanceEntryId === s.id && styles.payChipActive]} onPress={() => setAdvanceEntryId(s.id)}>
                  <Text style={styles.catEmoji}>🤝</Text>
                  <Text style={[styles.catChipText, advanceEntryId === s.id && styles.catChipTextActive]}>
                    {s.giverName} · {formatMoney(s.remaining)} left
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        <Text style={styles.label}>Date</Text>
        <TextInput style={styles.input} value={date} onChangeText={setDate} placeholder="yyyy-MM-dd" placeholderTextColor={COLORS.textLight} />

        <Text style={styles.label}>Notes</Text>
        <TextInput style={[styles.input, styles.textarea]} value={notes} onChangeText={setNotes}
          placeholder="Add a note (text keyboard)..." placeholderTextColor={COLORS.textLight} multiline numberOfLines={3} />

        <View style={styles.switchRow}>
          <Text style={styles.label}>Recurring Expense</Text>
          <Switch value={isRecurring} onValueChange={setIsRecurring} trackColor={{ true: COLORS.primary }} thumbColor="#fff" />
        </View>

        <TouchableOpacity style={styles.receiptBtn} onPress={pickReceipt}>
          <Text style={styles.receiptBtnText}>{receiptUri ? '✅ Receipt Attached' : '📎 Attach Receipt'}</Text>
        </TouchableOpacity>

        {approvalMode && currentUser?.role !== 'admin' && (
          <View style={styles.approvalNote}>
            <Text style={styles.approvalNoteText}>⚠️ Approval mode is ON. Your entry will be submitted for review.</Text>
          </View>
        )}

        <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
          <Text style={styles.saveBtnText}>{saving ? 'Saving...' : editing ? 'Update Expense' : 'Save Expense'}</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Numpad modal */}
      <Modal visible={padOpen} transparent animationType="slide" onRequestClose={() => setPadOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.amountPreview}><Text style={styles.amountPreviewText}>Rs. {amount}</Text></View>
            <NumberPad value={amount} onChange={setAmount} onDone={() => setPadOpen(false)} onClear={() => setAmount('0')} />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAFAF7' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  backBtn: { padding: 4, width: 60 },
  backText: { color: COLORS.primary, fontWeight: '700', fontSize: responsiveFontSize(15) },
  title: { fontSize: responsiveFontSize(18), fontWeight: '800', color: COLORS.text },
  scroll: { flex: 1, paddingHorizontal: 16 },
  amountCard: { backgroundColor: COLORS.primary, borderRadius: 18, padding: 20, alignItems: 'center', marginBottom: 8, shadowColor: COLORS.primary, shadowOpacity: 0.3, shadowRadius: 12, elevation: 4 },
  amountLabel: { color: 'rgba(255,255,255,0.8)', fontSize: responsiveFontSize(12), fontWeight: '600' },
  amountValue: { color: '#fff', fontSize: responsiveFontSize(34), fontWeight: '800', marginTop: 6 },
  amountHint: { color: 'rgba(255,255,255,0.7)', fontSize: responsiveFontSize(11), fontWeight: '500', marginTop: 6 },
  label: { fontSize: responsiveFontSize(13), fontWeight: '700', color: COLORS.text, marginTop: 18, marginBottom: 10 },
  row: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: '#fff' },
  chipActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary },
  chipText: { fontSize: responsiveFontSize(13), color: COLORS.textMed, fontWeight: '600' },
  chipTextActive: { color: '#fff', fontWeight: '700' },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 14, backgroundColor: '#fff', borderWidth: 1, borderColor: COLORS.border },
  catChipActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '12' },
  catEmoji: { fontSize: 15 },
  catChipText: { fontSize: responsiveFontSize(12), color: COLORS.textMed, fontWeight: '600' },
  catChipTextActive: { color: COLORS.primary, fontWeight: '700' },
  payChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 14, backgroundColor: '#fff', borderWidth: 1, borderColor: COLORS.border },
  payChipActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '12' },
  input: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, padding: 14, fontSize: responsiveFontSize(15), color: COLORS.text },
  textarea: { height: 80, textAlignVertical: 'top' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  receiptBtn: { backgroundColor: '#fff', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 14, borderWidth: 1, borderColor: COLORS.border },
  receiptBtnText: { color: COLORS.text, fontWeight: '600', fontSize: responsiveFontSize(14) },
  approvalNote: { backgroundColor: '#FEF3C7', borderRadius: 12, padding: 12, marginTop: 14 },
  approvalNoteText: { color: '#1A1A1A', fontSize: responsiveFontSize(12), fontWeight: '500' },
  saveBtn: { backgroundColor: COLORS.primary, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 24 },
  saveBtnText: { color: '#fff', fontWeight: '800', fontSize: responsiveFontSize(16) },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(26,26,26,0.55)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#FAFAF7', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 10 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#ECECE6', alignSelf: 'center', marginBottom: 8 },
  amountPreview: { alignItems: 'center', paddingVertical: 10 },
  amountPreviewText: { fontSize: responsiveFontSize(34), fontWeight: '800', color: COLORS.primary },
});
