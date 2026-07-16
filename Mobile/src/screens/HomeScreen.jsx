import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import CartoonButton from '../components/CartoonButton';
import InfoCard from '../components/InfoCard';
import Screen from '../components/Screen';
import { cartoonShadow, colors, fonts } from '../constants/theme';
import { clearSession, getSession } from '../services/storage';
import { logoutRequest } from '../services/api';

export default function HomeScreen({ navigation }) {
  const [session, setSession] = useState({ fullname: '', userId: '', roles: [] });

  useEffect(() => {
  const loadSession = async () => {
    try {
      const data = await getSession();
      setSession(data);
    } catch (error) {
      console.log('Home session error:', error);
      setSession({ fullname: '', userId: '' });
    }
  };

  loadSession();
}, []);

  const handleLogout = async () => {
    try {
      await logoutRequest();
    } catch {
      // Backend logout lỗi vẫn xóa local session để người dùng thoát app.
    }
    await clearSession();
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  const goFindMatch = () => {
    if (!session.userId) {
      Alert.alert('Session error', 'Missing userId. Please login again.');
      return;
    }
    navigation.navigate('Waiting', { userId: session.userId });
  };

  return (
    <Screen>
      <View style={styles.hero}>
        <Text style={styles.emoji}>👻</Text>
        <Text style={styles.title}>EZone</Text>
        <Text style={styles.subtitle}>Go Anonymous. Find your mystery buddy.</Text>
      </View>

      <InfoCard title="Your profile" style={styles.profile}>
        <Text style={styles.profileText}>Nickname: {session.fullname || 'EZone Student'}</Text>
        <Text style={styles.profileText}>User ID: {session.userId || 'Unknown'}</Text>
      </InfoCard>

      <CartoonButton title="FIND A MATCH" onPress={goFindMatch} style={styles.button} />
      <CartoonButton title="MY PROFILE" variant="secondary" onPress={() => navigation.navigate('Profile')} style={styles.button} />
      <CartoonButton title="RULES / ABOUT EZONE" variant="secondary" onPress={() => navigation.navigate('RulesAbout')} style={styles.button} />
      {session.roles?.includes('Admin') && (
        <CartoonButton title="ADMIN REPORTS" variant="secondary" onPress={() => navigation.navigate('AdminReportList')} style={styles.button} />
      )}
      <CartoonButton title="LOG OUT" variant="danger" onPress={handleLogout} style={styles.button} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    ...cartoonShadow,
    marginTop: 30,
    backgroundColor: colors.primary,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  emoji: {
    fontSize: 58,
  },
  title: {
    color: '#fff',
    fontSize: 42,
    fontFamily: fonts.black, fontWeight: '900',
  },
  subtitle: {
    color: '#fff',
    fontFamily: fonts.bold, fontWeight: '800',
    textAlign: 'center',
  },
  profile: {
    marginTop: 22,
    marginBottom: 10,
  },
  profileText: {
    color: colors.text,
    fontSize: 16,
    fontFamily: fonts.bold, fontWeight: '800',
    marginTop: 4,
  },
  button: {
    marginTop: 14,
  },
});
