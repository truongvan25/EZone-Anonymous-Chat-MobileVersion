import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import CartoonButton from '../components/CartoonButton';
import MessageBubble from '../components/MessageBubble';
import TypingIndicator from '../components/TypingIndicator';
import IdentityRevealedScreen from '../components/IdentityRevealedScreen';
import { cartoonShadow, colors } from '../constants/theme';
import { createChatConnection } from '../services/chatService';
import { clearSession, getSession } from '../services/storage';
import { requestReveal, getRevealedIdentity } from '../services/revealApi';

function formatTime() {
  return new Date().toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ChatRoomScreen({ navigation, route }) {
  const { roomId } = route.params || {};
  const [userId, setUserId] = useState(route.params?.userId);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [connected, setConnected] = useState(false);
  const [revealedIdentity, setRevealedIdentity] = useState(null);
  const [showIdentityModal, setShowIdentityModal] = useState(false);
  const [revealing, setRevealing] = useState(false);

  const connectionRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const listRef = useRef(null);
  // true khi user chủ động rời màn hình (LEAVE/logout) -> bỏ qua lỗi
  // 'Invocation canceled' do connection bị stop() giữa lúc JoinRoom đang
  // chờ phản hồi, không phải lỗi thật.
  const leavingRef = useRef(false);

  useEffect(() => {
    let mounted = true;

    const setupChat = async () => {
      const session = await getSession();
      const finalUserId = route.params?.userId || session.userId;

      if (!roomId) {
        navigation.replace('Waiting', { userId: finalUserId });
        return;
      }

      if (!finalUserId) {
        navigation.replace('Login');
        return;
      }

      if (mounted) setUserId(finalUserId);

      const connection = createChatConnection(finalUserId);
      connectionRef.current = connection;

      connection.on('ReceiveMessage', data => {
        const senderId = Number(data.senderId ?? data.SenderId);
        const text = data.message ?? data.Message ?? data.content ?? data.Content;

        setMessages(prev => [
          ...prev,
          {
            id: `${Date.now()}-${Math.random()}`,
            text,
            isOwn: senderId === Number(finalUserId),
            timestamp: formatTime(),
          },
        ]);
      });

      connection.on('UserTyping', () => {
        setIsTyping(true);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 1500);
      });

      connection.on('PartnerDisconnected', () => {
        Alert.alert('Partner left', "Aww, they left. Let's find another match!", [
          { text: 'Find new', onPress: () => navigation.replace('Waiting', { userId: finalUserId }) },
        ]);
      });

      connection.on('ViolationDetected', async message => {
        Alert.alert('Violation detected', String(message));
        await clearSession();
        navigation.replace('Login');
      });

      try {
        await connection.start();
        await connection.invoke('JoinRoom', Number(roomId));
        setConnected(true);
      } catch (error) {
        if (leavingRef.current) return;
        Alert.alert('Chat error', error.message || 'Cannot connect to chat room.');
      }
    };

    setupChat();

    return () => {
      mounted = false;
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      connectionRef.current?.stop();
    };
  }, [navigation, roomId, route.params?.userId]);

  useEffect(() => {
    setTimeout(() => listRef.current?.scrollToEnd?.({ animated: true }), 100);
  }, [messages, isTyping]);

  const handleChangeText = text => {
    setInputValue(text);
    if (connectionRef.current && connected) {
      connectionRef.current.invoke('Typing').catch(() => {});
    }
  };

  const handleSend = async () => {
    const message = inputValue.trim();
    if (!message) return;

    setInputValue('');

    try {
      await connectionRef.current.invoke('SendMessage', message);
    } catch (error) {
      Alert.alert('Send failed', error.message || 'Cannot send message.');
    }
  };

  const handleRequestReveal = async () => {
    setRevealing(true);
    try {
      const room = await requestReveal(roomId, userId);

      if (room.isRevealed) {
        const identity = await getRevealedIdentity(roomId, userId);
        setRevealedIdentity(identity);
        setShowIdentityModal(true);
      } else {
        Alert.alert('Reveal requested', "You showed yours, now it's their turn!");
      }
    } catch (error) {
      Alert.alert('Reveal failed', error.message || 'Too soon to unmask!');
    } finally {
      setRevealing(false);
    }
  };

  const handleLeave = async () => {
    leavingRef.current = true;
    try {
      await connectionRef.current?.invoke('LeaveRoom');
      await connectionRef.current?.stop();
    } catch {}
    navigation.replace('Waiting', { userId });
  };

  const handleLogout = async () => {
    leavingRef.current = true;
    await connectionRef.current?.stop();
    await clearSession();
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>EZone Chat</Text>
          <Text style={styles.subtitle}>Room #{roomId} • {connected ? 'Online' : 'Connecting...'}</Text>
        </View>
        <Pressable onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Out</Text>
        </Pressable>
      </View>

      <FlatList
        ref={listRef}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <MessageBubble message={item.text} isOwn={item.isOwn} timestamp={item.timestamp} />
        )}
        ListFooterComponent={<TypingIndicator visible={isTyping} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>💬</Text>
            <Text style={styles.emptyText}>Say hi to your mystery buddy!</Text>
          </View>
        }
      />

      <View style={styles.actions}>
        <CartoonButton title="REVEAL" onPress={handleRequestReveal} loading={revealing} style={styles.actionButton} />
        <CartoonButton title="REPORT" variant="danger" onPress={() => navigation.navigate('ReportUser', { roomId, userId })} style={styles.actionButton} />
        <CartoonButton title="LEAVE" variant="secondary" onPress={handleLeave} style={styles.actionButton} />
      </View>

      <View style={styles.inputRow}>
        <TextInput
          value={inputValue}
          onChangeText={handleChangeText}
          placeholder="Chat here..."
          placeholderTextColor="#999"
          style={styles.input}
          multiline
        />
        <Pressable onPress={handleSend} disabled={!inputValue.trim()} style={[styles.sendButton, !inputValue.trim() && styles.sendDisabled]}>
          <Text style={styles.sendText}>➤</Text>
        </Pressable>
      </View>

      <IdentityRevealedScreen
        visible={showIdentityModal}
        onClose={() => setShowIdentityModal(false)}
        identity={revealedIdentity}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    ...cartoonShadow,
    backgroundColor: colors.primary,
    paddingTop: Platform.OS === 'android' ? 28 : 10,
    paddingHorizontal: 18,
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '900',
  },
  subtitle: {
    color: '#ffe3eb',
    fontWeight: '800',
    marginTop: 3,
  },
  logoutButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  logoutText: {
    color: colors.primary,
    fontWeight: '900',
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 24,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyIcon: {
    fontSize: 54,
  },
  emptyText: {
    color: colors.muted,
    fontWeight: '800',
    marginTop: 10,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 14,
    paddingBottom: 10,
  },
  actionButton: {
    flex: 1,
    minHeight: 46,
  },
  inputRow: {
    ...cartoonShadow,
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: colors.card,
    padding: 10,
    margin: 14,
    borderRadius: 16,
  },
  input: {
    flex: 1,
    maxHeight: 110,
    minHeight: 42,
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    paddingHorizontal: 8,
  },
  sendButton: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  sendDisabled: {
    opacity: 0.4,
  },
  sendText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '900',
  },
});
