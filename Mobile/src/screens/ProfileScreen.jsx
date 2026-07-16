import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  Image,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { fonts } from '../constants/theme';
import CartoonButton from '../components/CartoonButton';
import { launchImageLibrary } from 'react-native-image-picker';
import LogoutConfirmationDialog from '../components/LogoutConfirmationDialog';
import { getMyProfile, updateProfile, logoutRequest } from '../services/api';
import { clearSession } from '../services/storage';
import { BASE_URL } from '../constants/config';

const COLORS = {
  border: '#111111',
  cardBg: '#FFFFFF',
  shadow: '#111111',
  primary: '#ED2553',
  textPrimary: '#111111',
  textMuted: '#6B7280',
  background: '#F7F5F5',
  fieldBg: '#F9FAFB',
  danger: '#B91C1C',
};

const SHADOW_OFFSET = 5;
const CARD_RADIUS = 18;
const AVATAR_SIZE = 104;

const ProfileScreen = ({ navigation }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);

  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const data = await getMyProfile();
        if (mounted) setProfile(data);
      } catch (error) {
        Alert.alert('Load profile failed', error.message || 'Please try again.');
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const handleStartEdit = () => {
    setDraft(profile);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await updateProfile(profile.userId, draft);
      setProfile(draft);
      setIsEditing(false);
    } catch (error) {
      Alert.alert('Update failed', error.message || 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePhoto = () => {
  launchImageLibrary({ mediaType: 'photo', quality: 0.8, selectionLimit: 1 }, async response => {
    if (response.didCancel || response.errorCode) return;

    const asset = response.assets?.[0];
    if (!asset) return;

    setUploadingAvatar(true);
    try {
      await updateProfile(profile.userId, { ...profile, avatarFile: asset });
      const data = await getMyProfile();
      setProfile(data);
    } catch (error) {
      Alert.alert('Upload failed', error.message || 'Please try again.');
    } finally {
      setUploadingAvatar(false);
    }
  });
};


  const handleConfirmLogout = async () => {
    setLoggingOut(true);
    try {
      await logoutRequest();
    } catch {
      // Backend logout lỗi vẫn xóa local session để người dùng thoát app.
    }
    await clearSession();
    setLoggingOut(false);
    setShowLogoutDialog(false);
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, styles.center]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={[styles.safeArea, styles.center]}>
        <Text style={styles.errorText}>Could not load profile.</Text>
      </SafeAreaView>
    );
  }

  const shown = isEditing ? draft : profile;
  const avatarUri = shown.avatarUrl ? `${BASE_URL}${shown.avatarUrl}` : null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* ---- Header ---- */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Profile</Text>
          <Text style={styles.headerSubtitle}>Your EZone identity</Text>
        </View>

        
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrapper}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarEmoji}>👤</Text>
              </View>
            )}
          </View>
          <Pressable onPress={handleChangePhoto} disabled={uploadingAvatar} style={styles.changeAvatarButton}>
            {uploadingAvatar ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <Text style={styles.changeAvatarText}>Change Photo</Text>
            )}
          </Pressable>
        </View>

        {/* ---- Info card ---- */}
        <View style={styles.cardWrapper}>
          <View style={styles.shadowLayer} />

          <View style={styles.card}>
            <ProfileField
              label="Full Name"
              value={shown.fullname}
              editable={isEditing}
              onChangeText={text => setDraft(d => ({ ...d, fullname: text }))}
            />

            <ProfileField
              label="Major"
              value={shown.majorCode}
              editable={isEditing}
              onChangeText={text => setDraft(d => ({ ...d, majorCode: text }))}
            />

            <ProfileField
              label="Gender"
              value={shown.gender}
              editable={isEditing}
              onChangeText={text => setDraft(d => ({ ...d, gender: text }))}
            />

            <ProfileField label="Email" value={shown.email} editable={false} helperText="Email không thể thay đổi" />

            <ProfileField
              label="Social Link"
              value={shown.socialLink}
              editable={isEditing}
              onChangeText={text => setDraft(d => ({ ...d, socialLink: text }))}
              isLast
            />
          </View>
        </View>

        {/* ---- Buttons ---- */}
        {isEditing ? (
          <View style={styles.editButtonRow}>
            <Pressable style={[styles.actionButton, styles.cancelButton]} onPress={handleCancelEdit} disabled={saving}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
            <Pressable style={[styles.actionButton, styles.saveButton]} onPress={handleSaveProfile} disabled={saving}>
              {saving ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={styles.saveButtonText}>Save changes</Text>}
            </Pressable>
          </View>
        ) : (
          <Pressable style={[styles.actionButton, styles.editButton]} onPress={handleStartEdit}>
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </Pressable>
        )}

        <Pressable style={[styles.actionButton, styles.logoutButton]} onPress={() => setShowLogoutDialog(true)}>
          <Text style={styles.logoutButtonText}>Log Out</Text>
        </Pressable>

        <CartoonButton title="BACK" variant="secondary" onPress={() => navigation.goBack()} />
      </ScrollView>

      <LogoutConfirmationDialog
        visible={showLogoutDialog}
        onCancel={() => setShowLogoutDialog(false)}
        onConfirm={handleConfirmLogout}
        loading={loggingOut}
      />
    </SafeAreaView>
  );
};

