import React from 'react';
import {
  Modal,
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  Linking,
  Platform,
} from 'react-native';
import { fonts } from '../constants/theme';
import { BASE_URL } from '../constants/config';

const COLORS = {
  border: '#111111',
  cardBg: '#FFFFFF',
  shadow: '#111111',
  textPrimary: '#111111',
  textMuted: '#6B7280',
  link: '#E0447A', 
  overlay: 'rgba(0,0,0,0.55)',
};

const SHADOW_OFFSET = 6; 
const AVATAR_SIZE = 96;
const CARD_RADIUS = 20;


const IdentityRevealedScreen = ({
  visible,
  onClose,
  identity,
  apiBaseUrl = BASE_URL,
}) => {
  const avatarSource =
    identity?.avatarUrl && identity.avatarUrl.length > 0
      ? { uri: `${apiBaseUrl}${identity.avatarUrl}` }
      : null;

  const handleOpenSocialLink = () => {
    if (identity?.socialLink) {
      Linking.openURL(identity.socialLink).catch(() => {});
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <View style={styles.cardWrapper}>
          <View style={styles.shadowLayer} />

          <View style={styles.card}>
            <Pressable
              onPress={onClose}
              hitSlop={10}
              style={styles.closeButton}
              accessibilityRole="button"
              accessibilityLabel="Đóng"
            >
              <Text style={styles.closeIcon}>✕</Text>
            </Pressable>

            <Text style={styles.title}>Identity Unlocked!</Text>
            <Text style={styles.subtitle}>Identity reveal accepted!</Text>

            {identity ? (
              <View style={styles.identityBlock}>
                <View style={styles.avatarWrapper}>
                  {avatarSource ? (
                    <Image source={avatarSource} style={styles.avatarImage} />
                  ) : (
                    <View style={styles.avatarFallback}>
                      <Text style={styles.avatarEmoji}>👤</Text>
                    </View>
                  )}
                </View>

                <View style={styles.infoBlock}>
                  <Text style={styles.name}>{identity.fullname}</Text>

                  <Text style={styles.metaText}>
                    Major: {identity.majorCode || 'N/A'}
                  </Text>
                  <Text style={styles.metaText}>
                    Gender: {identity.gender || 'N/A'}
                  </Text>

                  {!!identity.socialLink && (
                    <Pressable onPress={handleOpenSocialLink} hitSlop={6}>
                      <Text style={styles.socialLink} numberOfLines={1}>
                        {identity.socialLink}
                      </Text>
                    </Pressable>
                  )}
                </View>
              </View>
            ) : (
              <Text style={styles.pendingText}>Pending identity reveal...</Text>
            )}
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
    maxWidth: 400,
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
    paddingTop: 28,
    paddingBottom: 32,
    paddingHorizontal: 24,
    elevation: Platform.OS === 'android' ? 2 : 0,
  },
  closeButton: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  title: {
    fontSize: 20,
    fontFamily: fonts.bold, fontWeight: '800',
    color: COLORS.textPrimary,
    includeFontPadding: false,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 4,
    fontFamily: fonts.medium, fontWeight: '500',
  },
  identityBlock: {
    alignItems: 'center',
    marginTop: 24,
  },
  avatarWrapper: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 2.5,
    borderColor: COLORS.border,
    overflow: 'hidden', 
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D879C7',
  },
  avatarEmoji: {
    fontSize: 40,
  },
  closeIcon: {
    fontSize: 15,
    fontFamily: fonts.bold, fontWeight: '700',
    color: COLORS.border,
    includeFontPadding: false,
  },
  infoBlock: {
    alignItems: 'center',
    marginTop: 14,
  },
  name: {
    fontSize: 18,
    fontFamily: fonts.bold, fontWeight: '700',
    color: COLORS.textPrimary,
    includeFontPadding: false,
  },
  metaText: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontFamily: fonts.medium, fontWeight: '500',
    marginTop: 4,
  },
  socialLink: {
    fontSize: 13,
    fontFamily: fonts.bold, fontWeight: '700',
    color: COLORS.link,
    marginTop: 10,
    maxWidth: 260,
  },
  pendingText: {
    textAlign: 'center',
    fontFamily: fonts.medium, fontWeight: '500',
    color: COLORS.textPrimary,
    marginTop: 32,
    marginBottom: 8,
  },
});

export default IdentityRevealedScreen;

