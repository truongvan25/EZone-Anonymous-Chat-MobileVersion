import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import CartoonButton from '../components/CartoonButton';
import InfoCard from '../components/InfoCard';
import Screen from '../components/Screen';
import TextInputField from '../components/TextInputField';
import { colors, fonts } from '../constants/theme';
import { login } from '../services/api';
import { saveSession } from '../services/storage';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing information', 'Email and password cannot be empty!');
      return;
    }

    try {
      setLoading(true);
      const data = await login(email.trim(), password);
      await saveSession(data);
      navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
    } catch (error) {
      Alert.alert('Login failed', error.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <View style={styles.center}>
        <Text style={styles.title}>LOGIN</Text>
        <Text style={styles.subtitle}>Step into the Zone.</Text>

        <InfoCard style={styles.card}>
          <TextInputField
            label="EIU Email"
            placeholder="example@eiu.edu.vn"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
          />
          <TextInputField
            label="Password"
            placeholder="Your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <CartoonButton title="GO" onPress={handleLogin} loading={loading} />
        </InfoCard>

        <View style={styles.links}>
          <Pressable onPress={() => navigation.navigate('Register')}>
            <Text style={styles.link}>Create account</Text>
          </Pressable>
          <Text style={styles.dot}>•</Text>
          <Pressable onPress={() => navigation.navigate('ActivateAccount')}>
            <Text style={styles.link}>Activate</Text>
          </Pressable>
          <Text style={styles.dot}>•</Text>
          <Pressable onPress={() => navigation.navigate('RulesAbout')}>
            <Text style={styles.link}>EZone Rules</Text>
          </Pressable>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 38,
    fontFamily: fonts.black, fontWeight: '900',
    color: colors.primary,
    letterSpacing: 2,
  },
  subtitle: {
    color: colors.text,
    fontFamily: fonts.bold, fontWeight: '800',
    marginBottom: 22,
  },
  card: {
    marginBottom: 18,
  },
  links: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  link: {
    color: colors.primary,
    fontFamily: fonts.black, fontWeight: '900',
  },
  dot: {
    color: colors.muted,
    fontFamily: fonts.black, fontWeight: '900',
  },
});
