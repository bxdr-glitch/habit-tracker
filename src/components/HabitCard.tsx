import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { useApp } from '../context/AppContext';
import { fonts, radii } from '../theme';
import { Habit } from '../types';
import { getFrequencyLabel } from '../utils/dates';
import { ConfettiBurst } from './ConfettiBurst';

type HabitCardProps = {
  habit: Habit;
  completed: boolean;
  streak: number;
  index?: number;
  onPress: () => void;
  onToggle: () => boolean;
};

export function HabitCard({
  habit,
  completed,
  streak,
  index = 0,
  onPress,
  onToggle,
}: HabitCardProps) {
  const { theme, preferences } = useApp();
  const scale = useSharedValue(1);
  const [burst, setBurst] = useState(0);

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handleToggle = () => {
    const nextCompleted = onToggle();
    scale.value = withSequence(
      withTiming(0.78, { duration: 90 }),
      withSpring(1, { damping: 7, stiffness: 240 }),
    );

    if (preferences.hapticsEnabled) {
      void Haptics.impactAsync(
        nextCompleted
          ? Haptics.ImpactFeedbackStyle.Medium
          : Haptics.ImpactFeedbackStyle.Light,
      );
    }

    if (nextCompleted) {
      setBurst((value) => value + 1);
    }
  };

  return (
    <Animated.View entering={FadeInDown.delay(index * 65).springify().damping(18)}>
      <View
        style={[
          styles.card,
          {
            backgroundColor: completed
              ? `${habit.color}${theme.isDark ? '16' : '12'}`
              : theme.surface,
            borderColor: completed ? `${habit.color}66` : theme.border,
          },
          Platform.OS === 'web' ? undefined : { shadowColor: theme.shadow },
        ]}
      >
        <Pressable
          accessibilityHint="Opens habit details"
          accessibilityRole="button"
          onPress={onPress}
          style={({ pressed }) => [
            styles.cardBody,
            { opacity: pressed ? 0.72 : 1 },
          ]}
        >
          <View
            style={[
              styles.iconWrap,
              { backgroundColor: `${habit.color}${theme.isDark ? '2E' : '26'}` },
            ]}
          >
            <Text style={styles.icon}>{habit.icon}</Text>
          </View>
          <View style={styles.textWrap}>
            <Text
              numberOfLines={1}
              style={[
                styles.name,
                {
                  color: theme.text,
                  textDecorationLine: completed ? 'line-through' : 'none',
                },
              ]}
            >
              {habit.name}
            </Text>
            <View style={styles.metaRow}>
              <Text style={[styles.meta, { color: theme.textSecondary }]}>
                {getFrequencyLabel(habit)}
              </Text>
              {streak > 0 ? (
                <>
                  <View
                    style={[styles.dot, { backgroundColor: theme.textTertiary }]}
                  />
                  <Ionicons name="flame" size={13} color={habit.color} />
                  <Text style={[styles.streak, { color: theme.textSecondary }]}>
                    {streak}
                  </Text>
                </>
              ) : null}
            </View>
          </View>
        </Pressable>

        <View style={styles.actionWrap}>
          {burst > 0 ? <ConfettiBurst key={burst} /> : null}
          <Animated.View style={buttonStyle}>
            <Pressable
              accessibilityLabel={
                completed
                  ? `Mark ${habit.name} incomplete`
                  : `Complete ${habit.name}`
              }
              accessibilityRole="checkbox"
              accessibilityState={{ checked: completed }}
              hitSlop={8}
              onPress={handleToggle}
              style={({ pressed }) => [
                styles.checkButton,
                {
                  backgroundColor: completed ? habit.color : theme.surfaceStrong,
                  borderColor: completed ? habit.color : theme.border,
                  opacity: pressed ? 0.82 : 1,
                },
              ]}
            >
              <Ionicons
                name={completed ? 'checkmark' : 'add'}
                size={completed ? 24 : 22}
                color={completed ? theme.black : theme.textSecondary}
              />
            </Pressable>
          </Animated.View>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 92,
    borderRadius: radii.lg,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingLeft: 14,
    ...Platform.select({
      web: { boxShadow: '0 8px 16px rgba(10, 18, 12, 0.055)' },
      default: {
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.055,
        shadowRadius: 16,
        elevation: 2,
      },
    }),
  },
  cardBody: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 27,
  },
  textWrap: {
    flex: 1,
    paddingHorizontal: 13,
  },
  name: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    letterSpacing: -0.2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 7,
  },
  meta: {
    fontFamily: fonts.medium,
    fontSize: 11.5,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    marginHorizontal: 7,
  },
  streak: {
    fontFamily: fonts.semiBold,
    fontSize: 11.5,
    marginLeft: 2,
  },
  actionWrap: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 4,
  },
  checkButton: {
    width: 48,
    height: 48,
    borderRadius: radii.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
