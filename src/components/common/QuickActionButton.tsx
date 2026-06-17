import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { COLORS } from '../../constants';
import { responsiveFontSize, responsiveSpacing } from '../../utils/responsive';

interface QuickActionButtonProps {
  icon: string;
  label: string;
  color?: string;
  onPress: () => void;
}

export default function QuickActionButton({
  icon,
  label,
  color = COLORS.primary,
  onPress,
}: QuickActionButtonProps) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.iconBox, { backgroundColor: color + '20' }]}>
        <Text style={styles.icon}>{icon}</Text>
      </View>
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
  },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  icon: {
    fontSize: 24,
  },
  label: {
    fontSize: responsiveFontSize(11),
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
  },
});
