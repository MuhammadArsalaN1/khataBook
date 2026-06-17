import React, { useMemo, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet,  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import { useStore } from '../../store/useStore';
import { COLORS, USERS } from '../../constants';
import { ActionType, ActivityLog } from '../../types';

const ACTION_COLORS: Record<ActionType, string> = {
  add: COLORS.success,
  edit: COLORS.warning,
  delete: COLORS.danger,
  approve: COLORS.primary,
  reject: COLORS.danger,
};

const ACTION_ICONS: Record<ActionType, string> = {
  add: '➕',
  edit: '✏️',
  delete: '🗑️',
  approve: '✅',
  reject: '❌',
};

export default function ActivityScreen() {
  const { activityLogs } = useStore();
  const [search, setSearch] = useState('');
  const [filterUser, setFilterUser] = useState<string>('all');

  const filtered = useMemo(() =>
    activityLogs
      .filter(l => filterUser === 'all' || l.userId === filterUser)
      .filter(l =>
        !search ||
        l.details.toLowerCase().includes(search.toLowerCase()) ||
        l.userName.toLowerCase().includes(search.toLowerCase())
      ),
    [activityLogs, filterUser, search]
  );

  const renderItem = ({ item }: { item: ActivityLog }) => (
    <View style={styles.card}>
      <View style={[styles.iconBox, { backgroundColor: ACTION_COLORS[item.action] + '20' }]}>
        <Text style={styles.icon}>{ACTION_ICONS[item.action]}</Text>
      </View>
      <View style={styles.info}>
        <View style={styles.row}>
          <Text style={styles.user}>{item.userName}</Text>
          <View style={[styles.badge, { backgroundColor: ACTION_COLORS[item.action] + '20' }]}>
            <Text style={[styles.badgeText, { color: ACTION_COLORS[item.action] }]}>{item.action}</Text>
          </View>
        </View>
        <Text style={styles.details}>{item.details}</Text>
        <Text style={styles.time}>{format(new Date(item.timestamp), 'dd MMM yyyy, HH:mm:ss')}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Activity Log</Text>

        <TextInput
          style={styles.search}
          value={search}
          onChangeText={setSearch}
          placeholder="Search activities..."
          placeholderTextColor={COLORS.textLight}
        />

        <View style={styles.filterRow}>
          {(['all', ...USERS.map(u => u.id)] as const).map(uid => (
            <View key={uid} style={{ marginRight: 6 }}>
              <Text
                style={[styles.filterChip, filterUser === uid && styles.filterChipActive]}
                onPress={() => setFilterUser(uid)}
              >
                {uid === 'all' ? 'All' : USERS.find(u => u.id === uid)?.name}
              </Text>
            </View>
          ))}
        </View>

        <Text style={styles.count}>{filtered.length} records</Text>

        <FlatList
          data={filtered}
          keyExtractor={i => i.id}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No activity recorded yet</Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  title: { fontSize: 22, fontWeight: '800', color: COLORS.text, marginBottom: 12 },
  search: { backgroundColor: COLORS.white, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, padding: 12, fontSize: 14, color: COLORS.text, marginBottom: 10 },
  filterRow: { flexDirection: 'row', marginBottom: 8 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.white, fontSize: 12, color: COLORS.textLight, overflow: 'hidden' },
  filterChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary, color: COLORS.white, fontWeight: '600' },
  count: { fontSize: 12, color: COLORS.textLight, marginBottom: 8 },
  card: { flexDirection: 'row', backgroundColor: COLORS.white, borderRadius: 12, padding: 12, marginBottom: 8, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  iconBox: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  icon: { fontSize: 18 },
  info: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 },
  user: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  badgeText: { fontSize: 10, fontWeight: '700' },
  details: { fontSize: 12, color: COLORS.textLight, marginBottom: 3 },
  time: { fontSize: 11, color: COLORS.textLight + '99' },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 14, color: COLORS.textLight },
});
