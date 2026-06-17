import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../constants';
import { CashFlowProjection } from '../../utils/cashFlow';
import { responsiveFontSize, responsiveSpacing } from '../../utils/responsive';

interface CashFlowCardProps {
  projection: CashFlowProjection;
}

export default function CashFlowCard({ projection }: CashFlowCardProps) {
  const riskColor = projection.riskLevel === 'high' ? COLORS.danger : projection.riskLevel === 'medium' ? COLORS.warning : COLORS.success;
  const riskEmoji = projection.riskLevel === 'high' ? '🔴' : projection.riskLevel === 'medium' ? '🟡' : '🟢';

  return (
    <View style={[styles.card, { borderLeftWidth: 4, borderLeftColor: riskColor }]}>
      <View style={styles.header}>
        <Text style={styles.title}>💰 Cash Flow Projection</Text>
        <Text style={[styles.riskBadge, { backgroundColor: riskColor + '20' }]}>
          <Text style={{ color: riskColor }}>{riskEmoji} {projection.riskLevel}</Text>
        </Text>
      </View>

      <View style={styles.projectionRow}>
        <View style={styles.projectionItem}>
          <Text style={styles.projectionLabel}>Current</Text>
          <Text style={styles.projectionAmount}>
            Rs. {projection.currentBalance.toLocaleString()}
          </Text>
        </View>
        <Text style={styles.arrow}>→</Text>
        <View style={styles.projectionItem}>
          <Text style={styles.projectionLabel}>Month End</Text>
          <Text style={[styles.projectionAmount, { color: projection.projectedEnd > 0 ? COLORS.success : COLORS.danger }]}>
            Rs. {projection.projectedEnd.toLocaleString()}
          </Text>
        </View>
      </View>

      <View style={styles.statusBar}>
        <View style={[styles.statusFill, { width: `${Math.min((projection.projectedEnd / projection.currentBalance) * 100, 100)}%`, backgroundColor: riskColor }]} />
      </View>

      {projection.daysToNegative && (
        <View style={styles.warningBox}>
          <Text style={styles.warningText}>
            ⚠️ Potential deficit on day {projection.daysToNegative}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: responsiveSpacing(16),
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
    borderWidth: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: responsiveFontSize(15),
    fontWeight: '700',
    color: COLORS.text,
  },
  riskBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  projectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  projectionItem: {
    flex: 1,
  },
  projectionLabel: {
    fontSize: responsiveFontSize(11),
    color: COLORS.textLight,
    fontWeight: '600',
  },
  projectionAmount: {
    fontSize: responsiveFontSize(16),
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 4,
  },
  arrow: {
    fontSize: 18,
    color: COLORS.textLight,
    marginHorizontal: 8,
  },
  statusBar: {
    height: 6,
    backgroundColor: COLORS.divider,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 10,
  },
  statusFill: {
    height: 6,
    borderRadius: 3,
  },
  warningBox: {
    backgroundColor: COLORS.dangerLight,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 6,
  },
  warningText: {
    fontSize: responsiveFontSize(12),
    color: COLORS.danger,
    fontWeight: '600',
  },
});
