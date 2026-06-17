import React, { useMemo, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Modal, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useStore } from '../../store/useStore';
import { WALLETS, CURRENCIES, COLORS } from '../../constants';
import { PaymentMethod, Currency } from '../../types';
import { formatMoney, toPKR, formatPKRCompact } from '../../utils/currency';
import { getActiveFiscalMonth } from '../../utils/fiscalMonth';
import { responsiveFontSize } from '../../utils/responsive';
import AnimatedIcon from '../../components/common/AnimatedIcon';
import NumberPad from '../../components/common/NumberPad';

export default function WalletScreen() {
  const navigation = useNavigation<any>();
  const { wallets, currentUser, saveWallet, deleteWallet, exchangeRates } = useStore();

  const fiscal = getActiveFiscalMonth();
  const { month, year } = fiscal;

  const [editing, setEditing] = useState<{ provider: PaymentMethod; currency: Currency } | null>(null);
  const [input, setInput] = useState('0');

  // balance lookup for (provider, currency)
  const getBalance = (provider: PaymentMethod, currency: Currency) =>
    wallets.find(
      w => w.userId === currentUser?.id && w.provider === provider &&
        w.currency === currency && w.month === month && w.year === year
    );

  const totalPKR = useMemo(() => {
    return wallets
      .filter(w => w.userId === currentUser?.id && w.month === month && w.year === year)
      .reduce((sum, w) => sum + toPKR(w.balance, w.currency ?? 'PKR', exchangeRates), 0);
  }, [wallets, currentUser, month, year, exchangeRates]);

  const openEdit = (provider: PaymentMethod, currency: Currency) => {
    const existing = getBalance(provider, currency);
    setInput(existing ? existing.balance.toString() : '0');
    setEditing({ provider, currency });
  };

  const handleSave = async () => {
    if (!editing || !currentUser) return;
    const val = parseFloat(input);
    if (isNaN(val) || val < 0) { Alert.alert('Invalid', 'Enter a valid amount.'); return; }
    await saveWallet({
      userId: currentUser.id,
      provider: editing.provider,
      currency: editing.currency,
      balance: val,
      month, year,
    });
    setEditing(null);
  };

  const handleDelete = (provider: PaymentMethod, currency: Currency) => {
    const existing = getBalance(provider, currency);
    if (!existing) { setEditing(null); return; }
    Alert.alert('Clear balance', `Remove ${WALLETS.find(w => w.id === provider)?.name} (${currency}) balance?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: async () => { await deleteWallet(existing.id); setEditing(null); } },
    ]);
  };

  const editingMeta = editing ? WALLETS.find(w => w.id === editing.provider) : null;

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

          {/* Total liquid assets */}
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
        {WALLETS.map(wallet => {
          const balances = wallet.currencies.map(c => ({ currency: c, doc: getBalance(wallet.id, c) }));
          const walletPKR = balances.reduce((s, b) => s + toPKR(b.doc?.balance ?? 0, b.currency, exchangeRates), 0);

          return (
            <LinearGradient
              key={wallet.id}
              colors={wallet.gradient as any}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.walletCard}
            >
              {/* Card header */}
              <View style={styles.walletCardHeader}>
                <View style={styles.walletCardTitle}>
                  <View style={styles.walletIconBubble}>
                    <AnimatedIcon name={wallet.lottie} size={32} />
                  </View>
                  <View>
                    <Text style={styles.walletName}>{wallet.name}</Text>
                    <Text style={styles.walletType}>
                      {wallet.currencies.length > 1 ? 'Multi-currency' : 'PKR account'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.walletPKR}>≈ {formatPKRCompact(walletPKR)}</Text>
              </View>

              {/* White inner card with balances */}
              <View style={styles.innerCard}>
                {balances.map(({ currency, doc }, idx) => (
                  <TouchableOpacity
                    key={currency}
                    style={[styles.balanceRow, idx < balances.length - 1 && styles.balanceRowBorder]}
                    onPress={() => openEdit(wallet.id, currency)}
                    activeOpacity={0.65}
                  >
                    <View style={styles.balanceLeft}>
                      <Text style={styles.currencyFlag}>{CURRENCIES[currency].flag}</Text>
                      <View>
                        <Text style={styles.currencyCode}>{currency}</Text>
                        <Text style={styles.currencyLabel}>{CURRENCIES[currency].label}</Text>
                      </View>
                    </View>
                    <View style={styles.balanceRight}>
                      <Text style={styles.balanceAmount}>{formatMoney(doc?.balance ?? 0, currency)}</Text>
                      <Text style={styles.editHint}>{doc ? 'Tap to edit' : 'Tap to add'}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </LinearGradient>
          );
        })}
      </ScrollView>

      {/* Numpad edit modal */}
      <Modal visible={!!editing} transparent animationType="slide" onRequestClose={() => setEditing(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            {editing && editingMeta && (
              <>
                <View style={styles.modalHeader}>
                  <View style={[styles.modalIconBubble, { backgroundColor: editingMeta.color + '20' }]}>
                    <AnimatedIcon name={editingMeta.lottie} size={28} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalTitle}>{editingMeta.name}</Text>
                    <Text style={styles.modalSub}>
                      {CURRENCIES[editing.currency].flag} {editing.currency} · {CURRENCIES[editing.currency].label}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => handleDelete(editing.provider, editing.currency)}>
                    <Text style={styles.modalClear}>Clear</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.amountPreview}>
                  <Text style={styles.amountPreviewText}>
                    {CURRENCIES[editing.currency].symbol} {input}
                  </Text>
                </View>
                <NumberPad value={input} onChange={setInput} onDone={handleSave} onClear={() => setInput('0')} />
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4,
  },
  headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerBtnText: { color: '#fff', fontSize: 34, fontWeight: '300', lineHeight: 36 },
  headerTitle: { color: '#fff', fontSize: responsiveFontSize(18), fontWeight: '800' },
  totalCard: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 24 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { color: 'rgba(255,255,255,0.75)', fontSize: responsiveFontSize(13), fontWeight: '500' },
  totalAmount: { color: '#fff', fontSize: responsiveFontSize(32), fontWeight: '800', marginTop: 4 },
  totalSub: { color: 'rgba(255,255,255,0.6)', fontSize: responsiveFontSize(11), marginTop: 4, fontWeight: '500' },
  scroll: { flex: 1 },
  walletCard: {
    borderRadius: 22,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  walletCardHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 14, paddingHorizontal: 4,
  },
  walletCardTitle: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  walletIconBubble: {
    width: 48, height: 48, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },
  walletName: { color: '#fff', fontSize: responsiveFontSize(17), fontWeight: '800' },
  walletType: { color: 'rgba(255,255,255,0.8)', fontSize: responsiveFontSize(11), fontWeight: '500', marginTop: 1 },
  walletPKR: { color: '#fff', fontSize: responsiveFontSize(13), fontWeight: '700' },
  innerCard: { backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 14 },
  balanceRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 13,
  },
  balanceRowBorder: { borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  balanceLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  currencyFlag: { fontSize: 26 },
  currencyCode: { fontSize: responsiveFontSize(14), fontWeight: '800', color: '#1E293B' },
  currencyLabel: { fontSize: responsiveFontSize(10), color: '#94A3B8', fontWeight: '500', marginTop: 1 },
  balanceRight: { alignItems: 'flex-end' },
  balanceAmount: { fontSize: responsiveFontSize(15), fontWeight: '800', color: '#1E293B' },
  editHint: { fontSize: responsiveFontSize(10), color: '#A78BFA', fontWeight: '600', marginTop: 2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.5)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#F8FAFC', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 10 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#CBD5E1', alignSelf: 'center', marginBottom: 12 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, marginBottom: 8 },
  modalIconBubble: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  modalTitle: { fontSize: responsiveFontSize(16), fontWeight: '800', color: '#1E293B' },
  modalSub: { fontSize: responsiveFontSize(12), color: '#64748B', fontWeight: '500', marginTop: 1 },
  modalClear: { fontSize: responsiveFontSize(13), color: COLORS.danger, fontWeight: '700' },
  amountPreview: { paddingHorizontal: 20, paddingVertical: 12, alignItems: 'center' },
  amountPreviewText: { fontSize: responsiveFontSize(34), fontWeight: '800', color: COLORS.primary },
});
