import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Screen from '../components/Screen';
import CartoonButton from '../components/CartoonButton';
import { colors, fonts, cartoonShadow } from '../constants/theme';
import { getChatHistory, ROOM_STATUS_LABELS } from '../services/api';
import { getSession } from '../services/storage';

function formatDate(iso) {
  return new Date(iso).toLocaleString('en-US', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// List screen — dùng lại API GET /ChatRooms/history/{userId} vốn đã có sẵn
// ở backend nhưng chưa từng được mobile gọi tới.
export default function ChatHistoryScreen({ navigation }) {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;

      (async () => {
        setLoading(true);
        try {
          const { userId } = await getSession();
          const data = await getChatHistory(userId);
          if (mounted) setRooms(data || []);
        } catch (error) {
          Alert.alert('Load history failed', error.message || 'Please try again.');
        } finally {
          if (mounted) setLoading(false);
        }
      })();

      return () => {
        mounted = false;
      };
    }, [])
  );

  return (
    <Screen scroll={false}>
      <Text style={styles.title}>Chat History</Text>
      <Text style={styles.subtitle}>Your past anonymous conversations</Text>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={rooms}
          keyExtractor={item => String(item.roomId)}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<Text style={styles.emptyText}>No past conversations yet.</Text>}
          renderItem={({ item }) => (
            <Pressable
              style={styles.card}
              onPress={() => navigation.navigate('ChatRoomDetail', { roomId: item.roomId })}
            >
              <View style={styles.cardTopRow}>
                <Text style={styles.roomCode}>Room #{item.roomId}</Text>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>{ROOM_STATUS_LABELS[item.status] || 'Unknown'}</Text>
                </View>
              </View>
              <Text style={styles.dateText}>Ended: {formatDate(item.updatedAt)}</Text>
              <Text style={styles.viewText}>View details ›</Text>
            </Pressable>
          )}
        />
      )}

      <CartoonButton title="BACK" variant="secondary" onPress={() => navigation.goBack()} style={styles.backButton} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    marginTop: 40,
    color: colors.primary,
    fontSize: 30,
    fontFamily: fonts.black, fontWeight: '900',
  },
  subtitle: {
    color: colors.muted,
    fontFamily: fonts.medium, fontWeight: '600',
    marginBottom: 18,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { paddingBottom: 12, flexGrow: 1 },
  emptyText: {
    textAlign: 'center',
    color: colors.muted,
    marginTop: 40,
    fontFamily: fonts.medium, fontWeight: '500',
  },
  card: {
    ...cartoonShadow,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  roomCode: { fontSize: 15, fontFamily: fonts.bold, fontWeight: '800', color: colors.text },
  statusBadge: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
    backgroundColor: '#F3F4F6',
  },
  statusText: { fontSize: 11, fontFamily: fonts.bold, fontWeight: '700', color: colors.text },
  dateText: { fontSize: 12, color: colors.muted, marginTop: 6, fontFamily: fonts.medium, fontWeight: '500' },
  viewText: { fontSize: 12, color: colors.primary, marginTop: 8, fontFamily: fonts.bold, fontWeight: '700' },
  backButton: { marginTop: 8 },
});
