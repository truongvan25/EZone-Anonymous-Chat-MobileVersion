import React from 'react';
import { StyleSheet, Text } from 'react-native';
import CartoonButton from '../components/CartoonButton';
import InfoCard from '../components/InfoCard';
import Screen from '../components/Screen';
import { colors, fonts } from '../constants/theme';

const rules = [
  'Be respectful and friendly.',
  'Keep your personal information private.',
  'No bullying, hate speech, or inappropriate content.',
  'No spam, scams, or advertisements.',
  'Help make EZone a safe and enjoyable space for all students.',
  'Violations may result in warnings, temporary restrictions, or account suspension.',
];

export default function RulesAboutScreen({ navigation }) {
  return (
    <Screen>
      <Text style={styles.title}>EZone Rules</Text>
      <Text style={styles.subtitle}>Read before you enter the Zone.</Text>

      <InfoCard>
        {rules.map((rule, index) => (
          <Text key={rule} style={styles.rule}>{index + 1}. {rule}</Text>
        ))}
      </InfoCard>

      <CartoonButton
        title="ABOUT EZONE"
        variant="secondary"
        onPress={() => navigation.navigate('About')}
        style={styles.button}
      />
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
  rule: {
    color: colors.text,
    fontSize: 16,
    fontFamily: fonts.bold, fontWeight: '800',
    lineHeight: 26,
    marginBottom: 8,
  },
  about: {
    marginTop: 18,
  },
  aboutText: {
    color: colors.text,
    fontSize: 15,
    fontFamily: fonts.bold, fontWeight: '700',
    lineHeight: 23,
  },
  button: {
    marginTop: 20,
  },
});
