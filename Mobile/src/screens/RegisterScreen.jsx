import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import CartoonButton from '../components/CartoonButton';
import InfoCard from '../components/InfoCard';
import Screen from '../components/Screen';
import TextInputField from '../components/TextInputField';
import { colors, fonts } from '../constants/theme';
import { registerUser } from '../services/api';

export default function RegisterScreen({ navigation }) {
  const [fullname, setFullname] = useState('');
  const [email, setEmail] = useState('');
  const [majorCode, setMajorCode] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!fullname || !email || !majorCode || !password) {
      Alert.alert('Missing information', 'Please fill in all fields.');
      return;
    }

    try {
      setLoading(true);
      const result = await registerUser({ fullname, email, majorCode, password });

      Alert.alert(
        'Registration successful',
        result?.activationCode
          ? `Demo activation code: ${result.activationCode}`
          : 'Please activate your account.'
      );

      navigation.navigate('ActivateAccount', { email, demoCode: result?.activationCode });
    } catch (error) {
      Alert.alert('Register failed', error.message || 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>CREATE ACCOUNT</Text>
        <Text style={styles.subtitle}>EIU students only.</Text>
      </View>

      <InfoCard>
        <TextInputField label="Full name" value={fullname} onChangeText={setFullname} placeholder="Nguyen Van A" autoCapitalize="words" />
        <TextInputField label="EIU Email" value={email} onChangeText={setEmail} placeholder="example@eiu.edu.vn" keyboardType="email-address" />
        <TextInputField label="Major Code" value={majorCode} onChangeText={setMajorCode} placeholder="SE, BA, CE..." autoCapitalize="characters" />
        <TextInputField label="Password" value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry />
        <CartoonButton title="REGISTER" onPress={handleRegister} loading={loading} />
      </InfoCard>

      <CartoonButton title="BACK" variant="secondary" onPress={() => navigation.goBack()} style={styles.back} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    marginTop: 20,
    marginBottom: 20,
  },
  title: {
    color: colors.primary,
    fontSize: 30,
    fontFamily: fonts.black, fontWeight: '900',
  },
  subtitle: {
    color: colors.text,
    fontFamily: fonts.bold, fontWeight: '800',
    marginTop: 4,
  },
  back: {
    marginTop: 20,
  },
});
