import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../constants/theme';
import { clearSession, hasValidSession } from '../services/storage';

export default function SplashScreen({ navigation }) {
  useEffect(() => {
    const checkLogin = async () => {
      try {
        const valid = await hasValidSession();

        if (valid) {
          navigation.reset({
            index: 0,
            routes: [{ name: 'Home' }],
          });
        } else {
          await clearSession();
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
        }
      } catch (error) {
        console.log('SplashScreen error:', error);

        await clearSession();
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
      }
    };

    checkLogin();
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>EZone</Text>
      <Text style={styles.subtitle}>Go Anonymous</Text>
      <ActivityIndicator style={styles.loader} color={colors.primary} size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  logo: {
    color: colors.primary,
    fontSize: 46,
    fontFamily: fonts.black, fontWeight: '900',
    letterSpacing: 1,
  },
  subtitle: {
    color: colors.text,
    marginTop: 6,
    fontSize: 16,
    fontFamily: fonts.bold, fontWeight: '800',
  },
  loader: {
    marginTop: 30,
  },
});
