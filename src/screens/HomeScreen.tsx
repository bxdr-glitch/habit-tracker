import Ionicons from '@expo/vector-icons/Ionicons';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { AppScreen } from '../components/AppScreen';
import { EmptyState } from '../components/EmptyState';
import { HabitCard } from '../components/HabitCard';
import { HomeSkeleton } from '../components/Skeleton';
import { useApp } from '../context/AppContext';
import { fonts, radii } from '../theme';
import { RootStackParamList, TabParamList } from '../navigation/types';
import {
  addDays,
  formatDateKey,
  getCurrentStreak,
  getTodayLabel,
  hasCheckIn,
  isScheduled,
} from '../utils/dates';

type Props = BottomTabScreenProps<TabParamList, 'Today'>;

function ProgressRing({
  completed,
  total,
  color,
  track,
  textColor,
}: {
  completed: number;
  total: number;
  color: string;
  track: string;
  textColor: string;
}) {
  const size = 76;
  const stroke = 7;
  const radius = (size - stroke) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = total === 0 ? 0 : completed / total;

  return (
    <View style={styles.ringWrap}>
      <Svg width={size} height={size} style={styles.ring}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={track}
          strokeWidth={stroke}
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={circumference * (1 - progress)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <Text style={[styles.ringText, { color: textColor }]}>
        {completed}/{total}
      </Text>
    </View>
  );
}

export function HomeScreen({ navigation }: Props) {
  const {
    habits,
    checkIns,
    theme,
    isLoading,
    refresh,
    toggleCheckIn,
    deleteHabit,
    syncStatus,
    isCloudEnabled,
  } = useApp();
  const [refreshing, setRefreshing] = useState(false);
  const rootNavigation =
    navigation.getParent<NativeStackNavigationProp<RootStackParamList>>();
  const today = new Date();
  const todayHabits = habits.filter((habit) => isScheduled(habit, today));
  const completedToday = todayHabits.filter((habit) =>
    hasCheckIn(habit.id, today, checkIns),
  ).length;

  const week = useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) => {
        const date = addDays(new Date(), index - 6);
        const scheduled = habits.filter((habit) => isScheduled(habit, date));
        const completed = scheduled.filter((habit) =>
          hasCheckIn(habit.id, date, checkIns),
        ).length;
        return { date, completed, total: scheduled.length };
      }),
    [habits, checkIns],
  );

  const openForm = () => rootNavigation?.navigate('HabitForm');
  const openDetail = (habitId: string) =>
    rootNavigation?.navigate('HabitDetail', { habitId });

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const confirmDelete = (id: string, name: string) => {
    Alert.alert(
      `Let go of "${name}"?`,
      'Its check-in history will be removed too.',
      [
        { text: 'Keep it', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteHabit(id),
        },
      ],
    );
  };

  return (
    <AppScreen>
      <View
        style={[
          styles.decorativeOrb,
          {
            backgroundColor: `${theme.accent}${theme.isDark ? '0E' : '28'}`,
            pointerEvents: 'none',
          },
        ]}
      />
      {isLoading ? (
        <HomeSkeleton />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={theme.accent}
              colors={[theme.accent]}
              progressBackgroundColor={theme.surface}
            />
          }
        >
          <Animated.View entering={FadeIn.duration(380)} style={styles.topBar}>
            <View>
              <Text style={[styles.date, { color: theme.textSecondary }]}>
                {getTodayLabel()}
              </Text>
              <View style={styles.brandRow}>
                <View
                  style={[styles.brandMark, { backgroundColor: theme.accent }]}
                >
                  <View style={[styles.brandSeed, { backgroundColor: theme.black }]} />
                </View>
                <Text style={[styles.brand, { color: theme.text }]}>steady</Text>
              </View>
            </View>
            <Pressable
              accessibilityLabel="Add a habit"
              accessibilityRole="button"
              onPress={openForm}
              style={({ pressed }) => [
                styles.addButton,
                {
                  backgroundColor: theme.text,
                  opacity: pressed ? 0.78 : 1,
                },
              ]}
            >
              <Ionicons name="add" size={25} color={theme.background} />
            </Pressable>
          </Animated.View>

          <Animated.Text
            entering={FadeInDown.delay(70).duration(460)}
            style={[styles.headline, { color: theme.text }]}
          >
            Keep the promise{'\n'}you made to{' '}
            <Text style={[styles.headlineAccent, { color: theme.textSecondary }]}>
              yourself.
            </Text>
          </Animated.Text>

          {habits.length === 0 ? (
            <EmptyState onAdd={openForm} />
          ) : (
            <>
              <Animated.View
                entering={FadeInDown.delay(120).springify().damping(18)}
                style={[
                  styles.progressCard,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                  },
                  Platform.OS === 'web'
                    ? undefined
                    : { shadowColor: theme.shadow },
                ]}
              >
                <View style={styles.progressCopy}>
                  <View style={styles.progressStatus}>
                    <View
                      style={[
                        styles.statusDot,
                        {
                          backgroundColor:
                            syncStatus === 'error'
                              ? theme.danger
                              : syncStatus === 'syncing'
                                ? '#F3A96B'
                                : theme.accent,
                        },
                      ]}
                    />
                    <Text
                      style={[styles.statusText, { color: theme.textSecondary }]}
                    >
                      {isCloudEnabled
                        ? syncStatus === 'syncing'
                          ? 'Syncing quietly'
                          : syncStatus === 'synced'
                            ? 'Saved everywhere'
                            : syncStatus === 'error'
                              ? 'Safe on this device'
                              : 'Offline ready'
                        : 'Saved on this device'}
                    </Text>
                  </View>
                  <Text style={[styles.progressTitle, { color: theme.text }]}>
                    {completedToday === todayHabits.length && todayHabits.length > 0
                      ? 'Today is in the books.'
                      : completedToday === 0
                        ? 'Start with one small win.'
                        : "You're finding your rhythm."}
                  </Text>
                  <Text
                    style={[styles.progressBody, { color: theme.textSecondary }]}
                  >
                    {todayHabits.length === 0
                      ? 'Nothing is scheduled today.'
                      : `${todayHabits.length - completedToday} ${
                          todayHabits.length - completedToday === 1
                            ? 'habit'
                            : 'habits'
                        } left today`}
                  </Text>
                </View>
                <ProgressRing
                  completed={completedToday}
                  total={todayHabits.length}
                  color={theme.accent}
                  track={theme.backgroundRaised}
                  textColor={theme.text}
                />
              </Animated.View>

              <View style={styles.weekRow}>
                {week.map(({ date, completed, total }, index) => {
                  const isToday = index === week.length - 1;
                  const complete = total > 0 && completed === total;
                  return (
                    <View key={formatDateKey(date)} style={styles.dayColumn}>
                      <Text
                        style={[
                          styles.dayName,
                          {
                            color: isToday
                              ? theme.text
                              : theme.textTertiary,
                          },
                        ]}
                      >
                        {date
                          .toLocaleDateString(undefined, { weekday: 'short' })
                          .slice(0, 1)}
                      </Text>
                      <View
                        style={[
                          styles.dayCircle,
                          {
                            backgroundColor: complete
                              ? theme.accent
                              : isToday
                                ? theme.surface
                                : 'transparent',
                            borderColor: isToday ? theme.text : theme.border,
                            borderWidth: isToday ? 1.5 : 1,
                          },
                        ]}
                      >
                        {complete ? (
                          <Ionicons
                            name="checkmark"
                            size={15}
                            color={theme.accentText}
                          />
                        ) : (
                          <Text
                            style={[
                              styles.dayNumber,
                              {
                                color: isToday
                                  ? theme.text
                                  : theme.textSecondary,
                              },
                            ]}
                          >
                            {date.getDate()}
                          </Text>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>

              <View style={styles.sectionHeading}>
                <View>
                  <Text style={[styles.sectionTitle, { color: theme.text }]}>
                    Today's rhythm
                  </Text>
                  <Text
                    style={[styles.sectionCaption, { color: theme.textSecondary }]}
                  >
                    Swipe left to make space
                  </Text>
                </View>
                <View
                  style={[
                    styles.countPill,
                    { backgroundColor: theme.backgroundRaised },
                  ]}
                >
                  <Text style={[styles.countText, { color: theme.textSecondary }]}>
                    {completedToday}/{todayHabits.length}
                  </Text>
                </View>
              </View>

              <View style={styles.list}>
                {habits.map((habit, index) => {
                  const completed = hasCheckIn(habit.id, today, checkIns);
                  return (
                    <ReanimatedSwipeable
                      key={habit.id}
                      friction={2}
                      rightThreshold={42}
                      overshootRight={false}
                      renderRightActions={() => (
                        <Pressable
                          accessibilityLabel={`Delete ${habit.name}`}
                          accessibilityRole="button"
                          onPress={() => confirmDelete(habit.id, habit.name)}
                          style={[
                            styles.deleteAction,
                            { backgroundColor: theme.dangerSoft },
                          ]}
                        >
                          <Ionicons
                            name="trash-outline"
                            size={22}
                            color={theme.danger}
                          />
                          <Text
                            style={[styles.deleteText, { color: theme.danger }]}
                          >
                            Delete
                          </Text>
                        </Pressable>
                      )}
                    >
                      <HabitCard
                        habit={habit}
                        completed={completed}
                        streak={getCurrentStreak(habit, checkIns)}
                        index={index}
                        onPress={() => openDetail(habit.id)}
                        onToggle={() => toggleCheckIn(habit.id)}
                      />
                    </ReanimatedSwipeable>
                  );
                })}
              </View>
            </>
          )}
        </ScrollView>
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  decorativeOrb: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    right: -130,
    top: -90,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 130,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  date: {
    fontFamily: fonts.bold,
    fontSize: 9.5,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 5,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandMark: {
    width: 21,
    height: 21,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-7deg' }],
  },
  brandSeed: {
    width: 5,
    height: 9,
    borderTopLeftRadius: 5,
    borderBottomRightRadius: 5,
    transform: [{ rotate: '19deg' }],
  },
  brand: {
    fontFamily: fonts.display,
    fontSize: 25,
    letterSpacing: -1,
  },
  addButton: {
    width: 46,
    height: 46,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headline: {
    fontFamily: fonts.display,
    fontSize: 39,
    lineHeight: 42,
    letterSpacing: -1.4,
    marginTop: 34,
  },
  headlineAccent: {
    fontFamily: 'Fraunces_600SemiBold_Italic',
  },
  progressCard: {
    minHeight: 126,
    borderWidth: 1,
    borderRadius: radii.xl,
    marginTop: 28,
    paddingHorizontal: 20,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    ...Platform.select({
      web: { boxShadow: '0 12px 22px rgba(10, 18, 12, 0.06)' },
      default: {
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.06,
        shadowRadius: 22,
        elevation: 3,
      },
    }),
  },
  progressCopy: {
    flex: 1,
    paddingRight: 12,
  },
  progressStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontFamily: fonts.semiBold,
    fontSize: 10,
  },
  progressTitle: {
    fontFamily: fonts.displaySemiBold,
    fontSize: 18,
    letterSpacing: -0.4,
  },
  progressBody: {
    fontFamily: fonts.medium,
    fontSize: 11.5,
    marginTop: 4,
  },
  ringWrap: {
    width: 76,
    height: 76,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
  },
  ringText: {
    fontFamily: fonts.bold,
    fontSize: 15,
    letterSpacing: -0.4,
  },
  weekRow: {
    marginTop: 24,
    paddingHorizontal: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayColumn: {
    alignItems: 'center',
    gap: 7,
  },
  dayName: {
    fontFamily: fonts.bold,
    fontSize: 9,
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumber: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
  },
  sectionHeading: {
    marginTop: 34,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontFamily: fonts.displaySemiBold,
    fontSize: 22,
    letterSpacing: -0.5,
  },
  sectionCaption: {
    fontFamily: fonts.medium,
    fontSize: 10.5,
    marginTop: 3,
  },
  countPill: {
    borderRadius: radii.pill,
    paddingVertical: 7,
    paddingHorizontal: 11,
  },
  countText: {
    fontFamily: fonts.bold,
    fontSize: 11,
  },
  list: {
    gap: 11,
  },
  deleteAction: {
    width: 88,
    borderRadius: radii.lg,
    marginLeft: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteText: {
    fontFamily: fonts.bold,
    fontSize: 10,
    marginTop: 5,
  },
});
