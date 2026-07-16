import React, { useEffect, useRef, useState } from 'react';
import { Alert, Animated, StyleSheet, Text, View } from 'react-native';
import CartoonButton from '../components/CartoonButton';
import InfoCard from '../components/InfoCard';
import Screen from '../components/Screen';
import { cartoonShadow, colors, fonts } from '../constants/theme';
import { createChatConnection } from '../services/chatService';
import { getSession } from '../services/storage';

const MOTIVATIONAL_TEXTS = [
  'A secret match is coming...',
  'Hold your horses...',
  'Finding someone matching your vibe...',
  'Loading your mystery buddy...',
  'Ready, set, chat!',
  'Almost there, stay with us!',
];

export default function WaitingScreen({ navigation, route }) {
  const [userId, setUserId] = useState(route.params?.userId);
  const [waitTime, setWaitTime] = useState(0);
  const [onlineCount, setOnlineCount] = useState(1248);
  const [motivationalText, setMotivationalText] = useState(MOTIVATIONAL_TEXTS[0]);
  const [status, setStatus] = useState('Connecting...');

  const connectionRef = useRef(null);
  const bounce = useRef(new Animated.Value(0)).current;
  // true khi user chủ động rời màn hình này (match thành công hoặc bấm
  // Cancel) -> bỏ qua lỗi 'Invocation canceled' do connection bị stop
  // giữa lúc invoke() đang chờ phản hồi, không phải lỗi thật.
  const leavingRef = useRef(false);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounce, { toValue: -12, duration: 650, useNativeDriver: true }),
        Animated.timing(bounce, { toValue: 0, duration: 650, useNativeDriver: true }),
      ])
    ).start();
  }, [bounce]);

  useEffect(() => {
    const timer = setInterval(() => setWaitTime(prev => prev + 1), 1000);

    const textTimer = setInterval(() => {
      setMotivationalText(MOTIVATIONAL_TEXTS[Math.floor(Math.random() * MOTIVATIONAL_TEXTS.length)]);
      setOnlineCount(prev => Math.max(1, prev + Math.floor(Math.random() * 5) - 2));
    }, 4000);

    return () => {
      clearInterval(timer);
      clearInterval(textTimer);
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const startFinding = async () => {
      const session = await getSession();
      const finalUserId = route.params?.userId || session.userId;

      if (!finalUserId) {
        navigation.replace('Login');
        return;
      }

      if (mounted) setUserId(finalUserId);

      const connection = createChatConnection(finalUserId);
      connectionRef.current = connection;

      connection.on('WaitingForMatch', () => {
        setStatus('Waiting for another student...');
      });

      connection.on('Matched', roomId => {
        leavingRef.current = true;
        setStatus('Matched! Opening chat...');
        navigation.replace('MatchSuccess', { roomId, userId: finalUserId });
      });

      connection.on('MatchError', message => {
        setStatus('Match error');
        Alert.alert('Match error', String(message || 'Room not found'));
      });

      connection.on('ViolationDetected', message => {
        Alert.alert('Account locked', String(message));
        navigation.replace('Login');
      });

      try {
        await connection.start();
        setStatus('Finding match...');
        await connection.invoke('FindMatch');
      } catch (error) {
        // Nếu đã match hoặc user bấm Cancel rồi thì lỗi này chỉ là do
        // connection bị stop() giữa chừng lúc invoke() đang chờ phản hồi,
        // không phải lỗi thật -> bỏ qua (xem leavingRef.current = true ở
        // event 'Matched' và handleCancel).
        if (leavingRef.current) return;

        setStatus('Connection error');
        Alert.alert('SignalR error', error.message || 'Cannot connect to chat hub.');
      }
    };

    startFinding();

    return () => {
      mounted = false;
      connectionRef.current?.stop();
    };
  }, [navigation, route.params?.userId]);

  const handleCancel = async () => {
    leavingRef.current = true;
    await connectionRef.current?.stop();
    navigation.replace('Home');
  };

  return (
    <Screen scroll={false} style={styles.container}>
      <Text style={styles.title}>Chasing a ghost...</Text>
      <Text style={styles.motivation}>{motivationalText}</Text>

      <Animated.View style={[styles.avatar, { transform: [{ translateY: bounce }] }]}>
        <Text style={styles.avatarText}>👻</Text>
      </Animated.View>

      <Text style={styles.status}>{status}</Text>

      <InfoCard style={styles.stats}>
        <View style={styles.statRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>WAITING</Text>
            <Text style={styles.statValue}>{waitTime}s</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>ONLINE</Text>
            <Text style={[styles.statValue, styles.primaryText]}>{onlineCount.toLocaleString()}</Text>
          </View>
        </View>
      </InfoCard>

      <CartoonButton title="CANCEL" variant="secondary" onPress={handleCancel} style={styles.cancel} />
      <Text style={styles.userHint}>User ID: {userId}</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontFamily: fonts.black, fontWeight: '900',
    color: colors.text,
    textAlign: 'center',
  },
  motivation: {
    marginTop: 8,
    color: colors.primary,
    fontSize: 17,
    fontFamily: fonts.black, fontWeight: '900',
    textAlign: 'center',
  },
  avatar: {
    ...cartoonShadow,
    width: 150,
    height: 150,
    borderRadius: 28,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 54,
    marginBottom: 28,
  },
  avatarText: {
    fontSize: 74,
  },
  status: {
    color: colors.muted,
    fontFamily: fonts.black, fontWeight: '900',
    marginBottom: 18,
  },
  stats: {
    width: '100%',
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  divider: {
    width: 2,
    height: 48,
    backgroundColor: colors.border,
  },
  statLabel: {
    color: colors.muted,
    fontSize: 12,
    fontFamily: fonts.black, fontWeight: '900',
  },
  statValue: {
    color: colors.text,
    fontSize: 24,
    fontFamily: fonts.black, fontWeight: '900',
    marginTop: 4,
  },
  primaryText: {
    color: colors.primary,
  },
  cancel: {
    marginTop: 24,
    minWidth: 160,
  },
  userHint: {
    marginTop: 12,
    color: colors.muted,
    fontFamily: fonts.bold, fontWeight: '700',
  },
});
