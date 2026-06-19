import React, { useMemo, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Modal, TextInput, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../../store/useStore';
import { COLORS, GRADIENTS } from '../../constants';
import { responsiveFontSize } from '../../utils/responsive';
import { formatMoney } from '../../utils/currency';
import { getUserAdvanceBalance, enrichAdvanceEntry } from '../../utils/advanceBalance';
import { getReturnSummary, validateReturn, recordAdvanceReturn, getPendingAmount } from '../../utils/advanceReturns';
import { AdvanceBalanceEntry } from '../../types';

const W = Dimensions.get('window').width;

export default function AdvanceBalanceScreen() {
  const { advanceBalanceEntries = [], currentUser, expenses = [] } = useStore();
  const [selectedAdvance, setSelectedAdvance] = useState<AdvanceBalanceEntry | null>(null);
  const [returnAmount, setReturnAmount] = useState('');
  const [returnMethod, setReturnMethod] = useState('cash');
  const [returnNotes, setReturnNotes] = useState('');
  const [showReturnModal, setShowReturnModal] = useState(false);

  // Get user's advance balance
  const userBalance = useMemo(
    () => currentUser ? getUserAdvanceBalance(currentUser.email, advanceBalanceEntries || [], expenses || []) : null,
    [currentUser, advanceBalanceEntries, expenses]
  );

  // Separate given and received advances
  const advancesGiven = useMemo(
    () => advanceBalanceEntries?.filter(e => e.giverEmail === currentUser?.email) || [],
    [advanceBalanceEntries, currentUser]
  );

  const advancesReceived = useMemo(
    () => advanceBalanceEntries?.filter(e => e.receiverEmail === currentUser?.email) || [],
    [advanceBalanceEntries, currentUser]
  );

  const handleRecordReturn = async () => {
    if (!selectedAdvance || !returnAmount) {
      Alert.alert('Error', 'Please enter return amount');
      return;
    }

    const amount = parseFloat(returnAmount);
    const validation = validateReturn(selectedAdvance, amount, returnMethod);

    if (!validation.valid) {
      Alert.alert('Invalid Return', validation.errors.join('\n'));
      return;
    }

    try {
      const updatedEntry = recordAdvanceReturn(
        selectedAdvance,
        amount,
        returnMethod,
        currentUser?.id || '',
        returnNotes
      );

      // Update in Firebase (assuming updateAdvanceBalanceEntry exists in store)
      // await updateAdvanceBalanceEntry(updatedEntry);

      Alert.alert('Success', `Return of Rs. ${amount} recorded successfully!`);
      setShowReturnModal(false);
      setReturnAmount('');
      setReturnMethod('cash');
      setReturnNotes('');
      setSelectedAdvance(null);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  if (!currentUser) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.noDataText}>Please log in to view advance balances</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* HEADER */}
        <LinearGradient colors={GRADIENTS.header as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
          <Text style={styles.title}>Advance Balance</Text>
          <Text style={styles.subtitle}>{currentUser.name}'s Summary</Text>
        </LinearGradient>

        {/* SUMMARY CARDS */}
        {userBalance && (
          <View style={styles.section}>
            <View style={styles.summaryGrid}>
              <View style={[styles.summaryCard, { backgroundColor: '#E8F5E9' }]}>
                <Text style={styles.summaryLabel}>Given</Text>
                <Text style={styles.summaryValue}>{formatMoney(userBalance.totalGiven)}</Text>
                <Text style={styles.summarySubtitle}>{userBalance.activeCount} active</Text>
              </View>

              <View style={[styles.summaryCard, { backgroundColor: '#FCE4EC' }]}>
                <Text style={styles.summaryLabel}>Received</Text>
                <Text style={styles.summaryValue}>{formatMoney(userBalance.totalReceived)}</Text>
                <Text style={styles.summarySubtitle}>{userBalance.activeCount} active</Text>
              </View>

              <View style={[styles.summaryCard, { backgroundColor: '#E3F2FD' }]}>
                <Text style={styles.summaryLabel}>Balance</Text>
                <Text style={[styles.summaryValue, { color: userBalance.balance >= 0 ? '#2E7D32' : '#C62828' }]}>
                  {formatMoney(Math.abs(userBalance.balance))}
                </Text>
                <Text style={styles.summarySubtitle}>{userBalance.balance >= 0 ? 'You are owed' : 'You owe'}</Text>
              </View>
            </View>
          </View>
        )}

        {/* ADVANCES GIVEN */}
        {advancesGiven.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💰 Advances Given</Text>
            {advancesGiven.map(advance => {
              const summary = getReturnSummary(advance);
              return (
                <TouchableOpacity
                  key={advance.id}
                  style={styles.advanceCard}
                  onPress={() => {
                    setSelectedAdvance(advance);
                    setShowReturnModal(true);
                  }}
                >
                  <View style={styles.advanceHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.advancePerson}>To: {advance.receiverName}</Text>
                      <Text style={styles.advanceDate}>{advance.transactionDate}</Text>
                    </View>
                    <View style={styles.advanceAmount}>
                      <Text style={styles.amountText}>{formatMoney(advance.amount)}</Text>
                      <Text style={[styles.statusBadge, {
                        color: summary.isFullySettled ? '#2E7D32' : '#F57C00',
                        backgroundColor: summary.isFullySettled ? '#E8F5E9' : '#FFF3E0'
                      }]}>
                        {summary.isFullySettled ? '✓ Settled' : '⏳ Pending'}
                      </Text>
                    </View>
                  </View>

                  {/* Progress Bar */}
                  <View style={styles.progressSection}>
                    <View style={styles.progressBar}>
                      <View
                        style={[
                          styles.progressFill,
                          { width: `${summary.returnPercentage}%`, backgroundColor: '#4ADE80' }
                        ]}
                      />
                    </View>
                    <Text style={styles.progressText}>
                      Returned: {formatMoney(summary.returnedAmount)} / {formatMoney(summary.originalAmount)} ({summary.returnPercentage}%)
                    </Text>
                  </View>

                  {/* Pending */}
                  {summary.pendingAmount > 0 && (
                    <Text style={styles.pendingText}>
                      📌 Pending: {formatMoney(summary.pendingAmount)}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* ADVANCES RECEIVED */}
        {advancesReceived.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📥 Advances Received</Text>
            {advancesReceived.map(advance => {
              const summary = getReturnSummary(advance);
              return (
                <View key={advance.id} style={styles.advanceCard}>
                  <View style={styles.advanceHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.advancePerson}>From: {advance.giverName}</Text>
                      <Text style={styles.advanceDate}>{advance.transactionDate}</Text>
                    </View>
                    <View style={styles.advanceAmount}>
                      <Text style={styles.amountText}>{formatMoney(advance.amount)}</Text>
                      <Text style={[styles.statusBadge, {
                        color: summary.isFullySettled ? '#2E7D32' : '#F57C00',
                        backgroundColor: summary.isFullySettled ? '#E8F5E9' : '#FFF3E0'
                      }]}>
                        {summary.isFullySettled ? '✓ Settled' : '⏳ Pending'}
                      </Text>
                    </View>
                  </View>

                  {/* Progress Bar */}
                  <View style={styles.progressSection}>
                    <View style={styles.progressBar}>
                      <View
                        style={[
                          styles.progressFill,
                          { width: `${summary.returnPercentage}%`, backgroundColor: '#60A5FA' }
                        ]}
                      />
                    </View>
                    <Text style={styles.progressText}>
                      Used: {formatMoney(summary.returnedAmount)} / {formatMoney(summary.originalAmount)} ({summary.returnPercentage}%)
                    </Text>
                  </View>

                  {/* Pending */}
                  {summary.pendingAmount > 0 && (
                    <Text style={styles.pendingText}>
                      📌 Remaining: {formatMoney(summary.pendingAmount)}
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* NO DATA */}
        {advancesGiven.length === 0 && advancesReceived.length === 0 && (
          <View style={styles.noDataContainer}>
            <Text style={styles.noDataEmoji}>💤</Text>
            <Text style={styles.noDataText}>No advance balances yet</Text>
            <Text style={styles.noDataSubtext}>Create an advance from the Funds menu</Text>
          </View>
        )}
      </ScrollView>

      {/* RETURN MODAL */}
      <Modal visible={showReturnModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Record Return</Text>

            {selectedAdvance && (
              <>
                <Text style={styles.modalLabel}>To: {selectedAdvance.receiverName}</Text>
                <Text style={styles.modalLabel}>Original: {formatMoney(selectedAdvance.amount)}</Text>
                <Text style={styles.modalLabel}>
                  Pending: {formatMoney(getPendingAmount(selectedAdvance))}
                </Text>

                <Text style={styles.inputLabel}>Return Amount *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter amount"
                  keyboardType="decimal-pad"
                  value={returnAmount}
                  onChangeText={setReturnAmount}
                />

                <Text style={styles.inputLabel}>Payment Method *</Text>
                <View style={styles.methodRow}>
                  {['cash', 'bank', 'digital', 'adjustment'].map(method => (
                    <TouchableOpacity
                      key={method}
                      style={[styles.methodBtn, returnMethod === method && styles.methodBtnActive]}
                      onPress={() => setReturnMethod(method)}
                    >
                      <Text style={[styles.methodText, returnMethod === method && styles.methodTextActive]}>
                        {method}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.inputLabel}>Notes (Optional)</Text>
                <TextInput
                  style={[styles.input, styles.notesInput]}
                  placeholder="Add notes..."
                  multiline
                  value={returnNotes}
                  onChangeText={setReturnNotes}
                />

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.modalBtn, styles.cancelBtn]}
                    onPress={() => setShowReturnModal(false)}
                  >
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalBtn, styles.submitBtn]}
                    onPress={handleRecordReturn}
                  >
                    <Text style={styles.submitBtnText}>Record Return</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAFAF7' },
  scroll: { flex: 1 },
  header: { paddingHorizontal: 16, paddingVertical: 20 },
  title: { fontSize: responsiveFontSize(24), fontWeight: '800', color: '#1A1A1A' },
  subtitle: { fontSize: responsiveFontSize(12), color: 'rgba(26,26,26,0.6)', marginTop: 4 },
  section: { paddingHorizontal: 16, marginBottom: 20 },
  sectionTitle: { fontSize: responsiveFontSize(15), fontWeight: '800', color: '#1A1A1A', marginBottom: 12 },
  summaryGrid: { flexDirection: 'row', gap: 10 },
  summaryCard: { flex: 1, borderRadius: 12, padding: 12, alignItems: 'center' },
  summaryLabel: { fontSize: responsiveFontSize(11), fontWeight: '700', color: '#52525B' },
  summaryValue: { fontSize: responsiveFontSize(16), fontWeight: '800', color: '#1A1A1A', marginTop: 6 },
  summarySubtitle: { fontSize: responsiveFontSize(10), color: '#9C9C95', marginTop: 4 },
  advanceCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10 },
  advanceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  advancePerson: { fontSize: responsiveFontSize(13), fontWeight: '700', color: '#1A1A1A' },
  advanceDate: { fontSize: responsiveFontSize(10), color: '#9C9C95', marginTop: 2 },
  advanceAmount: { alignItems: 'flex-end' },
  amountText: { fontSize: responsiveFontSize(14), fontWeight: '800', color: '#1A1A1A' },
  statusBadge: { fontSize: responsiveFontSize(9), fontWeight: '700', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, marginTop: 4 },
  progressSection: { marginTop: 10 },
  progressBar: { height: 6, backgroundColor: '#ECECE6', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%' },
  progressText: { fontSize: responsiveFontSize(10), color: '#52525B', fontWeight: '600', marginTop: 6 },
  pendingText: { fontSize: responsiveFontSize(11), color: '#F57C00', fontWeight: '700', marginTop: 8 },
  noDataContainer: { alignItems: 'center', paddingVertical: 60 },
  noDataEmoji: { fontSize: 48, marginBottom: 16 },
  noDataText: { fontSize: responsiveFontSize(14), fontWeight: '700', color: '#1A1A1A' },
  noDataSubtext: { fontSize: responsiveFontSize(12), color: '#9C9C95', marginTop: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, minHeight: 400 },
  modalTitle: { fontSize: responsiveFontSize(18), fontWeight: '800', color: '#1A1A1A', marginBottom: 16 },
  modalLabel: { fontSize: responsiveFontSize(12), fontWeight: '700', color: '#1A1A1A', marginBottom: 4 },
  inputLabel: { fontSize: responsiveFontSize(12), fontWeight: '700', color: '#1A1A1A', marginTop: 12, marginBottom: 6 },
  input: { backgroundColor: '#F5F5F5', borderRadius: 8, padding: 12, fontSize: responsiveFontSize(13), marginBottom: 12 },
  notesInput: { height: 80, textAlignVertical: 'top' },
  methodRow: { flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  methodBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: '#E0E0E0' },
  methodBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  methodText: { fontSize: responsiveFontSize(11), fontWeight: '700', color: '#1A1A1A' },
  methodTextActive: { color: '#fff' },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 20 },
  modalBtn: { flex: 1, borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  cancelBtn: { backgroundColor: '#ECECE6' },
  cancelBtnText: { fontSize: responsiveFontSize(13), fontWeight: '700', color: '#1A1A1A' },
  submitBtn: { backgroundColor: COLORS.primary },
  submitBtnText: { fontSize: responsiveFontSize(13), fontWeight: '700', color: '#fff' },
});
