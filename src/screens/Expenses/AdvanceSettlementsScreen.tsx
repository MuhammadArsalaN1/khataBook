import React, { useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useStore } from '../../store/useStore';
import { COLORS, GRADIENTS } from '../../constants';
import { responsiveFontSize } from '../../utils/responsive';
import { formatMoney } from '../../utils/currency';
import { calculateAdvanceUsed, calculateAdvanceRemaining } from '../../utils/advanceBalance';
import { getReturnSummary, getPendingAmount } from '../../utils/advanceReturns';

const W = Dimensions.get('window').width;

export default function AdvanceSettlementsScreen() {
  const { advanceBalanceEntries = [], expenses = [], currentUser } = useStore();
  const navigation = useNavigation<any>();

  // Get all advances relevant to current user
  const userAdvances = useMemo(
    () => advanceBalanceEntries?.filter(
      e => e.giverEmail === currentUser?.email || e.receiverEmail === currentUser?.email
    ) || [],
    [advanceBalanceEntries, currentUser]
  );

  // Separate by perspective
  const advancesGiven = useMemo(
    () => userAdvances.filter(e => e.giverEmail === currentUser?.email),
    [userAdvances, currentUser]
  );

  const advancesReceived = useMemo(
    () => userAdvances.filter(e => e.receiverEmail === currentUser?.email),
    [userAdvances, currentUser]
  );

  // Calculate totals
  const totalGiven = useMemo(
    () => advancesGiven.reduce((sum, a) => sum + a.amount, 0),
    [advancesGiven]
  );

  const totalGivenReturned = useMemo(
    () => advancesGiven.reduce((sum, a) => sum + a.returnedAmount, 0),
    [advancesGiven]
  );

  const totalGivenPending = useMemo(
    () => advancesGiven.reduce((sum, a) => sum + getPendingAmount(a), 0),
    [advancesGiven]
  );

  const totalReceived = useMemo(
    () => advancesReceived.reduce((sum, a) => sum + a.amount, 0),
    [advancesReceived]
  );

  const totalReceivedUsed = useMemo(
    () => advancesReceived.reduce((sum, a) => sum + calculateAdvanceUsed(a.id, expenses), 0),
    [advancesReceived, expenses]
  );

  const totalReceivedPending = useMemo(
    () => advancesReceived.reduce((sum, a) => sum + calculateAdvanceRemaining(a, expenses), 0),
    [advancesReceived, expenses]
  );

  if (userAdvances.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataEmoji}>💤</Text>
          <Text style={styles.noDataText}>No advance records</Text>
          <Text style={styles.noDataSubtext}>Create an advance from the Funds menu</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* HEADER */}
        <LinearGradient colors={GRADIENTS.header as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
          <Text style={styles.title}>Advance Settlements</Text>
          <Text style={styles.subtitle}>Track all your advance transactions</Text>
        </LinearGradient>

        {/* GIVEN SUMMARY */}
        {advancesGiven.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💰 Given Out</Text>

            <View style={styles.summaryGrid}>
              <View style={[styles.summaryCard, { backgroundColor: '#FEE2E2' }]}>
                <Text style={styles.summaryLabel}>Total Given</Text>
                <Text style={styles.summaryValue}>{formatMoney(totalGiven)}</Text>
              </View>

              <View style={[styles.summaryCard, { backgroundColor: '#DCFCE7' }]}>
                <Text style={styles.summaryLabel}>Returned</Text>
                <Text style={styles.summaryValue}>{formatMoney(totalGivenReturned)}</Text>
              </View>

              <View style={[styles.summaryCard, { backgroundColor: '#FEF3C7' }]}>
                <Text style={styles.summaryLabel}>Pending</Text>
                <Text style={styles.summaryValue}>{formatMoney(totalGivenPending)}</Text>
              </View>
            </View>

            {/* Given Advances List */}
            {advancesGiven.map(advance => {
              const summary = getReturnSummary(advance);
              const returnPercentage = summary.returnPercentage;

              return (
                <View key={advance.id} style={styles.advanceEntry}>
                  <View style={styles.entryHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.entryTitle}>To: {advance.receiverName}</Text>
                      <Text style={styles.entryDate}>{advance.transactionDate}</Text>
                    </View>
                    <View style={styles.entryAmount}>
                      <Text style={styles.amountValue}>{formatMoney(advance.amount)}</Text>
                      <Text style={[styles.statusBadge, {
                        color: summary.isFullySettled ? '#166534' : '#EA580C',
                        backgroundColor: summary.isFullySettled ? '#ECFDF5' : '#FEF3C7'
                      }]}>
                        {summary.isFullySettled ? '✓ Settled' : '⏳ Pending'}
                      </Text>
                    </View>
                  </View>

                  {/* Settlement Progress */}
                  <View style={styles.progressSection}>
                    <View style={styles.progressBar}>
                      <View
                        style={[styles.progressFill, { width: `${returnPercentage}%`, backgroundColor: '#10B981' }]}
                      />
                    </View>
                    <View style={styles.progressInfo}>
                      <Text style={styles.progressText}>Returned: {formatMoney(summary.returnedAmount)}</Text>
                      <Text style={styles.progressText}>Pending: {formatMoney(summary.pendingAmount)}</Text>
                      <Text style={styles.progressPercent}>{returnPercentage}%</Text>
                    </View>
                  </View>

                  {/* Return History */}
                  {summary.returnCount > 0 && (
                    <View style={styles.historySection}>
                      <Text style={styles.historyTitle}>Return History ({summary.returnCount})</Text>
                      {advance.returnHistory?.map((ret, idx) => (
                        <View key={idx} style={styles.historyItem}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.historyAmount}>{formatMoney(ret.amount)}</Text>
                            <Text style={styles.historyMeta}>{ret.method} • {ret.date}</Text>
                          </View>
                          {ret.notes && <Text style={styles.historyNote}>{ret.notes}</Text>}
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Action Button */}
                  {!summary.isFullySettled && (
                    <TouchableOpacity
                      style={styles.recordBtn}
                      onPress={() => navigation.navigate('AdvanceBalance')}
                    >
                      <Text style={styles.recordBtnText}>📝 Record Return</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* RECEIVED SUMMARY */}
        {advancesReceived.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📥 Received</Text>

            <View style={styles.summaryGrid}>
              <View style={[styles.summaryCard, { backgroundColor: '#E0E7FF' }]}>
                <Text style={styles.summaryLabel}>Total Received</Text>
                <Text style={styles.summaryValue}>{formatMoney(totalReceived)}</Text>
              </View>

              <View style={[styles.summaryCard, { backgroundColor: '#E5E7EB' }]}>
                <Text style={styles.summaryLabel}>Used</Text>
                <Text style={styles.summaryValue}>{formatMoney(totalReceivedUsed)}</Text>
              </View>

              <View style={[styles.summaryCard, { backgroundColor: '#F0FDF4' }]}>
                <Text style={styles.summaryLabel}>To Use</Text>
                <Text style={styles.summaryValue}>{formatMoney(totalReceivedPending)}</Text>
              </View>
            </View>

            {/* Received Advances List */}
            {advancesReceived.map(advance => {
              const used = calculateAdvanceUsed(advance.id, expenses);
              const remaining = calculateAdvanceRemaining(advance, expenses);
              const usagePercentage = advance.amount > 0 ? Math.round((used / advance.amount) * 100) : 0;

              return (
                <View key={advance.id} style={styles.advanceEntry}>
                  <View style={styles.entryHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.entryTitle}>From: {advance.giverName}</Text>
                      <Text style={styles.entryDate}>{advance.transactionDate}</Text>
                    </View>
                    <View style={styles.entryAmount}>
                      <Text style={styles.amountValue}>{formatMoney(advance.amount)}</Text>
                      <Text style={[styles.statusBadge, {
                        color: remaining === 0 ? '#166534' : '#0284C7',
                        backgroundColor: remaining === 0 ? '#ECFDF5' : '#E0F2FE'
                      }]}>
                        {remaining === 0 ? '✓ Used' : '⏳ Pending'}
                      </Text>
                    </View>
                  </View>

                  {/* Usage Progress */}
                  <View style={styles.progressSection}>
                    <View style={styles.progressBar}>
                      <View
                        style={[styles.progressFill, { width: `${usagePercentage}%`, backgroundColor: '#3B82F6' }]}
                      />
                    </View>
                    <View style={styles.progressInfo}>
                      <Text style={styles.progressText}>Used: {formatMoney(used)}</Text>
                      <Text style={styles.progressText}>Available: {formatMoney(remaining)}</Text>
                      <Text style={styles.progressPercent}>{usagePercentage}%</Text>
                    </View>
                  </View>

                  {/* Expenses from this Advance */}
                  {used > 0 && (
                    <View style={styles.expensesSection}>
                      <Text style={styles.expensesTitle}>Expenses from this advance</Text>
                      <Text style={styles.expensesValue}>{formatMoney(used)} used</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAFAF7' },
  scroll: { flex: 1 },
  header: { paddingHorizontal: 16, paddingVertical: 20 },
  title: { fontSize: responsiveFontSize(24), fontWeight: '800', color: '#1A1A1A' },
  subtitle: { fontSize: responsiveFontSize(12), color: 'rgba(26,26,26,0.6)', marginTop: 4 },
  section: { paddingHorizontal: 16, marginBottom: 24 },
  sectionTitle: { fontSize: responsiveFontSize(16), fontWeight: '800', color: '#1A1A1A', marginBottom: 12 },
  summaryGrid: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  summaryCard: { flex: 1, borderRadius: 12, padding: 12, alignItems: 'center' },
  summaryLabel: { fontSize: responsiveFontSize(10), fontWeight: '700', color: '#52525B' },
  summaryValue: { fontSize: responsiveFontSize(14), fontWeight: '800', color: '#1A1A1A', marginTop: 6 },
  advanceEntry: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 12 },
  entryHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  entryTitle: { fontSize: responsiveFontSize(13), fontWeight: '700', color: '#1A1A1A' },
  entryDate: { fontSize: responsiveFontSize(10), color: '#9C9C95', marginTop: 2 },
  entryAmount: { alignItems: 'flex-end' },
  amountValue: { fontSize: responsiveFontSize(14), fontWeight: '800', color: '#1A1A1A' },
  statusBadge: { fontSize: responsiveFontSize(9), fontWeight: '700', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, marginTop: 4 },
  progressSection: { marginBottom: 12 },
  progressBar: { height: 8, backgroundColor: '#ECECE6', borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
  progressFill: { height: '100%' },
  progressInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressText: { fontSize: responsiveFontSize(10), color: '#52525B', fontWeight: '600' },
  progressPercent: { fontSize: responsiveFontSize(11), fontWeight: '800', color: '#1A1A1A' },
  historySection: { backgroundColor: '#F9FAFB', borderRadius: 8, padding: 10, marginBottom: 12 },
  historyTitle: { fontSize: responsiveFontSize(11), fontWeight: '700', color: '#1A1A1A', marginBottom: 8 },
  historyItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  historyAmount: { fontSize: responsiveFontSize(11), fontWeight: '700', color: '#1A1A1A' },
  historyMeta: { fontSize: responsiveFontSize(9), color: '#9C9C95', marginTop: 2 },
  historyNote: { fontSize: responsiveFontSize(9), color: '#52525B', fontStyle: 'italic' },
  recordBtn: { backgroundColor: COLORS.primary, borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  recordBtnText: { fontSize: responsiveFontSize(12), fontWeight: '700', color: '#fff' },
  expensesSection: { backgroundColor: '#F0F9FF', borderRadius: 8, padding: 10 },
  expensesTitle: { fontSize: responsiveFontSize(10), fontWeight: '700', color: '#0284C7' },
  expensesValue: { fontSize: responsiveFontSize(12), fontWeight: '800', color: '#0284C7', marginTop: 4 },
  noDataContainer: { alignItems: 'center', paddingVertical: 100 },
  noDataEmoji: { fontSize: 56, marginBottom: 16 },
  noDataText: { fontSize: responsiveFontSize(16), fontWeight: '700', color: '#1A1A1A' },
  noDataSubtext: { fontSize: responsiveFontSize(12), color: '#9C9C95', marginTop: 8 },
});
