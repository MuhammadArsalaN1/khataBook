import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Switch, TextInput, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { format } from 'date-fns';
import { useStore } from '../../store/useStore';
import { COLORS, TYPE_LABELS, USERS } from '../../constants';
import { ExpenseType } from '../../types';

export default function SettingsScreen() {
  const navigation = useNavigation<any>();
  const { currentUser, logout, approvalMode, toggleApprovalMode, budgets, saveBudget } = useStore();
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const getBudget = (type: ExpenseType) => budgets.find(b => b.type === type && b.month === month && b.year === year);

  const [budgetInputs, setBudgetInputs] = useState<Record<ExpenseType, string>>({
    personal: getBudget('personal')?.limit.toString() ?? '',
    office: getBudget('office')?.limit.toString() ?? '',
    farm: getBudget('farm')?.limit.toString() ?? '',
  });

  const saveBudgetForType = async (type: ExpenseType) => {
    const val = Number(budgetInputs[type]);
    if (isNaN(val) || val <= 0) { Alert.alert('Invalid', 'Enter a valid budget amount.'); return; }
    await saveBudget({ type, month, year, limit: val });
    Alert.alert('Saved', `${TYPE_LABELS[type]} budget set to Rs. ${val.toLocaleString()}`);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Settings</Text>

        {/* Profile */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Current Profile</Text>
          <View style={styles.profileRow}>
            <View style={[styles.avatar, { backgroundColor: currentUser?.role === 'admin' ? COLORS.primary : COLORS.secondary }]}>
              <Text style={styles.avatarText}>{currentUser?.name?.[0]}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{currentUser?.name}</Text>
              <Text style={styles.profileEmail}>{currentUser?.email}</Text>
              <View style={[styles.roleBadge, { backgroundColor: currentUser?.role === 'admin' ? COLORS.primary + '20' : COLORS.secondary + '20' }]}>
                <Text style={[styles.roleText, { color: currentUser?.role === 'admin' ? COLORS.primary : COLORS.secondary }]}>
                  {currentUser?.role}
                </Text>
              </View>
            </View>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
            <Text style={styles.logoutBtnText}>Switch User</Text>
          </TouchableOpacity>
        </View>

        {/* Earnings & Income */}
        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('Earnings')} activeOpacity={0.7}>
          <View style={styles.earningsRow}>
            <View style={styles.earningsIconBox}>
              <Text style={styles.earningsIcon}>💰</Text>
            </View>
            <View style={styles.earningsInfo}>
              <Text style={styles.earningsTitle}>Manage Earnings & Income</Text>
              <Text style={styles.earningsDesc}>Set monthly income for each category</Text>
            </View>
            <Text style={styles.earningsChevron}>›</Text>
          </View>
        </TouchableOpacity>

        {/* Wallets */}
        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('Wallet')} activeOpacity={0.7}>
          <View style={styles.earningsRow}>
            <View style={styles.earningsIconBox} style={{ backgroundColor: '#E0F2FE' }}>
              <Text style={styles.earningsIcon}>👛</Text>
            </View>
            <View style={styles.earningsInfo}>
              <Text style={styles.earningsTitle}>Manage Wallets</Text>
              <Text style={styles.earningsDesc}>Track balances across payment methods</Text>
            </View>
            <Text style={styles.earningsChevron}>›</Text>
          </View>
        </TouchableOpacity>

        {/* Approval Mode — Admin only */}
        {currentUser?.role === 'admin' && (
          <View style={styles.card}>
            <View style={styles.switchRow}>
              <View>
                <Text style={styles.switchLabel}>Approval Mode</Text>
                <Text style={styles.switchDesc}>Require admin approval for Rehan's entries</Text>
              </View>
              <Switch
                value={approvalMode}
                onValueChange={toggleApprovalMode}
                trackColor={{ true: COLORS.primary }}
              />
            </View>
          </View>
        )}

        {/* Monthly Budgets */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Monthly Budgets — {format(now, 'MMMM yyyy')}</Text>
          {(['personal', 'office', 'farm'] as ExpenseType[]).map(type => (
            <View key={type} style={styles.budgetRow}>
              <Text style={styles.budgetLabel}>{TYPE_LABELS[type]}</Text>
              <TextInput
                style={styles.budgetInput}
                value={budgetInputs[type]}
                onChangeText={val => setBudgetInputs(prev => ({ ...prev, [type]: val }))}
                keyboardType="numeric"
                placeholder="Set limit"
                placeholderTextColor={COLORS.textLight}
              />
              <TouchableOpacity style={styles.saveSmallBtn} onPress={() => saveBudgetForType(type)}>
                <Text style={styles.saveSmallBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* App Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>About</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>App</Text>
            <Text style={styles.infoValue}>Khata Book</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Version</Text>
            <Text style={styles.infoValue}>1.0.0</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Users</Text>
            <Text style={styles.infoValue}>{USERS.map(u => u.name).join(', ')}</Text>
          </View>
          <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.infoLabel}>Storage</Text>
            <Text style={styles.infoValue}>Local (Offline-first)</Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1, paddingHorizontal: 16 },
  title: { fontSize: 22, fontWeight: '800', color: COLORS.text, paddingTop: 16, marginBottom: 14 },
  card: { backgroundColor: COLORS.white, borderRadius: 14, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 14 },
  profileRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  avatar: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  avatarText: { fontSize: 22, fontWeight: '700', color: COLORS.white },
  profileInfo: {},
  profileName: { fontSize: 17, fontWeight: '700', color: COLORS.text },
  profileEmail: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
  roleBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginTop: 4 },
  roleText: { fontSize: 11, fontWeight: '700' },
  logoutBtn: { backgroundColor: COLORS.border, borderRadius: 10, padding: 12, alignItems: 'center' },
  logoutBtnText: { color: COLORS.text, fontWeight: '700', fontSize: 14 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  switchLabel: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  switchDesc: { fontSize: 12, color: COLORS.textLight, marginTop: 2, maxWidth: 220 },
  budgetRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  budgetLabel: { width: 70, fontSize: 13, color: COLORS.text, fontWeight: '500' },
  budgetInput: { flex: 1, backgroundColor: COLORS.background, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border, padding: 10, fontSize: 14, color: COLORS.text, marginHorizontal: 8 },
  saveSmallBtn: { backgroundColor: COLORS.primary, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 10 },
  saveSmallBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 12 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  infoLabel: { fontSize: 13, color: COLORS.textLight },
  infoValue: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  earningsRow: { flexDirection: 'row', alignItems: 'center' },
  earningsIconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#FEF3C7', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  earningsIcon: { fontSize: 20 },
  earningsInfo: { flex: 1 },
  earningsTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  earningsDesc: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
  earningsChevron: { fontSize: 20, color: COLORS.textLight, marginLeft: 8 },
});
