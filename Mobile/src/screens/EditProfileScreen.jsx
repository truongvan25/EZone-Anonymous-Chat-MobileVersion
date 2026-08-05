import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { fonts } from '../constants/theme';
import { updateProfile } from '../services/api';

const COLORS = {
  border: '#111111',
  cardBg: '#FFFFFF',
  shadow: '#111111',
  primary: '#ED2553',
  textPrimary: '#111111',
  textMuted: '#6B7280',
  background: '#F7F5F5',
  fieldBg: '#F9FAFB',
};

const SHADOW_OFFSET = 5;
const CARD_RADIUS = 18;

// Tách ra từ ProfileScreen để có 1 màn hình "Edit Profile" riêng biệt
// (đúng như yêu cầu đề bài, thay vì sửa tại chỗ trên màn hình xem profile).
export default function EditProfileScreen({ navigation, route }) {
  const profile = route.params?.profile;
  const [draft, setDraft] = useState({
    fullname: profile?.fullname || '',
    majorCode: profile?.majorCode || '',
    gender: profile?.gender || '',
    socialLink: profile?.socialLink || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile(profile.userId, draft);
      navigation.goBack();
    } catch (error) {
      Alert.alert('Update failed', error.message || 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!profile) {
    return (
      <SafeAreaView style={[styles.safeArea, styles.center]}>
        <Text style={styles.errorText}>Missing profile data.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <Text style={styles.headerSubtitle}>Update how others see you</Text>
        </View>

        <View style={styles.cardWrapper}>
          <View style={styles.shadowLayer} />
          <View style={styles.card}>
            <Field label="Full Name" value={draft.fullname} onChangeText={t => setDraft(d => ({ ...d, fullname: t }))} />
            <Field label="Major" value={draft.majorCode} onChangeText={t => setDraft(d => ({ ...d, majorCode: t }))} />
            <Field label="Gender" value={draft.gender} onChangeText={t => setDraft(d => ({ ...d, gender: t }))} />
            <Field
              label="Email"
              value={profile.email}
              editable={false}
              helperText="Email không thể thay đổi"
            />
            <Field
              label="Social Link"
              value={draft.socialLink}
              onChangeText={t => setDraft(d => ({ ...d, socialLink: t }))}
              isLast
            />
          </View>
        </View>

        <View style={styles.buttonRow}>
          <Pressable style={[styles.actionButton, styles.cancelButton]} onPress={() => navigation.goBack()} disabled={saving}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </Pressable>
          <Pressable style={[styles.actionButton, styles.saveButton]} onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={styles.saveButtonText}>Save changes</Text>}
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const Field = ({ label, value, onChangeText, editable = true, helperText, isLast }) => (
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
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  center: { justifyContent: 'center', alignItems: 'center' },
  errorText: { color: COLORS.textMuted, fontFamily: fonts.medium, fontWeight: '600' },
  scrollContent: { padding: 20, paddingBottom: 40 },
  header: { marginTop: 50, marginBottom: 20, alignItems: 'center' },
  headerTitle: { fontSize: 24, fontFamily: fonts.bold, fontWeight: '800', color: COLORS.textPrimary, includeFontPadding: false },
  headerSubtitle: { fontSize: 13, color: COLORS.textMuted, marginTop: 2, fontFamily: fonts.medium, fontWeight: '500' },
  cardWrapper: { marginBottom: 20 },
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
  field: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#EEEEEE' },
  fieldLast: { borderBottomWidth: 0 },
  fieldLabel: {
    fontSize: 12,
    fontFamily: fonts.bold, fontWeight: '700',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  fieldValue: { fontSize: 15, color: COLORS.textPrimary, fontFamily: fonts.medium, fontWeight: '600', includeFontPadding: false },
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
  fieldHelper: { fontSize: 11, color: COLORS.textMuted, marginTop: 4 },
  buttonRow: { flexDirection: 'row', gap: 10 },
  actionButton: {
    flex: 1,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: { backgroundColor: '#F3F4F6' },
  cancelButtonText: { color: COLORS.textPrimary, fontFamily: fonts.bold, fontWeight: '700', fontSize: 14 },
  saveButton: { backgroundColor: COLORS.primary },
  saveButtonText: { color: '#FFFFFF', fontFamily: fonts.bold, fontWeight: '800', fontSize: 14 },
});
