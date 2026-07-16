import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { cartoonShadow, colors, fonts } from '../constants/theme';

export default function MatchSuccessScreen({ navigation, route }) {
  const scale = useRef(new Animated.Value(0.6)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const { roomId, userId } = route.params || {};

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, friction: 4, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => {
      navigation.replace('ChatRoom', { roomId, userId });
    }, 1200);

    return () => clearTimeout(timer);
  }, [navigation, opacity, roomId, scale, userId]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.card, { opacity, transform: [{ scale }] }]}>
        <Text style={styles.icon}>🎉</Text>
        <Text style={styles.title}>MATCHED!</Text>
        <Text style={styles.subtitle}>Someone's in the chat...</Text>
        <Text style={styles.room}>Room #{roomId}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: colors.background,
  },
  card: {
    ...cartoonShadow,
    width: '100%',
    backgroundColor: colors.card,
    borderRadius: 26,
    padding: 28,
    alignItems: 'center',
  },
  icon: {
    fontSize: 78,
  },
  title: {
    color: colors.primary,
    fontSize: 38,
    fontFamily: fonts.black, fontWeight: '900',
    marginTop: 10,
  },
  subtitle: {
    color: colors.text,
    fontSize: 17,
    fontFamily: fonts.bold, fontWeight: '800',
    marginTop: 8,
  },
  room: {
    color: colors.muted,
    marginTop: 14,
    fontFamily: fonts.bold, fontWeight: '800',
  },
});
