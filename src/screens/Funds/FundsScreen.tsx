import React, { useMemo, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal, TextInput, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { format } from 'date-fns';
import { useStore } from '../../store/useStore';
import { COLORS, GRADIENTS, USERS, CATEGORY_EMOJI } from '../../constants';
import { AdvanceDirection, Advance } from '../../types';
import { formatMoney } from '../../utils/currency';
import { withBalance, fundsSummary } from '../../utils/funds';
import { responsiveFontSize } from '../../utils/responsive';

export default function FundsScreen() {
  const navigation = useNavigation<any>();
  const { advances, expenses, incomes, saveAdvance, settleAdvance, reopenAdvance, deleteAdvance } = useStore();

  const [formDir, setFormDir] = useState<AdvanceDirection | null>(null);
  const [person, setPerson] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [detailId, setDetailId] = useState<string | null>(null);

  const summary = useMemo(() => fundsSummary(incomes, expenses, advances), [incomes, expenses, advances]);
  const rows = useMemo(
    () => advances.map(a => withBalance(a, expenses)).sort((a, b) => {
      if (a.status !== b.status) return a.status === 'active' ? -1 : 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }),
    [advances, expenses]
  );
  const detail = useMemo(() => rows.find(r => r.id === detailId) ?? null, [rows, detailId]);
  const detailTx = useMemo(
    () => detail ? expenses.filter(e => e.advanceId === detail.id && e.status !== 'rejected').sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) : [],
    [detail, expenses]
  );

  const openForm = (dir: AdvanceDirection) => { setFormDir(dir); setPerson(''); setAmount(''); setNotes(''); };

  const submitForm = async () => {
    const amt = Number(amount);
    if (!person.trim()) { Alert.alert('Missing', 'Enter a person name.'); return; }
    if (isNaN(amt) || amt <= 0) { Alert.alert('Missing', 'Enter a valid amount.'); return; }
    await saveAdvance({ direction: formDir!, person, amount: amt, date: format(new Date(), 'yyyy-MM-dd'), notes });
    setFormDir(null);
  };

  const onSettle = (a: ReturnType<typeof withBalance>) => {
    const opts: any[] = [{ text: 'Cancel', style: 'cancel' }];
    if (a.remaining > 0) {
      opts.push({ text: `Return ${formatMoney(a.remaining)} to Main`, onPress: () => settleAdvance(a.id, a.remaining) });
      opts.push({ text: 'Mark Consumed (no return)', onPress: () => settleAdvance(a.id, 0) });
    } else {
      opts.push({ text: 'Mark Settled', onPress: () => settleAdvance(a.id, 0) });
    }
    Alert.alert('Settle advance', `${a.person} · ${formatMoney(a.remaining)} remaining`, opts);
  };

  const confirmDelete = (a: Advance) => {
    Alert.alert('Delete advance', `Remove the ${a.direction} advance with ${a.person}? Linked expenses stay but lose their source.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await deleteAdvance(a.id); setDetailId(null); } },
    ]);
  };

  return (
    <View style={styles.root}>
      <LinearGradient colors={GRADIENTS.header as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <SafeAreaView edges={['top']}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}><Text style={styles.headerBtnText}>‹</Text></TouchableOpacity>
            <Text style={styles.headerTitle}>Funds & Advances</Text>
            <View style={styles.headerBtn} />
          </View>
          <View style={styles.mainBalanceWrap}>
            <Text style={styles.mainBalanceLabel}>Main Balance</Text>
            <Text style={[styles.mainBalanceAmt, summary.mainBalance < 0 && { color: '#1A1A1A' }]}>
              {summary.mainBalance < 0 ? '− ' : ''}{formatMoney(Math.abs(summary.mainBalance))}
            </Text>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 60 }}>
        {/* Summary widgets */}
        <View style={styles.statRow}>
          <View style={styles.statCard}><Text style={styles.statLabel}>Active</Text><Text style={styles.statVal}>{summary.activeCount}</Text></View>
          <View style={styles.statCard}><Text style={styles.statLabel}>Outstanding</Text><Text style={styles.statVal}>{formatMoney(summary.outstanding)}</Text></View>
        </View>
        <View style={styles.statRow}>
          <View style={styles.statCard}><Text style={styles.statLabel}>Given (out)</Text><Text style={styles.statVal}>{formatMoney(summary.totalGiven)}</Text></View>
          <View style={styles.statCard}><Text style={styles.statLabel}>Received (in)</Text><Text style={styles.statVal}>{formatMoney(summary.totalReceived)}</Text></View>
        </View>

        {/* Actions */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: COLORS.primary }]} onPress={() => openForm('given')}>
            <Text style={styles.actionBtnText}>🤝  Give Advance</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: COLORS.accent }]} onPress={() => openForm('received')}>
            <Text style={[styles.actionBtnText, { color: '#1A1A1A' }]}>📥  Receive</Text>
          </TouchableOpacity>
        </View>

        {/* List */}
        <Text style={styles.sectionTitle}>All Advances</Text>
        {rows.length === 0 ? (
          <View style={styles.empty}><Text style={{ fontSize: 40 }}>💸</Text><Text style={styles.emptyText}>No advances yet</Text></View>
        ) : rows.map(a => {
          const pct = a.amount > 0 ? Math.min(a.spent / a.amount, 1) : 0;
          return (
            <TouchableOpacity key={a.id} style={[styles.advCard, a.status === 'settled' && { opacity: 0.6 }]} onPress={() => setDetailId(a.id)} activeOpacity={0.7}>
              <View style={styles.advTop}>
                <View style={styles.advTitleRow}>
                  <Text style={styles.advIcon}>{a.direction === 'given' ? '🤝' : '📥'}</Text>
                  <View>
                    <Text style={styles.advPerson}>{a.person}</Text>
                    <Text style={styles.advType}>{a.direction === 'given' ? 'Given' : 'Received'} · {format(new Date(a.date), 'dd MMM yyyy')}</Text>
                  </View>
                </View>
                <View style={[styles.statusPill, { backgroundColor: a.status === 'active' ? COLORS.accentSoft : '#F5F5F0' }]}>
                  <Text style={[styles.statusPillText, { color: a.status === 'active' ? COLORS.accentDark : COLORS.textMed }]}>{a.status}</Text>
                </View>
              </View>
              <View style={styles.advNums}>
                <View><Text style={styles.advNumLabel}>Original</Text><Text style={styles.advNumVal}>{formatMoney(a.amount)}</Text></View>
                <View><Text style={styles.advNumLabel}>Used</Text><Text style={styles.advNumVal}>{formatMoney(a.spent)}</Text></View>
                <View><Text style={styles.advNumLabel}>Remaining</Text><Text style={[styles.advNumVal, { color: COLORS.accentDark }]}>{formatMoney(a.remaining)}</Text></View>
              </View>
              <View style={styles.barBg}><View style={[styles.barFill, { width: `${pct * 100}%` as any }]} /></View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Give / Receive form modal */}
      <Modal visible={!!formDir} transparent animationType="slide" onRequestClose={() => setFormDir(null)}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.handle} />
            <Text style={styles.sheetTitle}>{formDir === 'given' ? '🤝 Give Advance' : '📥 Receive Advance'}</Text>
            <Text style={styles.fieldLabel}>{formDir === 'given' ? 'Person you are giving to' : 'Person you received from'}</Text>
            <TextInput style={styles.input} value={person} onChangeText={setPerson} placeholder="e.g. Ali" placeholderTextColor={COLORS.textLight} />
            <Text style={styles.fieldLabel}>Amount (Rs.)</Text>
            <TextInput style={styles.input} value={amount} onChangeText={setAmount} keyboardType="numeric" placeholder="0" placeholderTextColor={COLORS.textLight} />
            <Text style={styles.fieldLabel}>Notes (optional)</Text>
            <TextInput style={styles.input} value={notes} onChangeText={setNotes} placeholder="Purpose…" placeholderTextColor={COLORS.textLight} />
            <View style={styles.sheetActions}>
              <TouchableOpacity style={[styles.sheetBtn, { backgroundColor: '#F5F5F0' }]} onPress={() => setFormDir(null)}><Text style={styles.sheetBtnTextDark}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.sheetBtn, { backgroundColor: COLORS.primary }]} onPress={submitForm}><Text style={styles.sheetBtnText}>Save</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Detail modal */}
      <Modal visible={!!detail} transparent animationType="slide" onRequestClose={() => setDetailId(null)}>
        <View style={styles.overlay}>
          <View style={[styles.sheet, { maxHeight: '88%' }]}>
            <View style={styles.handle} />
            {detail && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.detailHead}>
                  <Text style={styles.detailPerson}>{detail.direction === 'given' ? '🤝' : '📥'} {detail.person}</Text>
                  <TouchableOpacity onPress={() => setDetailId(null)}><Text style={styles.close}>Done</Text></TouchableOpacity>
                </View>
                <Text style={styles.detailMeta}>{detail.direction === 'given' ? 'Given' : 'Received'} · {format(new Date(detail.date), 'dd MMM yyyy')} · {detail.status}</Text>
                {detail.notes ? <Text style={styles.detailNotes}>📝 {detail.notes}</Text> : null}

                <View style={styles.detailNums}>
                  <View style={styles.detailNumCard}><Text style={styles.advNumLabel}>Original</Text><Text style={styles.detailNumVal}>{formatMoney(detail.amount)}</Text></View>
                  <View style={styles.detailNumCard}><Text style={styles.advNumLabel}>Used</Text><Text style={styles.detailNumVal}>{formatMoney(detail.spent)}</Text></View>
                  <View style={styles.detailNumCard}><Text style={styles.advNumLabel}>Remaining</Text><Text style={[styles.detailNumVal, { color: COLORS.accentDark }]}>{formatMoney(detail.remaining)}</Text></View>
                </View>
                {detail.returnedAmount ? <Text style={styles.returnedNote}>Returned to Main: {formatMoney(detail.returnedAmount)}</Text> : null}

                <View style={styles.detailActions}>
                  {detail.status === 'active' ? (
                    <TouchableOpacity style={[styles.sheetBtn, { backgroundColor: COLORS.primary, flex: 1 }]} onPress={() => onSettle(detail)}>
                      <Text style={styles.sheetBtnText}>Settle</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity style={[styles.sheetBtn, { backgroundColor: '#F5F5F0', flex: 1 }]} onPress={() => reopenAdvance(detail.id)}>
                      <Text style={styles.sheetBtnTextDark}>Reopen</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={[styles.sheetBtn, { backgroundColor: '#F5F5F0' }]} onPress={() => confirmDelete(detail)}>
                    <Text style={[styles.sheetBtnTextDark, { color: COLORS.danger }]}>Delete</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.sectionTitle}>Transactions ({detailTx.length})</Text>
                {detailTx.length === 0 ? <Text style={styles.emptyText}>No spending from this advance yet</Text> : detailTx.map(e => {
                  const u = USERS.find(x => x.id === e.enteredBy);
                  return (
                    <View key={e.id} style={styles.txRow}>
                      <Text style={styles.txEmoji}>{CATEGORY_EMOJI[e.category] ?? '💰'}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.txCat}>{e.category}</Text>
                        <Text style={styles.txMeta}>{format(new Date(e.date), 'dd MMM')} · {u?.name ?? '—'}</Text>
                      </View>
                      <Text style={styles.txAmt}>{formatMoney(e.amount)}</Text>
                    </View>
                  );
                })}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8 },
  headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerBtnText: { color: '#1A1A1A', fontSize: 34, fontWeight: '300', lineHeight: 36 },
  headerTitle: { color: '#1A1A1A', fontSize: responsiveFontSize(18), fontWeight: '800' },
  mainBalanceWrap: { alignItems: 'center', paddingBottom: 18, paddingTop: 4 },
  mainBalanceLabel: { color: 'rgba(26,26,26,0.7)', fontSize: responsiveFontSize(12), fontWeight: '600' },
  mainBalanceAmt: { color: '#1A1A1A', fontSize: responsiveFontSize(30), fontWeight: '800', marginTop: 2 },
  scroll: { flex: 1 },
  statRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 14, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  statLabel: { fontSize: responsiveFontSize(11), color: COLORS.textLight, fontWeight: '600' },
  statVal: { fontSize: responsiveFontSize(17), color: COLORS.text, fontWeight: '800', marginTop: 4 },
  actionRow: { flexDirection: 'row', gap: 12, marginVertical: 6, marginBottom: 18 },
  actionBtn: { flex: 1, borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  actionBtnText: { color: '#fff', fontWeight: '800', fontSize: responsiveFontSize(14) },
  sectionTitle: { fontSize: responsiveFontSize(15), fontWeight: '800', color: COLORS.text, marginBottom: 12, marginTop: 8 },
  empty: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: responsiveFontSize(13), color: COLORS.textLight, fontWeight: '600', marginTop: 8, textAlign: 'center' },
  advCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  advTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  advTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  advIcon: { fontSize: 22 },
  advPerson: { fontSize: responsiveFontSize(15), fontWeight: '800', color: COLORS.text },
  advType: { fontSize: responsiveFontSize(11), color: COLORS.textLight, fontWeight: '500', marginTop: 1 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusPillText: { fontSize: responsiveFontSize(10), fontWeight: '800', textTransform: 'capitalize' },
  advNums: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  advNumLabel: { fontSize: responsiveFontSize(10), color: COLORS.textLight, fontWeight: '600' },
  advNumVal: { fontSize: responsiveFontSize(14), color: COLORS.text, fontWeight: '800', marginTop: 2 },
  barBg: { height: 8, backgroundColor: '#F5F5F0', borderRadius: 4, overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 4, backgroundColor: COLORS.accent },
  overlay: { flex: 1, backgroundColor: 'rgba(26,26,26,0.55)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: COLORS.background, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 10, paddingHorizontal: 16, paddingBottom: 28 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#CBCBC2', alignSelf: 'center', marginBottom: 14 },
  sheetTitle: { fontSize: responsiveFontSize(18), fontWeight: '800', color: COLORS.text, marginBottom: 14 },
  fieldLabel: { fontSize: responsiveFontSize(12), fontWeight: '700', color: COLORS.textMed, marginBottom: 6, marginTop: 8 },
  input: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, padding: 14, fontSize: responsiveFontSize(15), color: COLORS.text },
  sheetActions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  sheetBtn: { borderRadius: 12, paddingVertical: 14, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center' },
  sheetBtnText: { color: '#fff', fontWeight: '800', fontSize: responsiveFontSize(14) },
  sheetBtnTextDark: { color: COLORS.text, fontWeight: '800', fontSize: responsiveFontSize(14) },
  detailHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  detailPerson: { fontSize: responsiveFontSize(18), fontWeight: '800', color: COLORS.text },
  close: { fontSize: responsiveFontSize(14), color: COLORS.primary, fontWeight: '700' },
  detailMeta: { fontSize: responsiveFontSize(12), color: COLORS.textMed, fontWeight: '600', marginTop: 4, textTransform: 'capitalize' },
  detailNotes: { fontSize: responsiveFontSize(12), color: COLORS.textMed, marginTop: 8, fontWeight: '500' },
  detailNums: { flexDirection: 'row', gap: 10, marginTop: 16 },
  detailNumCard: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 12 },
  detailNumVal: { fontSize: responsiveFontSize(14), color: COLORS.text, fontWeight: '800', marginTop: 2 },
  returnedNote: { fontSize: responsiveFontSize(11), color: COLORS.accentDark, fontWeight: '700', marginTop: 8 },
  detailActions: { flexDirection: 'row', gap: 12, marginTop: 16, marginBottom: 8 },
  txRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 8 },
  txEmoji: { fontSize: 20 },
  txCat: { fontSize: responsiveFontSize(13), fontWeight: '700', color: COLORS.text },
  txMeta: { fontSize: responsiveFontSize(10), color: COLORS.textLight, fontWeight: '500', marginTop: 2 },
  txAmt: { fontSize: responsiveFontSize(14), fontWeight: '800', color: COLORS.text },
});
