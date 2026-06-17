import React, { useMemo, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TextInput, TouchableOpacity, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import { useStore } from '../../store/useStore';
import { COLORS, USERS } from '../../constants';
import { ActionType, ActivityLog } from '../../types';
import { responsiveFontSize } from '../../utils/responsive';

const ACTION_COLORS: Record<ActionType, string> = {
  add: COLORS.success, edit: COLORS.warning, delete: COLORS.danger, approve: COLORS.primary, reject: COLORS.danger,
};
const ACTION_ICONS: Record<ActionType, string> = {
  add: '➕', edit: '✏️', delete: '🗑️', approve: '✅', reject: '❌',
};

export default function ActivityScreen() {
  const { activityLogs } = useStore();
  const [search, setSearch] = useState('');
  const [filterUser, setFilterUser] = useState<string>('all');
  const [filterAction, setFilterAction] = useState<ActionType | 'all'>('all');
  const [layout, setLayout] = useState<'card' | 'list'>('card');

  const filtered = useMemo(() =>
    activityLogs
      .filter(l => filterUser === 'all' || l.userId === filterUser)
      .filter(l => filterAction === 'all' || l.action === filterAction)
      .filter(l => !search ||
        l.details.toLowerCase().includes(search.toLowerCase()) ||
        l.userName.toLowerCase().includes(search.toLowerCase())),
    [activityLogs, filterUser, filterAction, search]
  );

  // Action distribution for the mini chart + stat cards
  const counts = useMemo(() => {
    const c: Record<string, number> = { add: 0, edit: 0, delete: 0, approve: 0, reject: 0 };
    activityLogs.forEach(l => { c[l.action] = (c[l.action] ?? 0) + 1; });
    return c;
  }, [activityLogs]);
  const maxCount = Math.max(...Object.values(counts), 1);

  const renderCard = ({ item }: { item: ActivityLog }) => (
    <View style={styles.card}>
      <View style={[styles.iconBox, { backgroundColor: ACTION_COLORS[item.action] + '20' }]}>
        <Text style={styles.icon}>{ACTION_ICONS[item.action]}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.cardTopRow}>
          <Text style={styles.user}>{item.userName}</Text>
          <View style={[styles.badge, { backgroundColor: ACTION_COLORS[item.action] + '20' }]}>
            <Text style={[styles.badgeText, { color: ACTION_COLORS[item.action] }]}>{item.action}</Text>
          </View>
        </View>
        <Text style={styles.details}>{item.details}</Text>
        <Text style={styles.time}>{format(new Date(item.timestamp), 'dd MMM yyyy · hh:mm:ss a')}</Text>
      </View>
    </View>
  );

  const renderRow = ({ item }: { item: ActivityLog }) => (
    <View style={styles.listRow}>
      <Text style={styles.listIcon}>{ACTION_ICONS[item.action]}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.listDetails} numberOfLines={1}>{item.details}</Text>
        <Text style={styles.listMeta}>{item.userName} · {format(new Date(item.timestamp), 'dd MMM, hh:mm a')}</Text>
      </View>
      <View style={[styles.dot, { backgroundColor: ACTION_COLORS[item.action] }]} />
    </View>
  );

  const Header = (
    <View>
      {/* Stat cards */}
      <View style={styles.statsRow}>
        {(['add', 'edit', 'delete'] as ActionType[]).map(a => (
          <View key={a} style={styles.statCard}>
            <Text style={styles.statEmoji}>{ACTION_ICONS[a]}</Text>
            <Text style={[styles.statCount, { color: ACTION_COLORS[a] }]}>{counts[a]}</Text>
            <Text style={styles.statLabel}>{a.charAt(0).toUpperCase() + a.slice(1)}s</Text>
          </View>
        ))}
      </View>

      {/* Action distribution chart */}
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Activity Distribution</Text>
        {(Object.keys(counts) as ActionType[]).map(a => (
          <View key={a} style={styles.barRow}>
            <Text style={styles.barLabel}>{ACTION_ICONS[a]} {a}</Text>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { width: `${(counts[a] / maxCount) * 100}%` as any, backgroundColor: ACTION_COLORS[a] }]} />
            </View>
            <Text style={styles.barCount}>{counts[a]}</Text>
          </View>
        ))}
      </View>

      <TextInput style={styles.search} value={search} onChangeText={setSearch}
        placeholder="Search activity..." placeholderTextColor={COLORS.textLight} />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        {(['all', ...USERS.map(u => u.id)]).map(uid => (
          <TouchableOpacity key={uid} style={[styles.filterChip, filterUser === uid && styles.filterChipActive]} onPress={() => setFilterUser(uid)}>
            <Text style={[styles.filterChipText, filterUser === uid && styles.filterChipTextActive]}>
              {uid === 'all' ? 'All Users' : USERS.find(u => u.id === uid)?.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        {(['all', 'add', 'edit', 'delete', 'approve', 'reject'] as const).map(a => (
          <TouchableOpacity key={a} style={[styles.filterChip, filterAction === a && styles.filterChipActive]} onPress={() => setFilterAction(a)}>
            <Text style={[styles.filterChipText, filterAction === a && styles.filterChipTextActive]}>{a === 'all' ? 'All Actions' : a}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={styles.count}>{filtered.length} records</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topBar}>
        <View>
          <Text style={styles.title}>Activity Log</Text>
          <Text style={styles.subtitle}>Full audit trail</Text>
        </View>
        <View style={styles.layoutToggle}>
          <TouchableOpacity style={[styles.layoutBtn, layout === 'card' && styles.layoutBtnActive]} onPress={() => setLayout('card')}>
            <Text style={[styles.layoutBtnText, layout === 'card' && styles.layoutBtnTextActive]}>▦</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.layoutBtn, layout === 'list' && styles.layoutBtnActive]} onPress={() => setLayout('list')}>
            <Text style={[styles.layoutBtnText, layout === 'list' && styles.layoutBtnTextActive]}>≣</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={i => i.id}
        renderItem={layout === 'card' ? renderCard : renderRow}
        ListHeaderComponent={Header}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<View style={styles.empty}><Text style={{ fontSize: 40 }}>📋</Text><Text style={styles.emptyText}>No activity recorded yet</Text></View>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
  title: { fontSize: responsiveFontSize(24), fontWeight: '800', color: COLORS.text },
  subtitle: { fontSize: responsiveFontSize(12), color: COLORS.textLight, fontWeight: '500', marginTop: 2 },
  layoutToggle: { flexDirection: 'row', backgroundColor: '#E9EDF3', borderRadius: 10, padding: 3 },
  layoutBtn: { width: 38, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  layoutBtnActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 1 },
  layoutBtnText: { fontSize: 18, color: COLORS.textLight },
  layoutBtnTextActive: { color: COLORS.primary },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 14, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  statEmoji: { fontSize: 20, marginBottom: 4 },
  statCount: { fontSize: responsiveFontSize(20), fontWeight: '800' },
  statLabel: { fontSize: responsiveFontSize(11), color: COLORS.textLight, fontWeight: '600', marginTop: 2 },
  chartCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 14, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  chartTitle: { fontSize: responsiveFontSize(14), fontWeight: '700', color: COLORS.text, marginBottom: 12 },
  barRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 9 },
  barLabel: { width: 76, fontSize: responsiveFontSize(11), color: COLORS.textMed, fontWeight: '600', textTransform: 'capitalize' },
  barTrack: { flex: 1, height: 10, backgroundColor: '#F1F5F9', borderRadius: 5, overflow: 'hidden', marginHorizontal: 8 },
  barFill: { height: 10, borderRadius: 5 },
  barCount: { width: 28, fontSize: responsiveFontSize(11), color: COLORS.text, fontWeight: '700', textAlign: 'right' },
  search: { backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontSize: responsiveFontSize(14), color: COLORS.text, marginBottom: 10, borderWidth: 1, borderColor: COLORS.border },
  filterRow: { gap: 8, paddingBottom: 10 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 18, backgroundColor: '#fff', borderWidth: 1, borderColor: COLORS.border },
  filterChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterChipText: { fontSize: responsiveFontSize(12), color: COLORS.textMed, fontWeight: '600', textTransform: 'capitalize' },
  filterChipTextActive: { color: '#fff', fontWeight: '700' },
  count: { fontSize: responsiveFontSize(12), color: COLORS.textLight, marginBottom: 10, fontWeight: '600' },
  card: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  iconBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  icon: { fontSize: 20 },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  user: { fontSize: responsiveFontSize(14), fontWeight: '700', color: COLORS.text },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: { fontSize: responsiveFontSize(10), fontWeight: '700', textTransform: 'capitalize' },
  details: { fontSize: responsiveFontSize(13), color: COLORS.textMed, marginBottom: 4, fontWeight: '500' },
  time: { fontSize: responsiveFontSize(11), color: COLORS.textLight, fontWeight: '500' },
  listRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 6, gap: 10 },
  listIcon: { fontSize: 16 },
  listDetails: { fontSize: responsiveFontSize(13), color: COLORS.text, fontWeight: '600' },
  listMeta: { fontSize: responsiveFontSize(10), color: COLORS.textLight, fontWeight: '500', marginTop: 1 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  empty: { alignItems: 'center', paddingVertical: 50 },
  emptyText: { fontSize: responsiveFontSize(14), color: COLORS.textLight, fontWeight: '600', marginTop: 10 },
});
