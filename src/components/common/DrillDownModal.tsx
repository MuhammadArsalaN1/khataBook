import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { format } from 'date-fns';
import { COLORS, USERS, CATEGORY_EMOJI } from '../../constants';
import { Expense } from '../../types';
import { formatMoney } from '../../utils/currency';
import { responsiveFontSize } from '../../utils/responsive';

interface Props {
  visible: boolean;
  onClose: () => void;
  title: string;
  color?: string;
  entries: Expense[]; // already filtered to the selected slice
}

const USER_COLORS = [COLORS.primary, COLORS.accentDark];

/**
 * Tap-a-chart drill-down: shows a day-by-day bar graph of the selected
 * category/type plus every entry (date, who, amount, payment).
 */
export default function DrillDownModal({ visible, onClose, title, color = COLORS.accent, entries }: Props) {
  const total = useMemo(() => entries.reduce((s, e) => s + e.amount, 0), [entries]);

  // group by day → { day, total, byUser }
  const days = useMemo(() => {
    const map = new Map<string, { date: Date; total: number }>();
    entries.forEach(e => {
      const key = format(new Date(e.date), 'yyyy-MM-dd');
      const cur = map.get(key) ?? { date: new Date(e.date), total: 0 };
      cur.total += e.amount;
      map.set(key, cur);
    });
    return Array.from(map.values()).sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [entries]);
  const dayMax = Math.max(...days.map(d => d.total), 1);

  // who contributed how much
  const byUser = useMemo(() => USERS.map(u => ({
    user: u,
    total: entries.filter(e => e.enteredBy === u.id).reduce((s, e) => s + e.amount, 0),
  })).filter(x => x.total > 0), [entries]);

  const sorted = useMemo(
    () => [...entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [entries]
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <View style={[styles.dot, { backgroundColor: color }]} />
              <Text style={styles.title}>{title}</Text>
            </View>
            <TouchableOpacity onPress={onClose}><Text style={styles.close}>Done</Text></TouchableOpacity>
          </View>
          <Text style={styles.total}>{formatMoney(total)} · {entries.length} entries</Text>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
            {/* Who contributed */}
            {byUser.length > 0 && (
              <View style={styles.whoRow}>
                {byUser.map((x, i) => (
                  <View key={x.user.id} style={styles.whoCard}>
                    <View style={[styles.whoAvatar, { backgroundColor: USER_COLORS[i % USER_COLORS.length] }]}>
                      <Text style={styles.whoAvatarText}>{x.user.name.charAt(0)}</Text>
                    </View>
                    <View>
                      <Text style={styles.whoName}>{x.user.name}</Text>
                      <Text style={styles.whoAmt}>{formatMoney(x.total)} · {total > 0 ? Math.round(x.total / total * 100) : 0}%</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Daily bar graph */}
            <Text style={styles.sectionLabel}>Daily breakdown</Text>
            <View style={styles.chart}>
              {days.map((d, i) => (
                <View key={i} style={styles.barCol}>
                  <Text style={styles.barVal}>{d.total >= 1000 ? `${(d.total / 1000).toFixed(0)}k` : d.total}</Text>
                  <View style={[styles.bar, { height: Math.max((d.total / dayMax) * 110, 3), backgroundColor: color }]} />
                  <Text style={styles.barDay}>{format(d.date, 'dd')}</Text>
                  <Text style={styles.barMon}>{format(d.date, 'MMM')}</Text>
                </View>
              ))}
            </View>

            {/* Entry list */}
            <Text style={styles.sectionLabel}>All entries</Text>
            {sorted.map(e => {
              const u = USERS.find(x => x.id === e.enteredBy);
              return (
                <View key={e.id} style={styles.entry}>
                  <Text style={styles.entryEmoji}>{CATEGORY_EMOJI[e.category] ?? '💰'}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.entryCat}>{e.category}</Text>
                    <Text style={styles.entryMeta}>
                      {format(new Date(e.date), 'EEE, dd MMM')} · {u?.name ?? '—'} · {e.paymentMethod}
                    </Text>
                  </View>
                  <Text style={styles.entryAmt}>{formatMoney(e.amount)}</Text>
                </View>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(26,26,26,0.55)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: COLORS.background, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 10, paddingHorizontal: 16, maxHeight: '88%' },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#CBCBC2', alignSelf: 'center', marginBottom: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  title: { fontSize: responsiveFontSize(18), fontWeight: '800', color: COLORS.text },
  close: { fontSize: responsiveFontSize(14), color: COLORS.primary, fontWeight: '700' },
  total: { fontSize: responsiveFontSize(13), color: COLORS.textMed, fontWeight: '600', marginTop: 2, marginBottom: 14 },
  whoRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  whoCard: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fff', borderRadius: 12, padding: 12 },
  whoAvatar: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  whoAvatarText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  whoName: { fontSize: responsiveFontSize(13), fontWeight: '700', color: COLORS.text },
  whoAmt: { fontSize: responsiveFontSize(10), color: COLORS.textLight, fontWeight: '600', marginTop: 1 },
  sectionLabel: { fontSize: responsiveFontSize(12), fontWeight: '700', color: COLORS.textLight, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10, marginTop: 4 },
  chart: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, minHeight: 150, marginBottom: 18, paddingTop: 8 },
  barCol: { alignItems: 'center', minWidth: 34 },
  barVal: { fontSize: 9, color: COLORS.textMed, fontWeight: '700', marginBottom: 3 },
  bar: { width: 22, borderTopLeftRadius: 5, borderTopRightRadius: 5 },
  barDay: { fontSize: 11, color: COLORS.text, fontWeight: '700', marginTop: 4 },
  barMon: { fontSize: 8, color: COLORS.textLight, fontWeight: '600' },
  entry: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 8 },
  entryEmoji: { fontSize: 20 },
  entryCat: { fontSize: responsiveFontSize(13), fontWeight: '700', color: COLORS.text },
  entryMeta: { fontSize: responsiveFontSize(10), color: COLORS.textLight, fontWeight: '500', marginTop: 2 },
  entryAmt: { fontSize: responsiveFontSize(14), fontWeight: '800', color: COLORS.text },
});
