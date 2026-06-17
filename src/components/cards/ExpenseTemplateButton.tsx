import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, TYPE_COLORS, TYPE_ICONS } from '../../constants';
import { ExpenseTemplate } from '../../types';
import { responsiveFontSize, responsiveSpacing } from '../../utils/responsive';

interface ExpenseTemplateButtonProps {
  template: ExpenseTemplate;
  onPress: () => void;
}

export default function ExpenseTemplateButton({ template, onPress }: ExpenseTemplateButtonProps) {
  return (
    <TouchableOpacity
      style={styles.button}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.icon, { backgroundColor: TYPE_COLORS[template.type] + '20' }]}>
        <Text style={styles.iconText}>{TYPE_ICONS[template.type]}</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.name}>{template.name}</Text>
        <Text style={styles.category}>{template.category}</Text>
      </View>
      <Text style={styles.amount}>Rs. {template.amount.toLocaleString()}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: responsiveSpacing(12),
    marginBottom: 10,
    borderWidth: 0,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 20,
  },
  content: {
    flex: 1,
  },
  name: {
    fontSize: responsiveFontSize(14),
    fontWeight: '700',
    color: COLORS.text,
  },
  category: {
    fontSize: responsiveFontSize(11),
    color: COLORS.textLight,
    marginTop: 2,
    fontWeight: '500',
  },
  amount: {
    fontSize: responsiveFontSize(14),
    fontWeight: '700',
    color: COLORS.primary,
  },
});
