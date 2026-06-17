import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../constants';

interface Props {
  label: string;
  value: string;
  icon: string;
  color?: string;
  change?: number;
}

export default function StatCard({ label, value, icon, color = COLORS.primary, change }: Props) {
  return (
    <View style={[styles.card, { borderLeftColor: color }]}>
      <View style={styles.row}>
        <Text style={styles.icon}>{icon}</Text>
        <View style={styles.info}>
          <Text style={styles.label}>{label}</Text>
          <Text style={[styles.value, { color }]}>{value}</Text>
          {change !== undefined && (
            <Text style={[styles.change, { color: change >= 0 ? COLORS.danger : COLORS.success }]}>
              {change >= 0 ? '▲' : '▼'} {Math.abs(change).toFixed(1)}%
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: COLORS.white, borderRadius: 12, padding: 14, borderLeftWidth: 4, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  row: { flexDirection: 'row', alignItems: 'center' },
  icon: { fontSize: 28, marginRight: 12 },
  info: { flex: 1 },
  label: { fontSize: 12, color: COLORS.textLight, fontWeight: '500' },
  value: { fontSize: 20, fontWeight: '800', marginTop: 2 },
  change: { fontSize: 11, fontWeight: '600', marginTop: 2 },
});
