import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, ActivityIndicator, TouchableOpacity, StyleSheet } from 'react-native';
import { useStore } from '../store/useStore';
import { COLORS } from '../constants';

import LoginScreen from '../screens/Auth/LoginScreen';
import DashboardScreenPremium from '../screens/Dashboard/DashboardScreenPremium';
import ExpensesScreenPremium from '../screens/Expenses/ExpensesScreenPremium';
import AddExpenseScreen from '../screens/Expenses/AddExpenseScreen';
import AnalyticsScreen from '../screens/Analytics/AnalyticsScreen';
import ReportsScreen from '../screens/Reports/ReportsScreen';
import ActivityScreen from '../screens/Activity/ActivityScreen';
import SettingsScreen from '../screens/Settings/SettingsScreen';
import EarningsScreen from '../screens/Settings/EarningsScreen';
import WalletScreen from '../screens/Settings/WalletScreen';
import FundsScreen from '../screens/Funds/FundsScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TabIcon({ icon, label, focused }: { icon: string; label: string; focused: boolean }) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', paddingTop: 2 }}>
      <Text style={{ fontSize: 21 }}>{icon}</Text>
      <Text
        style={{
          fontSize: 10,
          color: focused ? COLORS.primary : '#9C9C95',
          fontWeight: focused ? '700' : '500',
          marginTop: 3,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

function MainTabs() {
  const { currentUser } = useStore();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          height: 72,
          paddingBottom: 8,
          paddingTop: 8,
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#ECECE6',
          elevation: 8,
          shadowColor: '#000',
          shadowOpacity: 0.08,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: -2 },
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreenPremium}
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="🏠" label="Home" focused={focused} /> }}
      />
      <Tab.Screen
        name="Expenses"
        component={ExpensesScreenPremium}
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="💸" label="Expense" focused={focused} /> }}
      />
      <Tab.Screen
        name="Analytics"
        component={AnalyticsScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="📈" label="Analytics" focused={focused} /> }}
      />
      {currentUser?.role === 'admin' && (
        <Tab.Screen
          name="Activity"
          component={ActivityScreen}
          options={{ tabBarIcon: ({ focused }) => <TabIcon icon="📋" label="More" focused={focused} /> }}
        />
      )}
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="⚙️" label="Settings" focused={focused} /> }}
      />
    </Tab.Navigator>
  );
}

function AppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main" component={MainTabs} />
      <Stack.Screen name="AddExpense" component={AddExpenseScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="Earnings" component={EarningsScreen} options={{ presentation: 'card' }} />
      <Stack.Screen name="Wallet" component={WalletScreen} options={{ presentation: 'card' }} />
      <Stack.Screen name="Reports" component={ReportsScreen} options={{ presentation: 'card' }} />
      <Stack.Screen name="Funds" component={FundsScreen} options={{ presentation: 'card' }} />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  const { currentUser, loading, authLoading } = useStore();

  if (loading) {
    return (
      <View style={styles.loader}>
        <LinearLoadingScreen authLoading={authLoading} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {currentUser ? <AppStack /> : <LoginScreen />}
    </NavigationContainer>
  );
}

function LinearLoadingScreen({ authLoading }: { authLoading: boolean }) {
  return (
    <View style={styles.loaderInner}>
      <View style={styles.loaderIconBg}>
        <Text style={{ fontSize: 40 }}>📒</Text>
      </View>
      <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 24 }} />
      <Text style={styles.loaderText}>
        {authLoading ? 'Khata Book' : 'Syncing data...'}
      </Text>
      <Text style={styles.loaderSub}>Your personal finance tracker</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  loader: { flex: 1, backgroundColor: '#FAFAF7' },
  loaderInner: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loaderIconBg: {
    width: 88,
    height: 88,
    borderRadius: 28,
    backgroundColor: COLORS.primaryLight + '20',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.primaryLight + '40',
  },
  loaderText: { color: COLORS.text, marginTop: 16, fontWeight: '700', fontSize: 18 },
  loaderSub: { color: COLORS.textLight, marginTop: 4, fontSize: 13, fontWeight: '500' },
});
