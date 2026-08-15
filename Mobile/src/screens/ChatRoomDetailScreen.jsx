import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import Screen from '../components/Screen';
import InfoCard from '../components/InfoCard';
import CartoonButton from '../components/CartoonButton';
import { colors, fonts } from '../constants/theme';
import { getChatRoomDetail, ROOM_STATUS_LABELS } from '../services/api';
import { formatDateShort as formatDate } from '../utils/dateUtils';

// Detail screen — dùng lại API GET /ChatRooms/{roomId} vốn đã có sẵn ở backend
// nhưng chưa từng được mobile gọi tới.
export default function ChatRoomDetailScreen({ route, navigation }) {
  const { roomId } = route.params || {};
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const data = await getChatRoomDetail(roomId);
        if (mounted) setRoom(data);
      } catch (error) {
        Alert.alert('Load room failed', error.message || 'Please try again.');
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [roomId]);

  if (loading) {
    return (
      <Screen scroll={false}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </Screen>
    );
  }

  if (!room) {
    return (
      <Screen scroll={false}>
        <View style={styles.center}>
          <Text style={styles.errorText}>Could not load this conversation.</Text>
          <CartoonButton title="BACK" variant="secondary" onPress={() => navigation.goBack()} style={styles.backButton} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <Text style={styles.title}>Conversation #{room.roomId}</Text>
      <Text style={styles.subtitle}>Details of this anonymous chat</Text>

      <InfoCard title="Status" style={styles.card}>
        <Text style={styles.text}>{ROOM_STATUS_LABELS[room.status] || 'Unknown'}</Text>
      </InfoCard>

      <InfoCard title="Timeline" style={styles.card}>
        <Text style={styles.text}>Started: {formatDate(room.createdAt)}</Text>
        <Text style={styles.text}>Ended: {formatDate(room.updatedAt)}</Text>
      </InfoCard>

      <InfoCard title="Match Info" style={styles.card}>
        <Text style={styles.text}>Affinity Score: {room.affinityScore ?? 0}</Text>
        <Text style={styles.text}>Identity Revealed: {room.isRevealed ? 'Yes' : 'No'}</Text>
      </InfoCard>

      <CartoonButton title="BACK" variant="secondary" onPress={() => navigation.goBack()} style={styles.backButton} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: {
    color: colors.muted,
    fontFamily: fonts.medium, fontWeight: '600',
    marginBottom: 16,
  },
  title: {
    marginTop: 40,
    color: colors.primary,
    fontSize: 28,
    fontFamily: fonts.black, fontWeight: '900',
  },
  subtitle: {
    color: colors.muted,
    fontFamily: fonts.medium, fontWeight: '600',
    marginBottom: 18,
  },
  card: { marginBottom: 14 },
  text: {
    color: colors.text,
    fontSize: 15,
    fontFamily: fonts.bold, fontWeight: '700',
    lineHeight: 22,
  },
  backButton: { marginTop: 8 },
});
