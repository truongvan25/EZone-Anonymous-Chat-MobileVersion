import React from 'react';
import { StyleSheet, Text } from 'react-native';
import CartoonButton from '../components/CartoonButton';
import InfoCard from '../components/InfoCard';
import Screen from '../components/Screen';
import { colors, fonts } from '../constants/theme';

// Tách ra từ RulesAboutScreen để có 1 "About screen" độc lập theo yêu cầu đề bài.
export default function AboutScreen({ navigation }) {
  return (
    <Screen>
      <Text style={styles.title}>About EZone</Text>
      <Text style={styles.subtitle}>Anonymous. Safe. Student-only.</Text>

      <InfoCard title="What is EZone?" style={styles.card}>
        <Text style={styles.text}>
          EZone is an anonymous student chat app. You get matched with another
          EIU student, chat safely without revealing your identity right away,
          and can choose to reveal it later if you both agree.
        </Text>
      </InfoCard>

      <InfoCard title="App Info" style={styles.card}>
        <Text style={styles.text}>Version: 1.0.0</Text>
        <Text style={styles.text}>Built with React Native + .NET Web API</Text>
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
  card: {
    marginBottom: 16,
  },
  text: {
    color: colors.text,
    fontSize: 15,
    fontFamily: fonts.bold, fontWeight: '700',
    lineHeight: 23,
  },
  button: {
    marginTop: 8,
  },
});
