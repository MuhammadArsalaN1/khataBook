import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Switch, TextInput, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { format } from 'date-fns';
import { useStore } from '../../store/useStore';
import { COLORS, GRADIENTS, TYPE_LABELS, USERS, CURRENCIES } from '../../constants';
import { ExpenseType, Currency } from '../../types';
import { responsiveFontSize } from '../../utils/responsive';

function SettingsRow({
  icon, iconBg, label, subtitle, onPress, right,
}: {
  icon: string; iconBg: string; label: string; subtitle?: string;
  onPress?: () => void; right?: React.ReactNode;
}) {
  return (
    <TouchableOpacity
      style={settingRowStyles.row}
      onPress={onPress}
      activeOpacity={onPress ? 0.65 : 1}
      disabled={!onPress}
    >
      <View style={[settingRowStyles.iconBg, { backgroundColor: iconBg }]}>
        <Text style={settingRowStyles.icon}>{icon}</Text>
      </View>
      <View style={settingRowStyles.info}>
        <Text style={settingRowStyles.label}>{label}</Text>
        {subtitle ? <Text style={settingRowStyles.subtitle}>{subtitle}</Text> : null}
      </View>
      {right ?? <Text style={settingRowStyles.chevron}>›</Text>}
    </TouchableOpacity>
  );
}

const settingRowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F0',
  },
  iconBg: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  icon: { fontSize: 19 },
  info: { flex: 1 },
  label: { fontSize: responsiveFontSize(14), fontWeight: '600', color: '#1A1A1A' },
  subtitle: { fontSize: responsiveFontSize(11), color: '#9C9C95', marginTop: 1, fontWeight: '500' },
  chevron: { fontSize: 20, color: '#ECECE6', marginLeft: 4 },
});

