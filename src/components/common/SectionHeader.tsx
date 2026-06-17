import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS } from '../../constants';
import { responsiveFontSize } from '../../utils/responsive';

interface SectionHeaderProps {
  title: string;
  icon?: string;
  action?: {
    label: string;
    onPress: () => void;
  };
}

export default function SectionHeader({ title, icon, action }: SectionHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.titleSection}>
        {icon && <Text style={styles.icon}>{icon}</Text>}
        <Text style={styles.title}>{title}</Text>
      </View>
      {action && (
        <TouchableOpacity onPress={action.onPress}>
          <Text style={styles.action}>{action.label} →</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 12,
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    fontSize: 18,
    marginRight: 8,
  },
  title: {
    fontSize: responsiveFontSize(16),
    fontWeight: '700',
    color: COLORS.text,
  },
  action: {
    fontSize: responsiveFontSize(12),
    color: COLORS.primary,
    fontWeight: '700',
  },
});
