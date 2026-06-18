import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Alert, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { format } from 'date-fns';
import { useStore } from '../../store/useStore';
import { COLORS, TYPE_LABELS, TYPE_COLORS, TYPE_LIGHT, TYPE_ICONS } from '../../constants';
import { ExpenseType } from '../../types';
import { getActiveFiscalMonth } from '../../utils/fiscalMonth';
import { formatMoney } from '../../utils/currency';
import { responsiveFontSize } from '../../utils/responsive';
import NumberPad from '../../components/common/NumberPad';

export default function EarningsScreen() {
  const { incomes, expenses, saveIncome } = useStore();
  const navigation = useNavigation<any>();
  const now = new Date();
  const fiscal = getActiveFiscalMonth(now);
  const { month, year } = fiscal;
  const [padType, setPadType] = useState<ExpenseType | null>(null);
  const [padValue, setPadValue] = useState('0');

  const [inputs, setInputs] = useState<Record<ExpenseType, string>>({
    personal: incomes.find(i => i.type === 'personal' && i.month === month && i.year === year)?.amount.toString() ?? '',
    office: incomes.find(i => i.type === 'office' && i.month === month && i.year === year)?.amount.toString() ?? '',
    farm: incomes.find(i => i.type === 'farm' && i.month === month && i.year === year)?.amount.toString() ?? '',
  });

  const totalIncome = useMemo(() =>
    Object.values(inputs).reduce((s, v) => s + (Number(v) || 0), 0),
    [inputs]
  );

  const expenses_byType = useMemo(() => {
    const monthStr = format(now, 'yyyy-MM');
    return {
      personal: expenses.filter(e => e.type === 'personal' && e.date.startsWith(monthStr) && e.status !== 'rejected' && e.status !== 'pending').reduce((s, e) => s + e.amount, 0),
      office: expenses.filter(e => e.type === 'office' && e.date.startsWith(monthStr) && e.status !== 'rejected' && e.status !== 'pending').reduce((s, e) => s + e.amount, 0),
      farm: expenses.filter(e => e.type === 'farm' && e.date.startsWith(monthStr) && e.status !== 'rejected' && e.status !== 'pending').reduce((s, e) => s + e.amount, 0),
    };
  }, [expenses]);

  const totalExpenses = Object.values(expenses_byType).reduce((s, v) => s + v, 0);
  const balance = totalIncome - totalExpenses;

  const openPad = (type: ExpenseType) => {
    setPadValue(inputs[type] || '0');
    setPadType(type);
  };

  const handleSaveIncome = async () => {
    if (!padType) return;
    const val = Number(padValue);
    if (isNaN(val) || val < 0) { Alert.alert('Invalid', 'Enter a valid income amount.'); return; }
    setInputs(prev => ({ ...prev, [padType]: padValue }));
    await saveIncome(padType, val, month, year);
    setPadType(null);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Earnings & Income</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.monthLabel}>{fiscal.label}</Text>

        {/* Summary Cards */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { backgroundColor: COLORS.success + '15', borderColor: COLORS.success }]}>
            <Text style={styles.summaryLabel}>Total Income</Text>
            <Text style={[styles.summaryAmount, { color: COLORS.success }]}>Rs. {totalIncome.toLocaleString()}</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: COLORS.danger + '15', borderColor: COLORS.danger }]}>
            <Text style={styles.summaryLabel}>Total Expenses</Text>
            <Text style={[styles.summaryAmount, { color: COLORS.danger }]}>Rs. {totalExpenses.toLocaleString()}</Text>
          </View>
          <View style={[styles.summaryCard, {
            backgroundColor: balance >= 0 ? COLORS.success + '15' : COLORS.danger + '15',
            borderColor: balance >= 0 ? COLORS.success : COLORS.danger,
          }]}>
            <Text style={styles.summaryLabel}>Balance</Text>
            <Text style={[styles.summaryAmount, { color: balance >= 0 ? COLORS.success : COLORS.danger }]}>
              {balance >= 0 ? '✓' : '✗'} Rs. {Math.abs(balance).toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Income Cards for Each Type */}
        <Text style={styles.sectionTitle}>Set Monthly Income</Text>
        {(['personal', 'office', 'farm'] as ExpenseType[]).map(type => {
          const income = Number(inputs[type]) || 0;
          const exp = expenses_byType[type];
          const typeBalance = income - exp;
          const balanceColor = typeBalance >= 0 ? COLORS.success : typeBalance < -100 ? COLORS.danger : COLORS.warning;

          return (
            <View key={type} style={[styles.typeCard, { backgroundColor: TYPE_LIGHT[type] }]}>
              <View style={styles.typeCardHeader}>
                <View style={styles.typeCardTitleRow}>
                  <Text style={styles.typeIcon}>{TYPE_ICONS[type]}</Text>
                  <View>
                    <Text style={[styles.typeCardTitle, { color: TYPE_COLORS[type] }]}>{TYPE_LABELS[type]}</Text>
                    <Text style={styles.typeCardSub}>{format(now, 'MMMM yyyy')}</Text>
                  </View>
                </View>
                <View style={[styles.balanceBadge, { backgroundColor: balanceColor + '20' }]}>
                  <Text style={[styles.balanceText, { color: balanceColor }]}>
                    {typeBalance >= 0 ? '+' : ''}Rs. {typeBalance.toLocaleString()}
                  </Text>
                </View>
              </View>

              <View style={styles.typeCardRow}>
                <View style={styles.incomeInput}>
                  <Text style={styles.rowLabel}>Income (tap to edit)</Text>
                  <TouchableOpacity style={styles.incomeTap} onPress={() => openPad(type)} activeOpacity={0.7}>
                    <Text style={styles.incomeTapText}>{formatMoney(income)}</Text>
                    <Text style={styles.incomeTapIcon}>🔢</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.expenseBox}>
                  <Text style={styles.rowLabel}>Expenses</Text>
                  <Text style={styles.expenseAmount}>Rs. {exp.toLocaleString()}</Text>
                </View>
              </View>

              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: income > 0 ? `${Math.min((exp / income) * 100, 100)}%` : '0%',
                        backgroundColor: exp > income * 0.8 ? COLORS.danger : exp > income * 0.5 ? COLORS.warning : COLORS.success,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>
                  {income > 0 ? ((exp / income) * 100).toFixed(0) : 0}% spent of income
                </Text>
              </View>
            </View>
          );
        })}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Numpad modal */}
      <Modal visible={!!padType} transparent animationType="slide" onRequestClose={() => setPadType(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            {padType && (
              <>
                <View style={styles.modalHeaderRow}>
                  <Text style={styles.modalTitle}>{TYPE_ICONS[padType]} {TYPE_LABELS[padType]} Income</Text>
                  <Text style={styles.modalSub}>{fiscal.label}</Text>
                </View>
                <View style={styles.amountPreview}><Text style={styles.amountPreviewText}>Rs. {padValue}</Text></View>
                <NumberPad value={padValue} onChange={setPadValue} onDone={handleSaveIncome} onClear={() => setPadValue('0')} />
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  backBtn: { padding: 4 },
  backText: { color: COLORS.primary, fontWeight: '600', fontSize: 14 },
  title: { fontSize: 18, fontWeight: '800', color: COLORS.text },
  scroll: { flex: 1, paddingHorizontal: 16 },
  monthLabel: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginTop: 16, marginBottom: 12 },
  summaryRow: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  summaryCard: { flex: 1, borderRadius: 12, padding: 12, borderWidth: 2, alignItems: 'center' },
  summaryLabel: { fontSize: 11, color: COLORS.textLight, fontWeight: '500' },
  summaryAmount: { fontSize: 15, fontWeight: '800', marginTop: 4, textAlign: 'center' },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 12 },
  typeCard: { borderRadius: 14, padding: 14, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  typeCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  typeCardTitleRow: { flexDirection: 'row', alignItems: 'center' },
  typeIcon: { fontSize: 24, marginRight: 10 },
  typeCardTitle: { fontSize: 15, fontWeight: '700' },
  typeCardSub: { fontSize: 11, color: COLORS.textLight, marginTop: 2 },
  balanceBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  balanceText: { fontSize: 12, fontWeight: '700' },
  typeCardRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  incomeInput: { flex: 1 },
  rowLabel: { fontSize: 11, color: COLORS.textLight, fontWeight: '600', marginBottom: 4 },
  incomeTap: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.white, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 12, paddingVertical: 11 },
  incomeTapText: { fontSize: responsiveFontSize(15), fontWeight: '800', color: COLORS.text },
  incomeTapIcon: { fontSize: 16 },
  expenseBox: { width: 90 },
  expenseAmount: { fontSize: 14, fontWeight: '800', color: COLORS.danger, marginTop: 4 },
  progressContainer: { marginTop: 8 },
  progressBar: { height: 6, backgroundColor: COLORS.border, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 3 },
  progressText: { fontSize: 10, color: COLORS.textLight, marginTop: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(26,26,26,0.55)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#FAFAF7', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 10 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#ECECE6', alignSelf: 'center', marginBottom: 8 },
  modalHeaderRow: { alignItems: 'center', paddingBottom: 4 },
  modalTitle: { fontSize: responsiveFontSize(16), fontWeight: '800', color: COLORS.text },
  modalSub: { fontSize: responsiveFontSize(12), color: COLORS.textLight, fontWeight: '500', marginTop: 2 },
  amountPreview: { alignItems: 'center', paddingVertical: 10 },
  amountPreviewText: { fontSize: responsiveFontSize(34), fontWeight: '800', color: COLORS.primary },
});
