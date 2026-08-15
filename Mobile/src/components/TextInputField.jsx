import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { cartoonShadow, colors, fonts } from '../constants/theme';

export default function TextInputField({ label, error, style, secureTextEntry, ...props }) {
  const [hidden, setHidden] = useState(true);

  const isPassword = secureTextEntry === true;

  return (
    <View style={[styles.wrapper, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <View style={[styles.inputRow, error ? styles.inputError : null]}>
        <TextInput
          placeholderTextColor="#999"
          autoCapitalize="none"
          style={styles.input}
          secureTextEntry={isPassword ? hidden : false}
          {...props}
        />

        {isPassword && (
          <Pressable
            onPress={() => setHidden(prev => !prev)}
            style={styles.eyeButton}
            hitSlop={8}
          >
            <Text style={styles.eyeIcon}>{hidden ? '👁' : '🙈'}</Text>
          </Pressable>
        )}
      </View>

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
  inputRow: {
    ...cartoonShadow,
    backgroundColor: colors.card,
    borderRadius: 12,
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    minHeight: 52,
    paddingHorizontal: 14,
    fontSize: 16,
    color: colors.text,
  },
  inputError: {
    borderColor: colors.danger,
  },
  eyeButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eyeIcon: {
    fontSize: 20,
  },
  error: {
    marginTop: 6,
    color: colors.danger,
    fontFamily: fonts.bold, fontWeight: '700',
  },
});
