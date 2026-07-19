import Ionicons from '@expo/vector-icons/Ionicons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { AppScreen } from '../components/AppScreen';
import { ConfettiBurst } from '../components/ConfettiBurst';
import { HabitHeatmap } from '../components/HabitHeatmap';
import { StackHeader } from '../components/StackHeader';
import { WeeklyChart } from '../components/WeeklyChart';
import { useApp } from '../context/AppContext';
import { RootStackParamList } from '../navigation/types';
import { fonts, radii } from '../theme';
import {
  getCurrentStreak,
  getFrequencyLabel,
  getLongestStreak,
  hasCheckIn,
} from '../utils/dates';

type Props = NativeStackScreenProps<RootStackParamList, 'HabitDetail'>;

export function HabitDetailScreen({ route, navigation }: Props) {
  const { habits, checkIns, preferences, theme, toggleCheckIn } = useApp();
  const habit = habits.find((item) => item.id === route.params.habitId);
  const scale = useSharedValue(1);
  const [burst, setBurst] = useState(0);
  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (!habit) {
    return (
      <AppScreen>
        <StackHeader title="Habit not found" onBack={navigation.goBack} />
        <View style={styles.missing}>
          <Text style={[styles.missingTitle, { color: theme.text }]}>
            This habit has moved on.
          </Text>
          <Pressable accessibilityRole="button" onPress={navigation.goBack}>
            <Text style={[styles.missingLink, { color: theme.textSecondary }]}>
              Return to today
            </Text>
          </Pressable>
        </View>
      </AppScreen>
    );
  }

  const completed = hasCheckIn(habit.id, new Date(), checkIns);
  const currentStreak = getCurrentStreak(habit, checkIns);
  const longestStreak = getLongestStreak(habit, checkIns);
  const habitCheckIns = checkIns.filter(
    (checkIn) => checkIn.habitId === habit.id,
  );
  const started = new Date(habit.createdAt).toLocaleDateString(undefined, {
    month: 'short',
    year: 'numeric',
  });

  const handleCheckIn = () => {
    const nextCompleted = toggleCheckIn(habit.id);
    scale.value = withSequence(
      withTiming(0.94, { duration: 90 }),
      withSpring(1, { damping: 8, stiffness: 210 }),
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
    <AppScreen>
      <StackHeader
        title="Your progress"
        eyebrow="Habit detail"
        onBack={navigation.goBack}
        right={
          <Pressable
            accessibilityLabel="Edit habit"
            accessibilityRole="button"
            onPress={() =>
              navigation.navigate('HabitForm', { habitId: habit.id })
            }
            style={({ pressed }) => [
              styles.editButton,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <Ionicons name="create-outline" size={20} color={theme.text} />
          </Pressable>
        }
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          entering={FadeIn.duration(420)}
          style={[
            styles.hero,
            {
              backgroundColor: `${habit.color}${theme.isDark ? '27' : '24'}`,
              borderColor: `${habit.color}6E`,
            },
          ]}
        >
          <View style={styles.heroTop}>
            <Animated.View
              entering={FadeInDown.delay(80).springify()}
              style={[styles.heroIcon, { backgroundColor: habit.color }]}
            >
              <Text style={styles.heroEmoji}>{habit.icon}</Text>
            </Animated.View>
            <View
              style={[
                styles.sincePill,
                { backgroundColor: `${theme.surface}${theme.isDark ? 'CC' : 'E6'}` },
              ]}
            >
              <Text style={[styles.sinceText, { color: theme.textSecondary }]}>
                SINCE {started.toUpperCase()}
              </Text>
            </View>
          </View>
          <Text style={[styles.heroTitle, { color: theme.text }]}>
            {habit.name}
          </Text>
          <View style={styles.heroMeta}>
            <Text style={[styles.heroMetaText, { color: theme.textSecondary }]}>
              {getFrequencyLabel(habit)}
            </Text>
            {habit.reminderTime ? (
              <>
                <View
                  style={[styles.metaDot, { backgroundColor: theme.textTertiary }]}
                />
                <Ionicons
                  name="notifications-outline"
                  size={13}
                  color={theme.textSecondary}
                />
                <Text
                  style={[styles.heroMetaText, { color: theme.textSecondary }]}
                >
                  {habit.reminderTime}
                </Text>
              </>
            ) : null}
          </View>

          <Animated.View style={[styles.checkButtonWrap, buttonStyle]}>
            {burst > 0 ? (
              <View style={styles.burstWrap}>
                <ConfettiBurst key={burst} />
              </View>
            ) : null}
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: completed }}
              onPress={handleCheckIn}
              style={({ pressed }) => [
                styles.checkInButton,
                {
                  backgroundColor: completed ? habit.color : theme.text,
                  opacity: pressed ? 0.82 : 1,
                },
              ]}
            >
              <Ionicons
                name={completed ? 'checkmark-circle' : 'add-circle-outline'}
                size={21}
                color={completed ? theme.black : theme.background}
              />
              <Text
                style={[
                  styles.checkInText,
                  { color: completed ? theme.black : theme.background },
                ]}
              >
                {completed ? 'Done for today' : 'Check in for today'}
              </Text>
            </Pressable>
          </Animated.View>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(120).duration(420)}
          style={styles.stats}
        >
          <View
            style={[
              styles.statCard,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <Ionicons name="flame" size={18} color={habit.color} />
            <Text style={[styles.statValue, { color: theme.text }]}>
              {currentStreak}
            </Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
              Current
            </Text>
          </View>
          <View
            style={[
              styles.statCard,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <Ionicons name="trophy-outline" size={18} color={habit.color} />
            <Text style={[styles.statValue, { color: theme.text }]}>
              {longestStreak}
            </Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
              Best streak
            </Text>
          </View>
          <View
            style={[
              styles.statCard,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <Ionicons name="checkmark-done" size={18} color={habit.color} />
            <Text style={[styles.statValue, { color: theme.text }]}>
              {habitCheckIns.length}
            </Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
              Total
            </Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(180).duration(460)}>
          <HabitHeatmap habit={habit} checkIns={checkIns} />
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(240).duration(460)}
          style={styles.chartSpacing}
        >
          <WeeklyChart habit={habit} checkIns={checkIns} />
        </Animated.View>

        <View
          style={[
            styles.note,
            { backgroundColor: theme.backgroundRaised },
          ]}
        >
          <Text style={[styles.noteMark, { color: habit.color }]}>"</Text>
          <Text style={[styles.noteText, { color: theme.textSecondary }]}>
            Consistency is not perfection. It is simply returning, again and
            again.
          </Text>
        </View>
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 50,
  },
  editButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: {
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: 20,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  heroIcon: {
    width: 72,
    height: 72,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-3deg' }],
  },
  heroEmoji: {
    fontSize: 34,
  },
  sincePill: {
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  sinceText: {
    fontFamily: fonts.bold,
    fontSize: 8.5,
    letterSpacing: 1,
  },
  heroTitle: {
    fontFamily: fonts.display,
    fontSize: 34,
    letterSpacing: -1.1,
    marginTop: 18,
  },
  heroMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 7,
  },
  heroMetaText: {
    fontFamily: fonts.medium,
    fontSize: 11,
    marginLeft: 3,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    marginHorizontal: 8,
  },
  checkButtonWrap: {
    marginTop: 22,
    position: 'relative',
  },
  burstWrap: {
    position: 'absolute',
    right: 38,
    top: 13,
    zIndex: 4,
  },
  checkInButton: {
    height: 54,
    borderRadius: radii.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  checkInText: {
    fontFamily: fonts.bold,
    fontSize: 13,
  },
  stats: {
    flexDirection: 'row',
    gap: 9,
    marginTop: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    minHeight: 112,
    borderRadius: radii.md,
    borderWidth: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  statValue: {
    fontFamily: fonts.display,
    fontSize: 27,
    letterSpacing: -0.8,
    marginTop: 3,
  },
  statLabel: {
    fontFamily: fonts.medium,
    fontSize: 9.5,
    marginTop: 1,
  },
  chartSpacing: {
    marginTop: 12,
  },
  note: {
    marginTop: 12,
    borderRadius: radii.lg,
    padding: 20,
    flexDirection: 'row',
  },
  noteMark: {
    fontFamily: fonts.display,
    fontSize: 38,
    lineHeight: 34,
    marginRight: 9,
  },
  noteText: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 18,
  },
  missing: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  missingTitle: {
    fontFamily: fonts.display,
    fontSize: 28,
  },
  missingLink: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    marginTop: 12,
  },
});
