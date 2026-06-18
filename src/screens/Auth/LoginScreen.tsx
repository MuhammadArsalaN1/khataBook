import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
   ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { USERS, COLORS } from '../../constants';
import { useStore } from '../../store/useStore';
import { User } from '../../types';

export default function LoginScreen() {
  const { login, authLoading, authError } = useStore();
  const [selected, setSelected] = useState<User | null>(null);
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);

  const handleLogin = async () => {
    if (!selected) return;
    await login(selected.email, password);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.logo}>📒</Text>
            <Text style={styles.title}>Khata Book</Text>
            <Text style={styles.subtitle}>Expense Tracking System</Text>
          </View>

          <View style={styles.card}>
            {/* Step 1 — select profile */}
            <Text style={styles.sectionLabel}>1. Select Profile</Text>
            {USERS.map(user => (
              <TouchableOpacity
                key={user.id}
                style={[styles.userCard, selected?.id === user.id && styles.userCardSelected]}
                onPress={() => { setSelected(user); setPassword(''); }}
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

            {/* Step 2 — password */}
            {selected && (
              <>
                <Text style={[styles.sectionLabel, { marginTop: 20 }]}>2. Enter Password</Text>
                <View style={styles.passwordRow}>
                  <TextInput
                    style={styles.passwordInput}
                    value={password}
                    onChangeText={setPassword}
                    placeholder={`Password for ${selected.name}`}
                    placeholderTextColor={COLORS.textLight}
                    secureTextEntry={!showPass}
                    autoCapitalize="none"
                    returnKeyType="done"
                    onSubmitEditing={handleLogin}
                  />
                  <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPass(v => !v)}>
                    <Text style={styles.eyeText}>{showPass ? '🙈' : '👁️'}</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* Error */}
            {authError ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>⚠️ {authError}</Text>
              </View>
            ) : null}

            {/* Login button */}
            <TouchableOpacity
              style={[styles.loginBtn, (!selected || !password || authLoading) && styles.loginBtnDisabled]}
              onPress={handleLogin}
              disabled={!selected || !password || authLoading}
              activeOpacity={0.8}
            >
              {authLoading
                ? <ActivityIndicator color={COLORS.white} />
                : <Text style={styles.loginBtnText}>Sign In →</Text>
              }
            </TouchableOpacity>
          </View>

          <Text style={styles.footer}>Secured by Firebase • Synced in real-time</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.primary },
  content: { flexGrow: 1, alignItems: 'center', paddingHorizontal: 24, paddingVertical: 40 },
  header: { alignItems: 'center', marginBottom: 36 },
  logo: { fontSize: 64, marginBottom: 12 },
  title: { fontSize: 32, fontWeight: '800', color: COLORS.white, letterSpacing: 1 },
  subtitle: { fontSize: 14, color: COLORS.white + 'CC', marginTop: 4 },
  card: { width: '100%', backgroundColor: COLORS.white, borderRadius: 20, padding: 24, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 20, elevation: 10 },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: COLORS.textLight, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  userCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, borderWidth: 2, borderColor: COLORS.border, marginBottom: 10, backgroundColor: COLORS.background },
  userCardSelected: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '08' },
  avatar: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarText: { fontSize: 20, fontWeight: '700', color: COLORS.white },
  userInfo: { flex: 1 },
  userName: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  userEmail: { fontSize: 12, color: COLORS.textLight, marginTop: 1 },
  roleBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, marginTop: 4 },
  roleText: { fontSize: 11, fontWeight: '600' },
  checkmark: { width: 26, height: 26, borderRadius: 13, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  checkmarkText: { color: COLORS.white, fontWeight: '700', fontSize: 13 },
  passwordRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 12, backgroundColor: COLORS.background, marginBottom: 8 },
  passwordInput: { flex: 1, padding: 14, fontSize: 15, color: COLORS.text },
  eyeBtn: { paddingHorizontal: 14 },
  eyeText: { fontSize: 18 },
  errorBox: { backgroundColor: '#F5F5F0', borderRadius: 10, padding: 12, marginBottom: 8 },
  errorText: { color: '#1A1A1A', fontSize: 13, fontWeight: '500' },
  loginBtn: { backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  loginBtnDisabled: { opacity: 0.45 },
  loginBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
  footer: { marginTop: 28, color: COLORS.white + '99', fontSize: 12 },
});
