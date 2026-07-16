import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import CartoonButton from '../components/CartoonButton';
import InfoCard from '../components/InfoCard';
import Screen from '../components/Screen';
import TextInputField from '../components/TextInputField';
import { colors, fonts } from '../constants/theme';
import { createReport } from '../services/api';
import { getSession } from '../services/storage';

const reasons = [
  { label: 'Spam or Ads', value: 'spam' },
  { label: 'Toxic / Rude talk', value: 'offensive' },
  { label: 'Inappropriate behavior', value: 'inappropriate' },
  { label: 'Other', value: 'other' },
];

export default function ReportUserScreen({ navigation, route }) {
  const { roomId } = route.params || {};
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);

  const isValid = reason && (details.length === 0 || details.length >= 10);

  const handleSubmit = async () => {
    if (!isValid) {
      Alert.alert('Invalid report', 'Please choose a reason. Details must be at least 10 characters if entered.');
      return;
    }

    try {
      setLoading(true);
      const session = await getSession();
      const reporterId = route.params?.userId || session.userId;

      await createReport({
        roomId,
        reporterId,
        violatingMessage: details || 'Reported from mobile chat UI',
        reason,
      });

      Alert.alert('Report submitted', 'Thank you for helping keep EZone safe.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert('Report failed', error.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <Text style={styles.title}>Report User</Text>
      <Text style={styles.subtitle}>Help us keep EZone clean.</Text>

      <InfoCard title="What’s breaking the Zone?">
        <View style={styles.reasonWrap}>
          {reasons.map(item => {
            const active = reason === item.value;
            return (
              <Pressable
                key={item.value}
                onPress={() => setReason(item.value)}
                style={[styles.reasonButton, active && styles.reasonActive]}
              >
                <Text style={[styles.reasonText, active && styles.reasonActiveText]}>{item.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <TextInputField
          label="Tell us more... (Optional)"
          value={details}
          onChangeText={setDetails}
          placeholder="Please describe the reason for your report..."
          multiline
          style={styles.details}
        />
        {details.length > 0 && details.length < 10 ? (
          <Text style={styles.error}>Please enter at least 10 characters.</Text>
        ) : null}
      </InfoCard>

      <CartoonButton title="REPORT NOW" variant="danger" onPress={handleSubmit} disabled={!isValid} loading={loading} style={styles.button} />
      <CartoonButton title="CANCEL" variant="secondary" onPress={() => navigation.goBack()} style={styles.button} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    marginTop: 40,
    color: colors.primary,
    fontSize: 34,
    fontFamily: fonts.black, fontWeight: '900',
  },
  subtitle: {
    color: colors.text,
    fontFamily: fonts.bold, fontWeight: '800',
    marginBottom: 22,
  },
  reasonWrap: {
    gap: 10,
    marginBottom: 14,
  },
  reasonButton: {
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
  },
  reasonActive: {
    backgroundColor: colors.primary,
  },
  reasonText: {
    color: colors.text,
    fontFamily: fonts.black, fontWeight: '900',
  },
  reasonActiveText: {
    color: '#fff',
  },
  details: {
    marginTop: 8,
  },
  error: {
    color: colors.danger,
    fontFamily: fonts.bold, fontWeight: '800',
    marginTop: -6,
    marginBottom: 8,
  },
  button: {
    marginTop: 16,
  },
});
