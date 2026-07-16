import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { cartoonShadow, colors, fonts } from '../constants/theme';

export default function InfoCard({ title, children, style }) {
  return (
    <View style={[styles.card, style]}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {typeof children === 'string' ? <Text style={styles.body}>{children}</Text> : children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...cartoonShadow,
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 18,
  },
  title: {
    color: colors.primary,
    fontSize: 20,
    fontFamily: fonts.black, fontWeight: '900',
    marginBottom: 8,
  },
  body: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
    fontFamily: fonts.medium, fontWeight: '600',
  },
});
