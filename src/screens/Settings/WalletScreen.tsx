import React, { useMemo, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Modal, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useStore } from '../../store/useStore';
import { WALLETS, CURRENCIES, COLORS, WalletMeta } from '../../constants';
import { PaymentMethod, Currency } from '../../types';
import { formatMoney, toPKR, formatPKRCompact } from '../../utils/currency';
import { getActiveFiscalMonth } from '../../utils/fiscalMonth';
import { responsiveFontSize } from '../../utils/responsive';
import AnimatedIcon from '../../components/common/AnimatedIcon';
import BrandMark from '../../components/common/BrandMark';
import NumberPad from '../../components/common/NumberPad';

export default function WalletScreen() {
  const navigation = useNavigation<any>();
  const { wallets, currentUser, saveWallet, deleteWallet, exchangeRates } = useStore();

  const fiscal = getActiveFiscalMonth();
  const { month, year } = fiscal;

  const [editProvider, setEditProvider] = useState<WalletMeta | null>(null);
  const [agency, setAgency] = useState('');
  const [currency, setCurrency] = useState<Currency>('PKR');
  const [input, setInput] = useState('0');

  const mine = useMemo(
    () => wallets.filter(w => w.userId === currentUser?.id && w.month === month && w.year === year),
    [wallets, currentUser, month, year]
  );

  const getDoc = (provider: PaymentMethod, ag: string, cur: Currency) =>
    mine.find(w => w.provider === provider && w.agency === ag && w.currency === cur);

  const totalPKR = useMemo(
    () => mine.reduce((s, w) => s + toPKR(w.balance, w.currency ?? 'PKR', exchangeRates), 0),
    [mine, exchangeRates]
  );

  const openAdd = (meta: WalletMeta, ag?: string, cur?: Currency) => {
    const a = ag ?? meta.agencies[0];
    const c = cur ?? meta.currencies[0];
    setEditProvider(meta);
    setAgency(a);
    setCurrency(c);
    const existing = getDoc(meta.id, a, c);
    setInput(existing ? existing.balance.toString() : '0');
  };

  // keep input synced when switching agency/currency inside the modal
  const switchAgency = (a: string) => {
    setAgency(a);
    const existing = editProvider && getDoc(editProvider.id, a, currency);
    setInput(existing ? existing.balance.toString() : '0');
  };
  const switchCurrency = (c: Currency) => {
    setCurrency(c);
    const existing = editProvider && getDoc(editProvider.id, agency, c);
    setInput(existing ? existing.balance.toString() : '0');
  };

  const handleSave = async () => {
    if (!editProvider || !currentUser) return;
    const val = parseFloat(input);
    if (isNaN(val) || val < 0) { Alert.alert('Invalid', 'Enter a valid amount.'); return; }
    await saveWallet({
      userId: currentUser.id, provider: editProvider.id, agency,
      currency, balance: val, month, year,
    });
    setEditProvider(null);
  };

  const handleClear = async () => {
    if (!editProvider) return;
    const existing = getDoc(editProvider.id, agency, currency);
    if (!existing) { setEditProvider(null); return; }
    Alert.alert('Clear balance', `Remove ${editProvider.name} · ${agency} (${currency})?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: async () => { await deleteWallet(existing.id); setEditProvider(null); } },
    ]);
  };

  return (
    <View style={styles.root}>
      <LinearGradient colors={['#7C3AED', '#6D28D9', '#5B21B6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <SafeAreaView edges={['top']}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
              <Text style={styles.headerBtnText}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>My Wallets</Text>
            <View style={styles.headerBtn} />
          </View>
          <View style={styles.totalCard}>
            <View style={styles.totalRow}>
              <View>
                <Text style={styles.totalLabel}>Total Liquid Assets</Text>
                <Text style={styles.totalAmount}>{formatPKRCompact(totalPKR)}</Text>
                <Text style={styles.totalSub}>{fiscal.label} · converted to PKR</Text>
              </View>
              <AnimatedIcon name="wallet" size={64} />
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 60 }}>
        {WALLETS.map(meta => {
          const docs = mine.filter(w => w.provider === meta.id && w.balance > 0);
          const providerPKR = docs.reduce((s, w) => s + toPKR(w.balance, w.currency, exchangeRates), 0);

          return (
            <LinearGradient key={meta.id} colors={meta.gradient as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.brandCard}>
              {/* Card top: chip + brand wordmark */}
              <View style={styles.cardTop}>
                <View style={styles.chip} />
                {meta.brand === 'cash' || meta.brand === 'bank'
                  ? <Text style={styles.genericName}>{meta.name}</Text>
                  : <BrandMark brand={meta.brand} size={20} />}
              </View>

              <View style={styles.cardMidRow}>
                <View style={styles.cardIconBubble}>
                  <AnimatedIcon name={meta.lottie} size={30} emojiSize={22} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardProvider}>{meta.name}</Text>
                  <Text style={styles.cardSub}>
                    {meta.agencies.length > 1 ? `${meta.agencies.length} agencies` : meta.agencies[0]}
                    {meta.currencies.length > 1 ? ` · ${meta.currencies.join('/')}` : ''}
                  </Text>
                </View>
                <Text style={styles.cardPKR}>≈ {formatPKRCompact(providerPKR)}</Text>
              </View>

              {/* White inner panel: existing balances grouped by agency */}
              <View style={styles.innerPanel}>
                {docs.length === 0 ? (
                  <Text style={styles.noBalance}>No balance added yet</Text>
                ) : (
                  meta.agencies.filter(ag => docs.some(d => d.agency === ag)).map(ag => (
                    <View key={ag} style={styles.agencyGroup}>
                      {meta.agencies.length > 1 && <Text style={styles.agencyLabel}>{ag}</Text>}
                      {docs.filter(d => d.agency === ag).map(d => (
                        <TouchableOpacity key={d.id} style={styles.balRow} onPress={() => openAdd(meta, d.agency, d.currency)} activeOpacity={0.6}>
                          <Text style={styles.balFlag}>{CURRENCIES[d.currency].flag}</Text>
                          <Text style={styles.balCur}>{d.currency}</Text>
                          <Text style={styles.balAmt}>{formatMoney(d.balance, d.currency)}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  ))
                )}
                <TouchableOpacity style={styles.addBtn} onPress={() => openAdd(meta)}>
                  <Text style={styles.addBtnText}>+ Add / Edit balance</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          );
        })}
      </ScrollView>

      {/* Add/Edit modal: agency picker → currency picker → numpad */}
      <Modal visible={!!editProvider} transparent animationType="slide" onRequestClose={() => setEditProvider(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            {editProvider && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.modalHeader}>
                  <View style={[styles.modalIconBubble, { backgroundColor: editProvider.color + '20' }]}>
                    <AnimatedIcon name={editProvider.lottie} size={28} />
                  </View>
                  <Text style={styles.modalTitle}>{editProvider.name}</Text>
                </View>

                {editProvider.agencies.length > 1 && (
                  <>
                    <Text style={styles.pickerLabel}>Which agency?</Text>
                    <View style={styles.pickerRow}>
                      {editProvider.agencies.map(a => (
                        <TouchableOpacity key={a} style={[styles.pickerChip, agency === a && styles.pickerChipActive]} onPress={() => switchAgency(a)}>
                          <Text style={[styles.pickerChipText, agency === a && styles.pickerChipTextActive]}>{a}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </>
                )}

                {editProvider.currencies.length > 1 && (
                  <>
                    <Text style={styles.pickerLabel}>Currency</Text>
                    <View style={styles.pickerRow}>
                      {editProvider.currencies.map(c => (
                        <TouchableOpacity key={c} style={[styles.pickerChip, currency === c && styles.pickerChipActive]} onPress={() => switchCurrency(c)}>
                          <Text style={[styles.pickerChipText, currency === c && styles.pickerChipTextActive]}>{CURRENCIES[c].flag} {c}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </>
                )}

                <View style={styles.amountPreview}>
                  <Text style={styles.amountPreviewText}>{CURRENCIES[currency].symbol} {input}</Text>
                  <TouchableOpacity onPress={handleClear}><Text style={styles.clearLink}>Clear</Text></TouchableOpacity>
                </View>
                <NumberPad value={input} onChange={setInput} onDone={handleSave} onClear={() => setInput('0')} />
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerBtnText: { color: '#fff', fontSize: 34, fontWeight: '300', lineHeight: 36 },
  headerTitle: { color: '#fff', fontSize: responsiveFontSize(18), fontWeight: '800' },
  totalCard: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 24 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { color: 'rgba(255,255,255,0.75)', fontSize: responsiveFontSize(13), fontWeight: '500' },
  totalAmount: { color: '#fff', fontSize: responsiveFontSize(32), fontWeight: '800', marginTop: 4 },
  totalSub: { color: 'rgba(255,255,255,0.6)', fontSize: responsiveFontSize(11), marginTop: 4, fontWeight: '500' },
  scroll: { flex: 1 },

  brandCard: { borderRadius: 22, padding: 18, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 6 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  chip: { width: 38, height: 28, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.55)' },
  genericName: { color: '#fff', fontSize: responsiveFontSize(18), fontWeight: '800' },
  cardMidRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  cardIconBubble: { width: 46, height: 46, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },
  cardProvider: { color: '#fff', fontSize: responsiveFontSize(16), fontWeight: '800' },
  cardSub: { color: 'rgba(255,255,255,0.8)', fontSize: responsiveFontSize(11), fontWeight: '500', marginTop: 1 },
  cardPKR: { color: '#fff', fontSize: responsiveFontSize(13), fontWeight: '700' },
  innerPanel: { backgroundColor: '#fff', borderRadius: 16, padding: 12 },
  noBalance: { fontSize: responsiveFontSize(12), color: '#94A3B8', fontWeight: '500', textAlign: 'center', paddingVertical: 8 },
  agencyGroup: { marginBottom: 6 },
  agencyLabel: { fontSize: responsiveFontSize(11), fontWeight: '800', color: '#7C3AED', marginBottom: 4, marginTop: 4 },
  balRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  balFlag: { fontSize: 18 },
  balCur: { fontSize: responsiveFontSize(12), fontWeight: '800', color: '#475569', width: 38 },
  balAmt: { flex: 1, textAlign: 'right', fontSize: responsiveFontSize(14), fontWeight: '800', color: '#1E293B' },
  addBtn: { marginTop: 8, paddingVertical: 10, borderRadius: 10, backgroundColor: '#F1F5F9', alignItems: 'center' },
  addBtnText: { fontSize: responsiveFontSize(12), fontWeight: '700', color: '#7C3AED' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.5)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#F8FAFC', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 10, maxHeight: '92%' },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#CBD5E1', alignSelf: 'center', marginBottom: 12 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, marginBottom: 12 },
  modalIconBubble: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  modalTitle: { fontSize: responsiveFontSize(17), fontWeight: '800', color: '#1E293B' },
  pickerLabel: { fontSize: responsiveFontSize(12), fontWeight: '700', color: '#64748B', paddingHorizontal: 20, marginBottom: 8 },
  pickerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 20, marginBottom: 14 },
  pickerChip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 14, backgroundColor: '#fff', borderWidth: 1, borderColor: COLORS.border },
  pickerChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  pickerChipText: { fontSize: responsiveFontSize(13), fontWeight: '600', color: COLORS.textMed },
  pickerChipTextActive: { color: '#fff', fontWeight: '700' },
  amountPreview: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, paddingVertical: 8 },
  amountPreviewText: { fontSize: responsiveFontSize(32), fontWeight: '800', color: COLORS.primary },
  clearLink: { fontSize: responsiveFontSize(13), color: COLORS.danger, fontWeight: '700' },
});
