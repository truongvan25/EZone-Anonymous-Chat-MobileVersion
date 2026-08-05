import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import Screen from '../components/Screen';
import { colors, fonts, cartoonShadow } from '../constants/theme';
import { logoutRequest } from '../services/api';
import { clearSession } from '../services/storage';

const CARD_RADIUS = 20;

// Trước đây đây là 1 Modal đè lên ProfileScreen. Tách thành 1 screen route
// riêng để tính là "Logout / confirmation screen" theo đúng yêu cầu đề bài.
export default function LogoutConfirmScreen({ navigation }) {
  const [loggingOut, setLoggingOut] = useState(false);

  const handleConfirm = async () => {
    setLoggingOut(true);
    try {
      await logoutRequest();
    } catch {
      // Backend logout lỗi vẫn xóa local session để người dùng thoát app.
    }
    await clearSession();
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  return (
    <Screen scroll={false}>
      <View style={styles.center}>
        <View style={styles.card}>
          <Text style={styles.emoji}>👋</Text>
          <Text style={styles.title}>Log Out?</Text>
          <Text style={styles.description}>
            You'll be signed out of EZone. You can always come back anytime.
          </Text>

          <Pressable
            style={({ pressed }) => [styles.button, styles.confirmButton, pressed && styles.pressed]}
            onPress={handleConfirm}
            disabled={loggingOut}
          >
            {loggingOut ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.confirmText}>Log Out</Text>
            )}
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.button, styles.cancelButton, pressed && styles.pressed]}
            onPress={() => navigation.goBack()}
            disabled={loggingOut}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: {
    ...cartoonShadow,
    width: '100%',
    backgroundColor: colors.card,
    borderRadius: CARD_RADIUS,
    padding: 24,
    alignItems: 'center',
  },
  emoji: { fontSize: 48, marginBottom: 8 },
  title: {
    fontSize: 22,
    fontFamily: fonts.black, fontWeight: '900',
    color: colors.text,
  },
  description: {
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 22,
    lineHeight: 20,
    fontFamily: fonts.medium, fontWeight: '500',
  },
  button: {
    ...cartoonShadow,
    width: '100%',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  confirmButton: { backgroundColor: colors.danger },
  confirmText: { color: '#FFFFFF', fontFamily: fonts.black, fontWeight: '900', fontSize: 15 },
  cancelButton: { backgroundColor: '#FFFFFF', marginBottom: 0 },
  cancelText: { color: colors.text, fontFamily: fonts.bold, fontWeight: '800', fontSize: 15 },
  pressed: {
    transform: [{ translateX: 2 }, { translateY: 2 }],
    shadowOffset: { width: 1, height: 1 },
  },
});
