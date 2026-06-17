import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  Alert, Image, ScrollView,
} from 'react-native';
import { USERS, COLORS } from '../../constants';
import { useStore } from '../../store/useStore';
import { User } from '../../types';

export default function LoginScreen() {
  const { login } = useStore();
  const [selected, setSelected] = useState<User | null>(null);

  const handleLogin = async () => {
    if (!selected) {
      Alert.alert('Select User', 'Please select your profile to continue.');
      return;
    }
    await login(selected);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.logo}>📒</Text>
          <Text style={styles.title}>Khata Book</Text>
          <Text style={styles.subtitle}>Expense Tracking System</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.selectLabel}>Select Your Profile</Text>

          {USERS.map(user => (
            <TouchableOpacity
              key={user.id}
              style={[styles.userCard, selected?.id === user.id && styles.userCardSelected]}
              onPress={() => setSelected(user)}
              activeOpacity={0.7}
            >
              <View style={[styles.avatar, { backgroundColor: user.role === 'admin' ? COLORS.primary : COLORS.secondary }]}>
                <Text style={styles.avatarText}>{user.name[0]}</Text>
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{user.name}</Text>
                <Text style={styles.userEmail}>{user.email}</Text>
                <View style={[styles.roleBadge, { backgroundColor: user.role === 'admin' ? COLORS.primary + '20' : COLORS.secondary + '20' }]}>
                  <Text style={[styles.roleText, { color: user.role === 'admin' ? COLORS.primary : COLORS.secondary }]}>
                    {user.role === 'admin' ? 'Admin' : 'User'}
                  </Text>
                </View>
              </View>
              {selected?.id === user.id && (
                <View style={styles.checkmark}>
                  <Text style={styles.checkmarkText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={[styles.loginBtn, !selected && styles.loginBtnDisabled]}
            onPress={handleLogin}
            activeOpacity={0.8}
          >
            <Text style={styles.loginBtnText}>Continue →</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>Offline-first • Secure • Fast</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary },
  content: { flexGrow: 1, alignItems: 'center', paddingHorizontal: 24, paddingVertical: 40 },
  header: { alignItems: 'center', marginBottom: 40 },
  logo: { fontSize: 64, marginBottom: 12 },
  title: { fontSize: 32, fontWeight: '800', color: COLORS.white, letterSpacing: 1 },
  subtitle: { fontSize: 14, color: COLORS.white + 'CC', marginTop: 4 },
  card: { width: '100%', backgroundColor: COLORS.white, borderRadius: 20, padding: 24, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 20, elevation: 10 },
  selectLabel: { fontSize: 16, fontWeight: '600', color: COLORS.text, marginBottom: 16 },
  userCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, borderWidth: 2, borderColor: COLORS.border, marginBottom: 12, backgroundColor: COLORS.background },
  userCardSelected: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '08' },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  avatarText: { fontSize: 20, fontWeight: '700', color: COLORS.white },
  userInfo: { flex: 1 },
  userName: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  userEmail: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
  roleBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, marginTop: 4 },
  roleText: { fontSize: 11, fontWeight: '600' },
  checkmark: { width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  checkmarkText: { color: COLORS.white, fontWeight: '700', fontSize: 14 },
  loginBtn: { backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  loginBtnDisabled: { opacity: 0.5 },
  loginBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
  footer: { marginTop: 32, color: COLORS.white + '99', fontSize: 12 },
});
