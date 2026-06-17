import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, TYPE_LABELS, TYPE_COLORS } from '../../constants';
import { Budget } from '../../types';
import { ExpenseType } from '../../types';

interface Props {
  type: ExpenseType;
  budget?: Budget;
  spent: number;
}

export default function BudgetBar({ type, budget, spent }: Props) {
  if (!budget) return null;
  const pct = Math.min((spent / budget.limit) * 100, 100);
  const color = pct >= 100 ? COLORS.danger : pct >= 80 ? COLORS.warning : COLORS.success;

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={styles.label}>{TYPE_LABELS[type]}</Text>
        <Text style={styles.amounts}>
          Rs. {spent.toLocaleString()} / {budget.limit.toLocaleString()}
        </Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
      <Text style={[styles.pct, { color }]}>{pct.toFixed(0)}% used</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 14 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  amounts: { fontSize: 12, color: COLORS.textLight },
  track: { height: 8, backgroundColor: COLORS.border, borderRadius: 4, overflow: 'hidden' },
  fill: { height: 8, borderRadius: 4 },
  pct: { fontSize: 11, marginTop: 3, fontWeight: '600' },
});
