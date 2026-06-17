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
    padding: responsiveSpacing(12),
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  goalIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  goalName: {
    fontSize: responsiveFontSize(14),
    fontWeight: '700',
    color: COLORS.text,
  },
  goalCategory: {
    fontSize: responsiveFontSize(10),
    color: COLORS.textLight,
    marginTop: 2,
  },
  statusBadge: {
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: responsiveFontSize(12),
    fontWeight: '700',
    color: COLORS.primary,
  },
  progressSection: {
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: 6,
    borderRadius: 3,
  },
  amounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amountText: {
    fontSize: responsiveFontSize(11),
    fontWeight: '600',
    color: COLORS.text,
  },
  remainingText: {
    fontSize: responsiveFontSize(10),
    color: COLORS.textLight,
  },
  footer: {
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  deadlineText: {
    fontSize: responsiveFontSize(10),
    color: COLORS.textLight,
    fontWeight: '500',
  },
});
