import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../constants/theme';

export default function MessageBubble({ message, isOwn, timestamp }) {
  return (
    <View style={[styles.row, isOwn ? styles.rowOwn : styles.rowOther]}>
      <View style={[styles.bubble, isOwn ? styles.own : styles.other]}>
        <Text style={[styles.text, isOwn ? styles.ownText : styles.otherText]}>{message}</Text>
        {timestamp ? <Text style={[styles.time, isOwn ? styles.ownTime : styles.otherTime]}>{timestamp}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    width: '100%',
    marginVertical: 6,
  },
  rowOwn: {
    alignItems: 'flex-end',
  },
  rowOther: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  own: {
    backgroundColor: colors.primary,
  },
  other: {
    backgroundColor: '#fff',
  },
  text: {
    fontSize: 16,
    fontFamily: fonts.medium, fontWeight: '600',
  },
  ownText: {
    color: '#fff',
  },
  otherText: {
    color: colors.text,
  },
  time: {
    fontSize: 11,
    marginTop: 4,
    fontFamily: fonts.bold, fontWeight: '700',
  },
  ownTime: {
    color: '#ffe3eb',
  },
  otherTime: {
    color: colors.muted,
  },
});
