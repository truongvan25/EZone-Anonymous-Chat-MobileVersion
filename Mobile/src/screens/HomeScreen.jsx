import React, { useCallback, useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import CartoonButton from '../components/CartoonButton';
import InfoCard from '../components/InfoCard';
import Screen from '../components/Screen';
import { cartoonShadow, colors, fonts } from '../constants/theme';
import { getSession } from '../services/storage';
import { getUnreadReportCount } from '../services/api';

export default function HomeScreen({ navigation }) {
  const [session, setSession] = useState({ fullname: '', userId: '', roles: [] });
  const [unreadReportCount, setUnreadReportCount] = useState(0);
  const isAdmin = session.roles?.includes('Admin');

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

  // Badge kiểu Zalo: refetch mỗi lần Home được focus (kể cả sau khi Admin mở
  // AdminReportListScreen rồi quay lại) để badge cập nhật/biến mất kịp thời.
  useFocusEffect(
    useCallback(() => {
      if (!isAdmin) return;

      let mounted = true;

      getUnreadReportCount()
        .then(res => { if (mounted) setUnreadReportCount(res?.count || 0); })
        .catch(error => console.log('Unread report count error:', error));

      return () => { mounted = false; };
    }, [isAdmin])
  );

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
      <CartoonButton title="CHAT HISTORY" variant="secondary" onPress={() => navigation.navigate('ChatHistory')} style={styles.button} />
      <CartoonButton title="MY REPORTS" variant="secondary" onPress={() => navigation.navigate('MyReports')} style={styles.button} />
      <CartoonButton title="RULES / ABOUT EZONE" variant="secondary" onPress={() => navigation.navigate('RulesAbout')} style={styles.button} />
      <CartoonButton title="SETTINGS" variant="secondary" onPress={() => navigation.navigate('Settings')} style={styles.button} />
      {isAdmin && (
        <View style={styles.adminButtonWrap}>
          <CartoonButton title="ADMIN REPORTS" variant="secondary" onPress={() => navigation.navigate('AdminReportList')} style={styles.button} />
          {unreadReportCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadReportCount > 5 ? '5+' : unreadReportCount}</Text>
            </View>
          )}
        </View>
      )}
      <CartoonButton title="LOG OUT" variant="danger" onPress={() => navigation.navigate('LogoutConfirm')} style={styles.button} />
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
  adminButtonWrap: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: -6,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 5,
    backgroundColor: colors.danger,
    borderWidth: 2,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontFamily: fonts.black,
    fontWeight: '900',
  },
});
