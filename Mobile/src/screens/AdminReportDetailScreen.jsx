import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import Screen from '../components/Screen';
import InfoCard from '../components/InfoCard';
import CartoonButton from '../components/CartoonButton';
import { colors, fonts, cartoonShadow } from '../constants/theme';
import { updateReportStatus, banReportedUser, unbanReportedUser } from '../services/api';
import { formatDateShort as formatDate } from '../utils/dateUtils';

const STATUS_OPTIONS = ['Pending', 'Resolved'];


// Update item screen — dùng API PUT /ChatReports/{id} mới thêm để admin đổi
// trạng thái xử lý report mà không cần ban user luôn.
export default function AdminReportDetailScreen({ route, navigation }) {
  const { report } = route.params || {};
  const [status, setStatus] = useState(report?.status || 'Pending');
  const [saving, setSaving] = useState(false);
  const [banning, setBanning] = useState(false);
  const isReportedUserBanned = !!report?.isReportedUserBanned;

  if (!report) {
    return (
      <Screen scroll={false}>
        <View style={styles.center}>
          <Text style={styles.errorText}>Missing report data.</Text>
        </View>
      </Screen>
    );
  }

  const dirty = status !== report.status;

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateReportStatus(report.reportId, status);
      navigation.goBack();
    } catch (error) {
      Alert.alert('Update failed', error.message || 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleBan = async () => {
    setBanning(true);
    try {
      await banReportedUser(report.reportId);
      navigation.goBack();
    } catch (error) {
      Alert.alert('Ban failed', error.message || 'Please try again.');
    } finally {
      setBanning(false);
    }
  };

  const handleUnban = async () => {
    setBanning(true);
    try {
      await unbanReportedUser(report.reportId);
      navigation.goBack();
    } catch (error) {
      Alert.alert('Unban failed', error.message || 'Please try again.');
    } finally {
      setBanning(false);
    }
  };

  return (
    <Screen>
      <View style={styles.titleRow}>
        <Text style={styles.title}>Report #{report.reportId}</Text>
        <View style={[styles.typeBadge, report.type === 'Auto' ? styles.typeAuto : styles.typeUser]}>
          <Text style={styles.typeBadgeText}>{report.type === 'Auto' ? 'AUTO' : 'USER'}</Text>
        </View>
      </View>
      <Text style={styles.subtitle}>Room #{report.roomId}</Text>

      <InfoCard title="Reporter → Reported" style={styles.card}>
        <Text style={styles.text}>Reporter: User #{report.reporterId}</Text>
        <Text style={styles.text}>Reported: User #{report.reportedUserId}</Text>
      </InfoCard>

      <InfoCard title="Reason" style={styles.card}>
        <Text style={styles.text}>{report.reason}</Text>
      </InfoCard>

      <InfoCard title="Violating Message" style={styles.card}>
        <Text style={styles.text}>{report.violatingMessage}</Text>
      </InfoCard>

      <InfoCard title="Submitted" style={styles.card}>
        <Text style={styles.text}>{formatDate(report.createdAt)}</Text>
      </InfoCard>

      <InfoCard title="Status" style={styles.card}>
        <View style={styles.chipRow}>
          {STATUS_OPTIONS.map(opt => (
            <Pressable
              key={opt}
              style={[styles.chip, status === opt && styles.chipActive]}
              onPress={() => setStatus(opt)}
            >
              <Text style={[styles.chipText, status === opt && styles.chipTextActive]}>{opt}</Text>
            </Pressable>
          ))}
        </View>
      </InfoCard>

      <Pressable
        style={[styles.actionButton, styles.saveButton, !dirty && styles.disabled]}
        onPress={handleSave}
        disabled={!dirty || saving}
      >
        {saving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.saveText}>Save Status</Text>}
      </Pressable>

      {isReportedUserBanned ? (
        <Pressable style={[styles.actionButton, styles.unbanButton]} onPress={handleUnban} disabled={banning}>
          {banning ? <ActivityIndicator color={colors.text} /> : <Text style={styles.unbanText}>Unban Reported User</Text>}
        </Pressable>
      ) : (
        <Pressable style={[styles.actionButton, styles.banButton]} onPress={handleBan} disabled={banning}>
          {banning ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.banText}>Ban Reported User</Text>}
        </Pressable>
      )}

      <CartoonButton title="BACK" variant="secondary" onPress={() => navigation.goBack()} style={styles.backButton} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: colors.muted, fontFamily: fonts.medium, fontWeight: '600' },
  titleRow: {
    marginTop: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    color: colors.primary,
    fontSize: 26,
    fontFamily: fonts.black, fontWeight: '900',
  },
  typeBadge: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999, borderWidth: 1.5, borderColor: colors.border },
  typeAuto: { backgroundColor: '#E0E7FF' },
  typeUser: { backgroundColor: '#F3F4F6' },
  typeBadgeText: { fontSize: 10, fontFamily: fonts.bold, fontWeight: '800', color: colors.text },
  subtitle: {
    color: colors.muted,
    fontFamily: fonts.medium, fontWeight: '600',
    marginBottom: 18,
  },
  card: { marginBottom: 14 },
  text: {
    color: colors.text,
    fontSize: 14,
    fontFamily: fonts.bold, fontWeight: '700',
    lineHeight: 21,
  },
  chipRow: { flexDirection: 'row', gap: 10 },
  chip: {
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
  },
  chipActive: { backgroundColor: colors.primary },
  chipText: { fontSize: 13, fontFamily: fonts.bold, fontWeight: '700', color: colors.text },
  chipTextActive: { color: '#FFFFFF' },
  actionButton: {
    ...cartoonShadow,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  saveButton: { backgroundColor: colors.primary },
  saveText: { color: '#FFFFFF', fontFamily: fonts.black, fontWeight: '900', fontSize: 14 },
  banButton: { backgroundColor: colors.danger },
  banText: { color: '#FFFFFF', fontFamily: fonts.black, fontWeight: '900', fontSize: 14 },
  unbanButton: { backgroundColor: '#FFFFFF' },
  unbanText: { color: colors.text, fontFamily: fonts.black, fontWeight: '900', fontSize: 14 },
  disabled: { opacity: 0.5 },
  backButton: { marginTop: 4 },
});
