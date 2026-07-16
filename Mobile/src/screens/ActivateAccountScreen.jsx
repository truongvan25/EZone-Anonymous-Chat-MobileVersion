import React, { useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';
import CartoonButton from '../components/CartoonButton';
import InfoCard from '../components/InfoCard';
import Screen from '../components/Screen';
import TextInputField from '../components/TextInputField';
import { colors, fonts } from '../constants/theme';
import { activateAccount } from '../services/api';

export default function ActivateAccountScreen({ navigation, route }) {
  const [email, setEmail] = useState(route.params?.email || '');
  const [code, setCode] = useState(route.params?.demoCode || '');
  const [loading, setLoading] = useState(false);

  const handleActivate = async () => {
    if (!email.trim() || !code.trim()) {
      Alert.alert('Missing information', 'Please enter email and activation code.');
      return;
    }

    try {
      setLoading(true);
      await activateAccount({ email: email.trim(), code: code.trim() });
      Alert.alert('Activated', 'You can now log in.');
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    } catch (error) {
      Alert.alert('Activation failed', error.message || 'Code is incorrect.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <Text style={styles.title}>ACTIVATE</Text>
      <Text style={styles.subtitle}>Enter your EZone activation code.</Text>

      <InfoCard>
        <TextInputField label="EIU Email" value={email} onChangeText={setEmail} placeholder="example@eiu.edu.vn" keyboardType="email-address" />
        <TextInputField label="Activation Code" value={code} onChangeText={setCode} placeholder="6-digit code" keyboardType="number-pad" />
        <CartoonButton title="ACTIVATE ACCOUNT" onPress={handleActivate} loading={loading} />
      </InfoCard>

      <CartoonButton title="BACK" variant="secondary" onPress={() => navigation.navigate('Login')} style={styles.back} />
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
  back: {
    marginTop: 20,
  },
});
