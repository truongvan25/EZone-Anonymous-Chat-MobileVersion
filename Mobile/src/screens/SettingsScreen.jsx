import React, { useEffect, useState } from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Screen from '../components/Screen';
import InfoCard from '../components/InfoCard';
import CartoonButton from '../components/CartoonButton';
import { colors, fonts } from '../constants/theme';

const SETTINGS_KEYS = {
  notifications: 'settings_notificationsEnabled',
  soundEffects: 'settings_soundEffectsEnabled',
};

export default function SettingsScreen({ navigation }) {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    (async () => {
      const [notif, sound] = await Promise.all([
        AsyncStorage.getItem(SETTINGS_KEYS.notifications),
        AsyncStorage.getItem(SETTINGS_KEYS.soundEffects),
      ]);
      if (notif !== null) setNotificationsEnabled(notif === 'true');
      if (sound !== null) setSoundEnabled(sound === 'true');
    })();
  }, []);

  const toggleNotifications = async value => {
    setNotificationsEnabled(value);
    await AsyncStorage.setItem(SETTINGS_KEYS.notifications, String(value));
  };

  const toggleSound = async value => {
    setSoundEnabled(value);
    await AsyncStorage.setItem(SETTINGS_KEYS.soundEffects, String(value));
  };

  return (
    <Screen>
      <Text style={styles.title}>Settings</Text>
      <Text style={styles.subtitle}>Manage your EZone preferences</Text>

      <InfoCard title="Preferences" style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Push Notifications</Text>
          <Switch
            value={notificationsEnabled}
            onValueChange={toggleNotifications}
            trackColor={{ false: '#D1D5DB', true: colors.primary }}
            thumbColor="#FFFFFF"
          />
        </View>
        <View style={[styles.row, styles.rowLast]}>
          <Text style={styles.rowLabel}>Sound Effects</Text>
          <Switch
            value={soundEnabled}
            onValueChange={toggleSound}
            trackColor={{ false: '#D1D5DB', true: colors.primary }}
            thumbColor="#FFFFFF"
          />
        </View>
      </InfoCard>

      <InfoCard title="Account" style={styles.card}>
        <CartoonButton
          title="EDIT PROFILE"
          variant="secondary"
          onPress={() => navigation.navigate('Profile')}
          style={styles.innerButton}
        />
        <CartoonButton
          title="DELETE ACCOUNT"
          variant="danger"
          onPress={() => navigation.navigate('DeleteAccount')}
          style={styles.innerButton}
        />
      </InfoCard>

      <CartoonButton title="BACK" variant="secondary" onPress={() => navigation.goBack()} style={styles.button} />
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
  card: { marginBottom: 16 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  rowLast: { borderBottomWidth: 0 },
  rowLabel: {
    fontSize: 15,
    color: colors.text,
    fontFamily: fonts.bold, fontWeight: '700',
  },
  innerButton: { marginTop: 8 },
  button: { marginTop: 8 },
});