export default function SettingsScreen() {
  const navigation = useNavigation<any>();
  const { currentUser, logout, approvalMode, toggleApprovalMode, budgets, saveBudget, exchangeRates, saveExchangeRates } = useStore();
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const getBudget = (type: ExpenseType) =>
    budgets.find(b => b.type === type && b.month === month && b.year === year);

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

  const FX: Currency[] = ['USD', 'EUR', 'GBP'];
  const [rateInputs, setRateInputs] = useState<Record<string, string>>({
    USD: String(exchangeRates.USD), EUR: String(exchangeRates.EUR), GBP: String(exchangeRates.GBP),
  });
  const saveRates = async () => {
    const next = { ...exchangeRates };
    for (const c of FX) {
      const v = Number(rateInputs[c]);
      if (isNaN(v) || v <= 0) { Alert.alert('Invalid', `Enter a valid ${c} rate.`); return; }
      next[c] = v;
    }
    await saveExchangeRates(next);
    Alert.alert('Saved', 'Exchange rates updated.');
  };

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']}>
        {/* Profile Header */}
        <LinearGradient
          colors={GRADIENTS.header as any}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.profileHeader}
        >
          <View style={styles.profileAvatar}>
            <Text style={styles.profileAvatarText}>{currentUser?.name?.charAt(0) ?? 'A'}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{currentUser?.name}</Text>
            <Text style={styles.profileEmail}>{currentUser?.email}</Text>
          </View>
          <View style={[styles.rolePill, { backgroundColor: 'rgba(26,26,26,0.85)' }]}>
            <Text style={styles.rolePillText}>{currentUser?.role?.toUpperCase()}</Text>
          </View>
        </LinearGradient>
      </SafeAreaView>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Main Actions */}
        <Text style={styles.groupLabel}>ACCOUNT</Text>
        <View style={styles.group}>
          <SettingsRow
            icon="💰"
            iconBg="#FEF3C7"
            label="Earnings & Income"
            subtitle="Set monthly income per category"
            onPress={() => navigation.navigate('Earnings')}
          />
          <SettingsRow
            icon="👛"
            iconBg="#F5F5F0"
            label="My Wallets"
            subtitle="Track balances across payment methods"
            onPress={() => navigation.navigate('Wallet')}
          />
          <SettingsRow
            icon="🤝"
            iconBg="#FEF3C7"
            label="Funds & Advances"
            subtitle="Money given / received & fund sources"
            onPress={() => navigation.navigate('Funds')}
          />
        </View>

        <Text style={styles.groupLabel}>FINANCE</Text>
        <View style={styles.group}>
          <SettingsRow
            icon="📑"
            iconBg="#FFFDF5"
            label="Reports"
            subtitle="Export & share period summaries"
            onPress={() => navigation.navigate('Reports')}
          />
        </View>

        <Text style={styles.groupLabel}>EXCHANGE RATES (→ PKR)</Text>
        <View style={styles.group}>
          {FX.map((c, idx) => (
            <View key={c} style={[styles.budgetInputRow, idx === FX.length - 1 && { borderBottomWidth: 0 }]}>
              <Text style={styles.budgetType}>{CURRENCIES[c].flag} 1 {c}</Text>
              <TextInput
                style={styles.budgetInput}
                value={rateInputs[c]}
                onChangeText={v => setRateInputs(prev => ({ ...prev, [c]: v }))}
                keyboardType="numeric"
                placeholder="Rate in PKR"
                placeholderTextColor="#9C9C95"
              />
              <Text style={styles.rateUnit}>PKR</Text>
            </View>
          ))}
          <TouchableOpacity style={styles.ratesSaveBtn} onPress={saveRates}>
            <Text style={styles.ratesSaveBtnText}>Save Rates</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.groupLabel}>BUDGETS</Text>
        <View style={styles.group}>
          <SettingsRow
            icon="📊"
            iconBg="#FEF3C7"
            label="Monthly Budgets"
            subtitle={format(now, 'MMMM yyyy')}
            onPress={undefined}
            right={<View />}
          />
          {(['personal', 'office', 'farm'] as ExpenseType[]).map((type, idx) => (
            <View key={type} style={[styles.budgetInputRow, idx === 2 && { borderBottomWidth: 0 }]}>
              <Text style={styles.budgetType}>{TYPE_LABELS[type]}</Text>
              <TextInput
                style={styles.budgetInput}
                value={budgetInputs[type]}
                onChangeText={val => setBudgetInputs(prev => ({ ...prev, [type]: val }))}
                keyboardType="numeric"
                placeholder="Set limit..."
                placeholderTextColor="#9C9C95"
              />
              <TouchableOpacity style={styles.saveBudgetBtn} onPress={() => saveBudgetForType(type)}>
                <Text style={styles.saveBudgetBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {currentUser?.role === 'admin' && (
          <>
            <Text style={styles.groupLabel}>ADMIN</Text>
            <View style={styles.group}>
              <SettingsRow
                icon="🔐"
                iconBg="#F5F5F0"
                label="Approval Mode"
                subtitle="Require approval for Rehan's entries"
                onPress={undefined}
                right={
                  <Switch
                    value={approvalMode}
                    onValueChange={toggleApprovalMode}
                    trackColor={{ true: COLORS.primary, false: '#ECECE6' }}
                    thumbColor="#fff"
                  />
                }
              />
            </View>
          </>
        )}

        <Text style={styles.groupLabel}>APP</Text>
        <View style={styles.group}>
          <View style={[settingRowStyles.row, { borderBottomWidth: 1 }]}>
            <View style={[settingRowStyles.iconBg, { backgroundColor: '#FFFDF5' }]}>
              <Text style={settingRowStyles.icon}>📒</Text>
            </View>
            <View style={settingRowStyles.info}>
              <Text style={settingRowStyles.label}>Khata Book</Text>
              <Text style={settingRowStyles.subtitle}>Version 1.0.0</Text>
            </View>
          </View>
          <View style={[settingRowStyles.row, { borderBottomWidth: 0 }]}>
            <View style={[settingRowStyles.iconBg, { backgroundColor: '#FEF3C7' }]}>
              <Text style={settingRowStyles.icon}>👥</Text>
            </View>
            <View style={settingRowStyles.info}>
              <Text style={settingRowStyles.label}>Users</Text>
              <Text style={settingRowStyles.subtitle}>{USERS.map(u => u.name).join(' & ')}</Text>
            </View>
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutIcon}>🚪</Text>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FAFAF7' },
  profileHeader: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  profileAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(26,26,26,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  profileAvatarText: { color: COLORS.accent, fontWeight: '800', fontSize: 22 },
  profileInfo: { flex: 1 },
  profileName: { color: '#1A1A1A', fontSize: responsiveFontSize(17), fontWeight: '800' },
  profileEmail: { color: 'rgba(26,26,26,0.7)', fontSize: responsiveFontSize(12), marginTop: 2, fontWeight: '500' },
  rolePill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  rolePillText: { color: COLORS.accent, fontSize: responsiveFontSize(10), fontWeight: '800', letterSpacing: 0.5 },
  scroll: { flex: 1 },
  groupLabel: {
    fontSize: responsiveFontSize(11),
    fontWeight: '700',
    color: '#9C9C95',
    letterSpacing: 0.8,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
  },
  group: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  budgetInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F0',
    gap: 10,
  },
  budgetType: {
    width: 70,
    fontSize: responsiveFontSize(13),
    fontWeight: '600',
    color: COLORS.textMed,
  },
  budgetInput: {
    flex: 1,
    backgroundColor: '#FAFAF7',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: responsiveFontSize(13),
    color: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#ECECE6',
  },
  saveBudgetBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  saveBudgetBtnText: { color: '#fff', fontWeight: '700', fontSize: responsiveFontSize(12) },
  rateUnit: { fontSize: responsiveFontSize(12), fontWeight: '700', color: COLORS.textLight, width: 36 },
  ratesSaveBtn: { backgroundColor: COLORS.primary, margin: 12, borderRadius: 10, paddingVertical: 11, alignItems: 'center' },
  ratesSaveBtnText: { color: '#fff', fontWeight: '700', fontSize: responsiveFontSize(13) },
  logoutBtn: {
    margin: 16,
    marginTop: 24,
    backgroundColor: '#F5F5F0',
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#ECECE6',
  },
  logoutIcon: { fontSize: 20 },
  logoutText: { fontSize: responsiveFontSize(15), fontWeight: '700', color: '#1A1A1A' },
});
