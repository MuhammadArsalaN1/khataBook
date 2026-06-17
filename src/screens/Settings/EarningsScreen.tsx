import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Alert, SafeAreaView as RNSafeAreaView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { format } from 'date-fns';
import { useStore } from '../../store/useStore';
import { COLORS, TYPE_LABELS, TYPE_COLORS, TYPE_LIGHT, TYPE_ICONS } from '../../constants';
import { ExpenseType } from '../../types';

export default function EarningsScreen() {
  const { incomes, expenses, saveIncome } = useStore();
  const navigation = useNavigation<any>();
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

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
      personal: expenses.filter(e => e.type === 'personal' && e.date.startsWith(monthStr) && e.status !== 'rejected').reduce((s, e) => s + e.amount, 0),
      office: expenses.filter(e => e.type === 'office' && e.date.startsWith(monthStr) && e.status !== 'rejected').reduce((s, e) => s + e.amount, 0),
      farm: expenses.filter(e => e.type === 'farm' && e.date.startsWith(monthStr) && e.status !== 'rejected').reduce((s, e) => s + e.amount, 0),
    };
  }, [expenses]);

  const totalExpenses = Object.values(expenses_byType).reduce((s, v) => s + v, 0);
  const balance = totalIncome - totalExpenses;

  const handleSaveIncome = async (type: ExpenseType) => {
    const val = Number(inputs[type]);
    if (isNaN(val) || val < 0) {
      Alert.alert('Invalid', 'Enter a valid income amount.');
      return;
    }
    await saveIncome(type, val, month, year);
    Alert.alert('Saved', `${TYPE_LABELS[type]} income set to Rs. ${val.toLocaleString()}`);
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
        <Text style={styles.monthLabel}>{format(now, 'MMMM yyyy')}</Text>

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
                  <Text style={styles.rowLabel}>Income</Text>
                  <View style={styles.inputRow}>
                    <TextInput
                      style={styles.input}
                      value={inputs[type]}
                      onChangeText={val => setInputs(prev => ({ ...prev, [type]: val }))}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor={COLORS.textLight}
                    />
                    <TouchableOpacity style={styles.saveSmallBtn} onPress={() => handleSaveIncome(type)}>
                      <Text style={styles.saveSmallBtnText}>Save</Text>
                    </TouchableOpacity>
                  </View>
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
  inputRow: { flexDirection: 'row', gap: 6 },
  input: { flex: 1, backgroundColor: COLORS.white, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border, padding: 10, fontSize: 14, color: COLORS.text },
  saveSmallBtn: { backgroundColor: COLORS.primary, borderRadius: 8, paddingHorizontal: 12, justifyContent: 'center' },
  saveSmallBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 12 },
  expenseBox: { width: 90 },
  expenseAmount: { fontSize: 14, fontWeight: '800', color: COLORS.danger, marginTop: 4 },
  progressContainer: { marginTop: 8 },
  progressBar: { height: 6, backgroundColor: COLORS.border, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 3 },
  progressText: { fontSize: 10, color: COLORS.textLight, marginTop: 4 },
});