const ProfileField = ({ label, value, editable, onChangeText, helperText, isLast }) => (
  <View style={[styles.field, isLast && styles.fieldLast]}>
    <Text style={styles.fieldLabel}>{label}</Text>
    {editable ? (
      <TextInput
        value={value}
        onChangeText={onChangeText}
        style={styles.fieldInput}
        placeholderTextColor="#9CA3AF"
      />
    ) : (
      <Text style={styles.fieldValue}>{value || 'N/A'}</Text>
    )}
    {helperText ? <Text style={styles.fieldHelper}>{helperText}</Text> : null}
  </View>
);

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: COLORS.textMuted,
    fontFamily: fonts.medium, fontWeight: '600',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginTop: 20,
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    marginTop: 50,
    fontSize: 24,
    fontFamily: fonts.bold, fontWeight: '800',
    color: COLORS.textPrimary,
    includeFontPadding: false,
  },
  headerSubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
    fontFamily: fonts.medium, fontWeight: '500',
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarWrapper: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 3,
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
    backgroundColor: '#D879C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 44,
  },
  cardWrapper: {
    marginBottom: 20,
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
    paddingHorizontal: 18,
    paddingTop: 6,
  },
  field: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  fieldLast: {
    borderBottomWidth: 0,
  },
  fieldLabel: {
    fontSize: 12,
    fontFamily: fonts.bold, fontWeight: '700',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  fieldValue: {
    fontSize: 15,
    color: COLORS.textPrimary,
    fontFamily: fonts.medium, fontWeight: '600',
    includeFontPadding: false,
  },
  fieldInput: {
    fontSize: 15,
    color: COLORS.textPrimary,
    fontFamily: fonts.medium, fontWeight: '600',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: COLORS.fieldBg,
    includeFontPadding: false,
  },
  fieldHelper: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  actionButton: {
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  editButton: {
    backgroundColor: COLORS.primary,
  },
  editButtonText: {
    color: '#FFFFFF',
    fontFamily: fonts.bold, fontWeight: '800',
    fontSize: 14,
  },
  editButtonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  cancelButtonText: {
    color: COLORS.textPrimary,
    fontFamily: fonts.bold, fontWeight: '700',
    fontSize: 14,
  },
  saveButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontFamily: fonts.bold, fontWeight: '800',
    fontSize: 14,
  },
  logoutButton: {
    backgroundColor: '#FFFFFF',
  },
  logoutButtonText: {
    color: COLORS.danger,
    fontFamily: fonts.bold, fontWeight: '800',
    fontSize: 14,
  },
  changeAvatarButton: {
  marginTop: 10,
  },
  changeAvatarText: {
    color: COLORS.primary,
    fontFamily: fonts.bold, fontWeight: '700',
    fontSize: 13,
  },
});

export default ProfileScreen;