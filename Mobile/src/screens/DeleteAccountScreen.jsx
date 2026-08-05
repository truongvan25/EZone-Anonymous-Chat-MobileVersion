import React, { useState } from 'react';
import { Text, TextInput, Pressable, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import Screen from '../components/Screen';
import InfoCard from '../components/InfoCard';
import CartoonButton from '../components/CartoonButton';
import { colors, fonts, cartoonShadow } from '../constants/theme';
import { deleteAccount } from '../services/api';
import { clearSession, getSession } from '../services/storage';

// Confirm + bắt nhập lại mật khẩu trước khi xóa tài khoản.
// Lưu ý: backend làm SOFT delete (đánh dấu IsDeleted, không xóa data) để không
// ảnh hưởng tới lịch sử chat/report của những người từng tương tác với mình.
export default function DeleteAccountScreen({ navigation }) {
  const [password, setPassword] = useState('');
  const [deleting, setDeleting] = useState(false);

  const runDelete = async () => {
    setDeleting(true);
    try {
      const { userId } = await getSession();
      await deleteAccount(userId, password);
      await clearSession();
      Alert.alert('Account deleted', 'Your EZone account has been deactivated.');
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    } catch (error) {
      Alert.alert('Delete failed', error.message || 'Incorrect password or please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeletePress = () => {
    if (!password.trim()) {
      Alert.alert('Password required', 'Please enter your password to confirm.');
      return;
    }

    Alert.alert(
      'Delete your account?',
      "You won't be able to log in anymore and your profile will disappear from EZone. This can't be undone by yourself.",
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete Account', style: 'destructive', onPress: runDelete },
      ]
    );
  };

  return (
    <Screen>
      <Text style={styles.title}>Delete Account</Text>
      <Text style={styles.subtitle}>You won't be able to undo this yourself</Text>

      <InfoCard title="What happens" style={styles.card}>
        <Text style={styles.text}>• You'll be logged out and can no longer sign in</Text>
        <Text style={styles.text}>• Your profile disappears from EZone</Text>
        <Text style={styles.text}>
          • Chats/reports shared with other students stay in their history (we don't erase other
          people's records)
        </Text>
      </InfoCard>

      <InfoCard title="Confirm your password" style={styles.card}>
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Enter your password"
          placeholderTextColor="#9CA3AF"
          secureTextEntry
          style={styles.input}
        />
      </InfoCard>

      <Pressable
        style={[styles.deleteButton, (!password.trim() || deleting) && styles.disabled]}
        onPress={handleDeletePress}
        disabled={!password.trim() || deleting}
      >
        {deleting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.deleteText}>DELETE MY ACCOUNT</Text>}
      </Pressable>

      <CartoonButton title="CANCEL" variant="secondary" onPress={() => navigation.goBack()} style={styles.cancelButton} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    marginTop: 40,
    color: colors.danger,
    fontSize: 30,
    fontFamily: fonts.black, fontWeight: '900',
  },
  subtitle: {
    color: colors.muted,
    fontFamily: fonts.bold, fontWeight: '700',
    marginBottom: 22,
  },
  card: { marginBottom: 16 },
  text: {
    color: colors.text,
    fontSize: 14,
    fontFamily: fonts.bold, fontWeight: '700',
    lineHeight: 22,
  },
  input: {
    fontSize: 15,
    color: colors.text,
    fontFamily: fonts.medium, fontWeight: '600',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#F9FAFB',
  },
  deleteButton: {
    ...cartoonShadow,
    backgroundColor: colors.danger,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  deleteText: { color: '#FFFFFF', fontFamily: fonts.black, fontWeight: '900', fontSize: 14, letterSpacing: 0.5 },
  disabled: { opacity: 0.5 },
  cancelButton: { marginTop: 0 },
});
