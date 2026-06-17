import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, ActivityIndicator } from 'react-native';
import { useStore } from '../store/useStore';
import { COLORS } from '../constants';

import LoginScreen from '../screens/Auth/LoginScreen';
import DashboardScreen from '../screens/Dashboard/DashboardScreen';
import ExpensesScreen from '../screens/Expenses/ExpensesScreen';
import AddExpenseScreen from '../screens/Expenses/AddExpenseScreen';
import AnalyticsScreen from '../screens/Analytics/AnalyticsScreen';
import ReportsScreen from '../screens/Reports/ReportsScreen';
import ActivityScreen from '../screens/Activity/ActivityScreen';
import SettingsScreen from '../screens/Settings/SettingsScreen';
import EarningsScreen from '../screens/Settings/EarningsScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TabIcon({ icon, label, focused }: { icon: string; label: string; focused: boolean }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ fontSize: 20 }}>{icon}</Text>
      <Text style={{ fontSize: 10, color: focused ? COLORS.primary : COLORS.textLight, fontWeight: focused ? '700' : '400' }}>
        {label}
      </Text>
    </View>
  );
}

function MainTabs() {
  const { currentUser } = useStore();
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false, tabBarShowLabel: false, tabBarStyle: { height: 64, paddingBottom: 8 } }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="🏠" label="Home" focused={focused} /> }}
      />
      <Tab.Screen
        name="Expenses"
        component={ExpensesScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="💰" label="Expenses" focused={focused} /> }}
      />
      <Tab.Screen
        name="Analytics"
        component={AnalyticsScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="📊" label="Analytics" focused={focused} /> }}
      />
      <Tab.Screen
        name="Reports"
        component={ReportsScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="📋" label="Reports" focused={focused} /> }}
      />
      {currentUser?.role === 'admin' && (
        <Tab.Screen
          name="Activity"
          component={ActivityScreen}
          options={{ tabBarIcon: ({ focused }) => <TabIcon icon="📝" label="Activity" focused={focused} /> }}
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
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  const { currentUser, loading, authLoading } = useStore();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary }}>
        <Text style={{ fontSize: 48, marginBottom: 20 }}>📒</Text>
        <ActivityIndicator size="large" color={COLORS.white} />
        <Text style={{ color: COLORS.white, marginTop: 12, fontWeight: '600' }}>
          {authLoading ? 'Khata Book' : 'Syncing data...'}
        </Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      {currentUser ? <AppStack /> : <LoginScreen />}
    </NavigationContainer>
  );
}
