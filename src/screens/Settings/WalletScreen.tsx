import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { format } from 'date-fns';
import { useStore } from '../../store/useStore';
import { COLORS, WALLETS, PAYMENT_METHODS } from '../../constants';
import { PaymentMethod } from '../../types';
import { responsiveFontSize, responsiveSpacing } from '../../utils/responsive';

export default function WalletScreen() {
  const navigation = useNavigation<any>();
  const { wallets, currentUser, saveWallet, deleteWallet } = useStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<PaymentMethod | null>(null);
  const [balanceInput, setBalanceInput] = useState('');

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  // Get current month wallet balances
  const currentWallets = useMemo(() =>
    WALLETS.map(w => {
      const wallet = wallets.find(
        wt => wt.userId === currentUser?.id &&
        wt.provider === w.id &&
        wt.month === month &&
        wt.year === year
      );
      return { ...w, balance: wallet?.balance ?? 0, walletId: wallet?.id };
    }),
    [wallets, currentUser, month, year]
  );

  const totalBalance = currentWallets.reduce((sum, w) => sum + w.balance, 0);

  const handleOpenWallet = (wallet: typeof currentWallets[0]) => {
    setSelectedWallet(wallet.id as PaymentMethod);
    setBalanceInput(wallet.balance.toString());
    setModalVisible(true);
  };

  const handleSaveWallet = async () => {
    if (!selectedWallet || !currentUser) return;
    const val = parseFloat(balanceInput);
    if (isNaN(val) || val < 0) {
      Alert.alert('Invalid', 'Enter a valid balance amount.');
      return;
    }
    try {
      await saveWallet({
        userId: currentUser.id,
        provider: selectedWallet,
        balance: val,
        month,
        year,
      });
      setModalVisible(false);
      setSelectedWallet(null);
      setBalanceInput('');
      Alert.alert('Saved', `${PAYMENT_METHODS[selectedWallet].label} wallet updated`);
    } catch (e) {
      Alert.alert('Error', 'Failed to save wallet');
    }
  };

  const handleDeleteWallet = async (walletId: string | undefined) => {
    if (!walletId) return;
    Alert.alert('Delete', 'Remove this wallet balance?', [
      { text: 'Cancel', onPress: () => {}, style: 'cancel' },
      {
        text: 'Delete',
        onPress: async () => {
          try {
            await deleteWallet(walletId);
            Alert.alert('Deleted', 'Wallet removed');
          } catch (e) {
            Alert.alert('Error', 'Failed to delete wallet');
          }
        },
        style: 'destructive',
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backBtn}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Wallets</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Total Balance */}
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Total Wallet Balance</Text>
          <Text style={styles.totalAmount}>Rs. {totalBalance.toLocaleString()}</Text>
          <Text style={styles.totalSub}>{format(now, 'MMMM yyyy')}</Text>
        </View>

        {/* Wallets Grid */}
        <Text style={styles.sectionTitle}>Manage Wallets</Text>
        {currentWallets.map((wallet) => (
          <TouchableOpacity
            key={wallet.id}
            style={styles.walletCard}
            onPress={() => handleOpenWallet(wallet)}
            activeOpacity={0.7}
          >
            <View style={styles.walletLeft}>
              <View style={[styles.walletIcon, { backgroundColor: wallet.color + '20' }]}>
                <Text style={styles.walletIconText}>{wallet.icon}</Text>
              </View>
              <View>
                <Text style={styles.walletName}>{wallet.name}</Text>
                <Text style={styles.walletBalance}>
                  Rs. {wallet.balance.toLocaleString()}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => handleDeleteWallet(wallet.walletId)}
              style={styles.deleteBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.deleteBtnText}>🗑</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modal for editing wallet */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.modalBackBtn}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Update Balance</Text>
              <TouchableOpacity onPress={handleSaveWallet}>
                <Text style={styles.modalSaveBtn}>Save</Text>
              </TouchableOpacity>
            </View>

            {selectedWallet && (
              <View style={styles.modalBody}>
                <View style={styles.selectedWalletInfo}>
                  <Text style={styles.selectedWalletIcon}>
                    {PAYMENT_METHODS[selectedWallet].icon}
                  </Text>
                  <Text style={styles.selectedWalletLabel}>
                    {PAYMENT_METHODS[selectedWallet].label}
                  </Text>
                </View>

                <TextInput
                  style={styles.balanceInput}
                  placeholder="Enter balance"
                  placeholderTextColor={COLORS.textLight}
                  value={balanceInput}
                  onChangeText={setBalanceInput}
                  keyboardType="decimal-pad"
                  editable
                />

                <Text style={styles.inputHint}>
                  Enter your current {PAYMENT_METHODS[selectedWallet].label} balance
                </Text>
              </View>
            )}
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1, paddingHorizontal: 16 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  backBtn: {
    fontSize: responsiveFontSize(14),
    fontWeight: '600',
    color: COLORS.primary,
  },
  title: {
    fontSize: responsiveFontSize(20),
    fontWeight: '700',
    color: COLORS.text,
  },
  totalCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: responsiveSpacing(18),
    marginBottom: 20,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 2,
  },
  totalLabel: {
    fontSize: responsiveFontSize(13),
    color: COLORS.white,
    fontWeight: '600',
    opacity: 0.85,
  },
  totalAmount: {
    fontSize: responsiveFontSize(28),
    fontWeight: '800',
    color: COLORS.white,
    marginTop: 8,
  },
  totalSub: {
    fontSize: responsiveFontSize(12),
    color: COLORS.white,
    opacity: 0.65,
    marginTop: 4,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: responsiveFontSize(16),
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  walletCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: responsiveSpacing(14),
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
    borderWidth: 0,
  },
  walletLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  walletIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  walletIconText: {
    fontSize: 22,
  },
  walletName: {
    fontSize: responsiveFontSize(15),
    fontWeight: '700',
    color: COLORS.text,
  },
  walletBalance: {
    fontSize: responsiveFontSize(12),
    color: COLORS.textLight,
    marginTop: 2,
    fontWeight: '500',
  },
  deleteBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.dangerLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnText: {
    fontSize: 18,
  },
  modalSafe: {
    flex: 1,
    backgroundColor: COLORS.overlay,
  },
  modalContent: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: 200,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalBackBtn: {
    fontSize: responsiveFontSize(14),
    color: COLORS.danger,
    fontWeight: '700',
  },
  modalTitle: {
    fontSize: responsiveFontSize(16),
    fontWeight: '700',
    color: COLORS.text,
  },
  modalSaveBtn: {
    fontSize: responsiveFontSize(14),
    color: COLORS.success,
    fontWeight: '700',
  },
  modalBody: {
    padding: responsiveSpacing(20),
  },
  selectedWalletInfo: {
    alignItems: 'center',
    marginBottom: 24,
  },
  selectedWalletIcon: {
    fontSize: 52,
    marginBottom: 12,
  },
  selectedWalletLabel: {
    fontSize: responsiveFontSize(18),
    fontWeight: '700',
    color: COLORS.text,
  },
  balanceInput: {
    backgroundColor: COLORS.cardSecondary,
    borderRadius: 12,
    borderWidth: 0,
    paddingHorizontal: responsiveSpacing(14),
    paddingVertical: responsiveSpacing(12),
    fontSize: responsiveFontSize(16),
    color: COLORS.text,
    fontWeight: '600',
    marginBottom: 12,
  },
  inputHint: {
    fontSize: responsiveFontSize(12),
    color: COLORS.textLight,
    fontWeight: '500',
    textAlign: 'center',
  },
});
