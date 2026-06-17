import React from 'react';
import { View, Text, StyleSheet, LinearGradient } from 'react-native';
import { COLORS } from '../../constants';
import { responsiveFontSize, responsiveSpacing } from '../../utils/responsive';

interface GradientCardProps {
  gradient: string[];
  icon: string;
  label: string;
  value: string;
  subtext?: string;
  onPress?: () => void;
}

export default function GradientCard({
  gradient,
  icon,
  label,
  value,
  subtext,
  onPress,
}: GradientCardProps) {
  return (
    <LinearGradient
      colors={gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.icon}>{icon}</Text>
          <Text style={styles.label}>{label}</Text>
        </View>
        <Text style={styles.value}>{value}</Text>
        {subtext && <Text style={styles.subtext}>{subtext}</Text>}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: responsiveSpacing(16),
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  icon: {
    fontSize: 20,
    marginRight: 8,
  },
  label: {
    fontSize: responsiveFontSize(12),
    fontWeight: '600',
    color: COLORS.white,
    opacity: 0.9,
  },
  value: {
    fontSize: responsiveFontSize(20),
    fontWeight: '800',
    color: COLORS.white,
    marginBottom: 4,
  },
  subtext: {
    fontSize: responsiveFontSize(11),
    color: COLORS.white,
    opacity: 0.7,
  },
});
