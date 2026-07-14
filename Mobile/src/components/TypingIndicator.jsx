import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../constants/theme';

export default function TypingIndicator({ visible }) {
  if (!visible) return null;

  return (
    <View style={styles.wrap}>
      <Text style={styles.text}>Typing...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: 'flex-start',
    backgroundColor: colors.secondary,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginVertical: 6,
    borderWidth: 2,
    borderColor: colors.border,
  },
  text: {
    color: colors.text,
    fontWeight: '800',
    fontStyle: 'italic',
  },
});
