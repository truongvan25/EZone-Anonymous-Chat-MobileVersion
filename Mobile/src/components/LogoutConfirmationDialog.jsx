import React from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';

const COLORS = {
  border: '#111111',
  cardBg: '#FFFFFF',
  shadow: '#111111',
  textPrimary: '#111111',
  textMuted: '#6B7280',
  overlay: 'rgba(0,0,0,0.55)',
  cancelBg: '#F3F4F6',
  cancelText: '#111111',
  confirmBg: '#ED2553', // đồng bộ màu primary/maroon của toàn app
  confirmText: '#FFFFFF',
};

const SHADOW_OFFSET = 6;
const CARD_RADIUS = 20;

const LogoutConfirmationDialog = ({
  visible,
  onCancel,
  onConfirm,
  loading = false,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={loading ? undefined : onCancel}
        />

        <View style={styles.cardWrapper}>
          <View style={styles.shadowLayer} />

          <View style={styles.card}>
            <Text style={styles.title}>Log Out?</Text>
            <Text style={styles.description}>
              You'll be signed out of EZone. You can always come back anytime.
            </Text>

            <View style={styles.buttonRow}>
              <Pressable
                onPress={onCancel}
                disabled={loading}
                style={({ pressed }) => [
                  styles.button,
                  styles.cancelButton,
                  { opacity: pressed ? 0.75 : 1 },
                ]}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>

              <Pressable
                onPress={onConfirm}
                disabled={loading}
                style={({ pressed }) => [
                  styles.button,
                  styles.confirmButton,
                  { opacity: loading ? 0.7 : pressed ? 0.85 : 1 },
                ]}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={COLORS.confirmText} />
                ) : (
                  <Text style={styles.confirmButtonText}>Log Out</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  cardWrapper: {
    width: '100%',
    maxWidth: 380,
  },
  shadowLayer: {
    position: 'absolute',
    top: SHADOW_OFFSET,
    left: SHADOW_OFFSET,
    right: -SHADOW_OFFSET,
    bottom: -SHADOW_OFFSET,
    backgroundColor: COLORS.shadow,
    borderRadius: CARD_RADIUS,
  },
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: CARD_RADIUS,
    borderWidth: 2.5,
    borderColor: COLORS.border,
    paddingTop: 26,
    paddingBottom: 22,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 19,
    fontWeight: '800',
    color: COLORS.textPrimary,
    includeFontPadding: false,
  },
  description: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 8,
    lineHeight: 20,
    fontWeight: '500',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 22,
  },
  button: {
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 11,
    minWidth: 84,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: COLORS.cancelBg,
  },
  cancelButtonText: {
    color: COLORS.cancelText,
    fontWeight: '700',
    fontSize: 13,
  },
  confirmButton: {
    backgroundColor: COLORS.confirmBg,
  },
  confirmButtonText: {
    color: COLORS.confirmText,
    fontWeight: '700',
    fontSize: 13,
  },
});

export default LogoutConfirmationDialog;
