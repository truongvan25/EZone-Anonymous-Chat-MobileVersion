import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { cartoonShadow, colors, fonts } from '../constants/theme';

export default function TextInputField({ label, error, style, ...props }) {
  return (
    <View style={[styles.wrapper, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        placeholderTextColor="#999"
        autoCapitalize="none"
        style={[styles.input, error ? styles.inputError : null]}
        {...props}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 14,
  },
  label: {
    fontSize: 14,
    fontFamily: fonts.bold, fontWeight: '800',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    ...cartoonShadow,
    backgroundColor: colors.card,
    borderRadius: 12,
    minHeight: 52,
    paddingHorizontal: 14,
    fontSize: 16,
    color: colors.text,
  },
  inputError: {
    borderColor: colors.danger,
  },
  error: {
    marginTop: 6,
    color: colors.danger,
    fontFamily: fonts.bold, fontWeight: '700',
  },
});
