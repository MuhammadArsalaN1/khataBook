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
    padding: responsiveSpacing(10),
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  iconText: {
    fontSize: 18,
  },
  content: {
    flex: 1,
  },
  name: {
    fontSize: responsiveFontSize(13),
    fontWeight: '700',
    color: COLORS.text,
  },
  category: {
    fontSize: responsiveFontSize(10),
    color: COLORS.textLight,
    marginTop: 2,
  },
  amount: {
    fontSize: responsiveFontSize(13),
    fontWeight: '700',
    color: COLORS.primary,
  },
});
