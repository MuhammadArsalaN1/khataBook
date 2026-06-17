import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet, 
  TouchableOpacity, Alert, Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths, subQuarters } from 'date-fns';
import { useStore } from '../../store/useStore';
import { COLORS, TYPE_LABELS } from '../../constants';
import { filterByDateRange, sumAmounts, sumByType, getCategoryBreakdown } from '../../utils/analytics';

type Period = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export default function ReportsScreen() {
  const { expenses } = useStore();
  const [period, setPeriod] = useState<Period>('monthly');
  const now = new Date();

  const { from, to, label } = useMemo(() => {
    switch (period) {
      case 'daily': return { from: now, to: now, label: format(now, 'dd MMM yyyy') };
      case 'weekly': return { from: startOfWeek(now, { weekStartsOn: 1 }), to: endOfWeek(now, { weekStartsOn: 1 }), label: `Week of ${format(startOfWeek(now, { weekStartsOn: 1 }), 'dd MMM')}` };
      case 'monthly': return { from: startOfMonth(now), to: endOfMonth(now), label: format(now, 'MMMM yyyy') };
      case 'quarterly': return { from: startOfMonth(subMonths(now, 2)), to: endOfMonth(now), label: `Q ${format(now, 'QQQ yyyy')}` };
      case 'yearly': return { from: startOfYear(now), to: endOfYear(now), label: format(now, 'yyyy') };
    }
  }, [period]);

  const periodExp = useMemo(() =>
    filterByDateRange(expenses.filter(e => e.status !== 'rejected'), from, to),
    [expenses, from, to]
  );

  const byType = useMemo(() => sumByType(periodExp), [periodExp]);
  const total = useMemo(() => sumAmounts(periodExp), [periodExp]);
  const topCats = useMemo(() => getCategoryBreakdown(periodExp).slice(0, 5), [periodExp]);

  const handleExport = async (format: 'csv' | 'text') => {
    if (format === 'csv') {
      const header = 'Date,Type,Category,Amount,Payment,Notes,User,Status';
      const rows = periodExp.map(e =>
        `${e.date},${e.type},${e.category},${e.amount},${e.paymentMethod},"${e.notes}",${e.enteredBy},${e.status}`
      ).join('\n');
      await Share.share({ message: `${header}\n${rows}`, title: `KhataBook ${label} Report` });
    } else {
      let text = `KHATA BOOK REPORT - ${label}\n${'='.repeat(40)}\n\n`;
      text += `SUMMARY\n`;
      text += `Total: Rs. ${total.toLocaleString()}\n`;
      text += `Personal: Rs. ${byType.personal.toLocaleString()}\n`;
      text += `Office: Rs. ${byType.office.toLocaleString()}\n`;
      text += `Farm: Rs. ${byType.farm.toLocaleString()}\n\n`;
      text += `TOP CATEGORIES\n`;
      topCats.forEach(c => { text += `${c.category}: Rs. ${c.amount.toLocaleString()}\n`; });
      text += `\nDETAILS\n`;
      periodExp.forEach(e => {
        text += `${e.date} | ${e.type} | ${e.category} | Rs. ${e.amount} | ${e.paymentMethod}\n`;
        if (e.notes) text += `  Notes: ${e.notes}\n`;
      });
      await Share.share({ message: text, title: `KhataBook ${label} Report` });
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Reports</Text>

        {/* Period Selector */}
        <View style={styles.periodRow}>
          {(['daily', 'weekly', 'monthly', 'quarterly', 'yearly'] as Period[]).map(p => (
            <TouchableOpacity
              key={p}
              style={[styles.periodBtn, period === p && styles.periodBtnActive]}
              onPress={() => setPeriod(p)}
            >
              <Text style={[styles.periodText, period === p && styles.periodTextActive]}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.periodLabel}>{label}</Text>

        {/* Summary */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Financial Summary</Text>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Combined Total</Text>
            <Text style={styles.totalValue}>Rs. {total.toLocaleString()}</Text>
          </View>
          {(['personal', 'office', 'farm'] as const).map(t => (
            <View key={t} style={styles.typeRow}>
              <Text style={styles.typeLabel}>{TYPE_LABELS[t]}</Text>
              <View style={styles.typeRight}>
                <Text style={styles.typeAmount}>Rs. {byType[t].toLocaleString()}</Text>
                <Text style={styles.typePct}>{total > 0 ? ((byType[t] / total) * 100).toFixed(1) : 0}%</Text>
              </View>
            </View>
          ))}
          <Text style={styles.entryCount}>{periodExp.length} entries</Text>
        </View>

        {/* Top Categories */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Top Categories</Text>
          {topCats.length === 0 ? (
            <Text style={styles.empty}>No data for this period</Text>
          ) : (
            topCats.map((c, i) => (
              <View key={i} style={styles.catRow}>
                <Text style={styles.rank}>#{i + 1}</Text>
                <Text style={styles.catName}>{c.category}</Text>
                <Text style={styles.catAmount}>Rs. {c.amount.toLocaleString()}</Text>
              </View>
            ))
          )}
        </View>

        {/* Expense List */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>All Entries</Text>
          {periodExp.length === 0 ? (
            <Text style={styles.empty}>No entries for this period</Text>
          ) : (
            periodExp.map(e => (
              <View key={e.id} style={styles.entryRow}>
                <View style={styles.entryLeft}>
                  <Text style={styles.entryCategory}>{e.category}</Text>
                  <Text style={styles.entryMeta}>{e.date} • {e.type} • {e.paymentMethod}</Text>
                </View>
                <Text style={styles.entryAmount}>Rs. {e.amount.toLocaleString()}</Text>
              </View>
            ))
          )}
        </View>

        {/* Export Buttons */}
        <View style={styles.exportRow}>
          <TouchableOpacity style={styles.exportBtn} onPress={() => handleExport('text')}>
            <Text style={styles.exportBtnText}>📤 Share Report</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.exportBtn, styles.csvBtn]} onPress={() => handleExport('csv')}>
            <Text style={[styles.exportBtnText, { color: COLORS.success }]}>📊 Export CSV</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1, paddingHorizontal: 16 },
  title: { fontSize: 22, fontWeight: '800', color: COLORS.text, paddingTop: 16, marginBottom: 14 },
  periodRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  periodBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.white },
  periodBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  periodText: { fontSize: 12, color: COLORS.textLight, fontWeight: '600' },
  periodTextActive: { color: COLORS.white },
  periodLabel: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 12 },
  card: { backgroundColor: COLORS.white, borderRadius: 14, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 14 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  totalLabel: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  totalValue: { fontSize: 22, fontWeight: '800', color: COLORS.primary },
  typeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  typeLabel: { fontSize: 13, color: COLORS.textLight },
  typeRight: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  typeAmount: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  typePct: { fontSize: 11, color: COLORS.textLight, width: 36, textAlign: 'right' },
  entryCount: { fontSize: 11, color: COLORS.textLight, marginTop: 8, textAlign: 'right' },
  catRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  rank: { fontSize: 13, color: COLORS.textLight, width: 24 },
  catName: { flex: 1, fontSize: 13, color: COLORS.text, fontWeight: '500' },
  catAmount: { fontSize: 14, fontWeight: '700', color: COLORS.primary },
  entryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  entryLeft: {},
  entryCategory: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  entryMeta: { fontSize: 11, color: COLORS.textLight },
  entryAmount: { fontSize: 14, fontWeight: '700', color: COLORS.primary },
  empty: { textAlign: 'center', color: COLORS.textLight, paddingVertical: 20 },
  exportRow: { flexDirection: 'row', gap: 10 },
  exportBtn: { flex: 1, backgroundColor: COLORS.primary, borderRadius: 10, padding: 14, alignItems: 'center' },
  csvBtn: { backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.success },
  exportBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 14 },
});
