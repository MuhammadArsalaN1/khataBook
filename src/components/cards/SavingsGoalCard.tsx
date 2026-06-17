import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, TYPE_ICONS, TYPE_COLORS } from '../../constants';
import { SavingsGoal } from '../../types';
import { responsiveFontSize, responsiveSpacing } from '../../utils/responsive';

interface SavingsGoalCardProps {
  goal: SavingsGoal;
  onPress?: () => void;
}

export default function SavingsGoalCard({ goal, onPress }: SavingsGoalCardProps) {
  const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
  const remaining = goal.targetAmount - goal.currentAmount;
  const daysLeft = Math.ceil((new Date(goal.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.titleSection}>
          <Text style={[styles.goalIcon]}>
            {goal.category === 'personal' ? '💰' : goal.category === 'office' ? '💼' : '🎯'}
          </Text>
          <View>
            <Text style={styles.goalName}>{goal.name}</Text>
            <Text style={styles.goalCategory}>{goal.category}</Text>
          </View>
        </View>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{Math.round(progress)}%</Text>
        </View>
      </View>

      <View style={styles.progressSection}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${progress}%`,
                backgroundColor: progress >= 100 ? COLORS.success : COLORS.primary,
              },
            ]}
          />
        </View>
        <View style={styles.amounts}>
          <Text style={styles.amountText}>
            Rs. {goal.currentAmount.toLocaleString()} / {goal.targetAmount.toLocaleString()}
          </Text>
          {remaining > 0 && (
            <Text style={styles.remainingText}>
              Rs. {remaining.toLocaleString()} remaining
            </Text>
          )}
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.deadlineText}>
          {daysLeft > 0 ? `${daysLeft} days left` : daysLeft === 0 ? 'Due today' : 'Overdue'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: responsiveSpacing(14),
    marginBottom: 12,
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
    marginBottom: 12,
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  goalIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  goalName: {
    fontSize: responsiveFontSize(15),
    fontWeight: '700',
    color: COLORS.text,
  },
  goalCategory: {
    fontSize: responsiveFontSize(11),
    color: COLORS.textLight,
    marginTop: 2,
    fontWeight: '500',
  },
  statusBadge: {
    backgroundColor: COLORS.primary + '12',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  statusText: {
    fontSize: responsiveFontSize(12),
    fontWeight: '700',
    color: COLORS.primary,
  },
  progressSection: {
    marginBottom: 10,
  },
  progressBar: {
    height: 7,
    backgroundColor: COLORS.divider,
    borderRadius: 3.5,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: 7,
    borderRadius: 3.5,
  },
  amounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amountText: {
    fontSize: responsiveFontSize(12),
    fontWeight: '600',
    color: COLORS.text,
  },
  remainingText: {
    fontSize: responsiveFontSize(11),
    color: COLORS.textLight,
    fontWeight: '500',
  },
  footer: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  deadlineText: {
    fontSize: responsiveFontSize(11),
    color: COLORS.textLight,
    fontWeight: '600',
  },
});
