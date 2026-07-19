import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { useApp } from '../context/AppContext';
import { fonts, radii } from '../theme';
import { CheckIn, Habit } from '../types';
import { getWeeklyCompletion } from '../utils/dates';

type WeeklyChartProps = {
  habit: Habit;
  checkIns: CheckIn[];
};

export function WeeklyChart({ habit, checkIns }: WeeklyChartProps) {
  const { theme } = useApp();
  const weeks = getWeeklyCompletion(habit, checkIns, 8);
  const scheduled = weeks.reduce((total, week) => total + week.scheduled, 0);
  const completed = weeks.reduce((total, week) => total + week.completed, 0);
  const average = scheduled ? Math.round((completed / scheduled) * 100) : 0;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}
    >
      <View style={styles.heading}>
        <View>
          <Text style={[styles.eyebrow, { color: theme.textSecondary }]}>
            WEEKLY COMPLETION
          </Text>
          <Text style={[styles.title, { color: theme.text }]}>
            Your recent rhythm
          </Text>
        </View>
        <Text style={[styles.average, { color: habit.color }]}>{average}%</Text>
      </View>

      <View style={styles.chart}>
        <View
          style={[
            styles.guide,
            styles.guideTop,
            { borderColor: theme.border },
          ]}
        />
        <View
          style={[
            styles.guide,
            styles.guideMiddle,
            { borderColor: theme.border },
          ]}
        />
        {weeks.map((week, index) => {
          const height = Math.max(7, Math.round(112 * week.rate));
          const current = index === weeks.length - 1;

          return (
            <View key={week.start.toISOString()} style={styles.barColumn}>
              <View style={styles.barTrack}>
                <Animated.View
                  entering={FadeInUp.delay(index * 65).duration(420)}
                  style={[
                    styles.bar,
                    {
                      height,
                      backgroundColor: current
                        ? habit.color
                        : `${habit.color}${theme.isDark ? '80' : '72'}`,
                    },
                  ]}
                >
                  {current ? (
                    <View
                      style={[
                        styles.barCap,
                        { backgroundColor: theme.surfaceStrong },
                      ]}
                    />
                  ) : null}
                </Animated.View>
              </View>
              <Text
                style={[
                  styles.label,
                  {
                    color: current ? theme.text : theme.textTertiary,
                    fontFamily: current ? fonts.bold : fonts.medium,
                  },
                ]}
              >
                {index === 0 ||
                week.start.getMonth() !== weeks[index - 1].start.getMonth()
                  ? week.label
                  : '·'}
              </Text>
            </View>
          );
        })}
      </View>
      <Text style={[styles.caption, { color: theme.textSecondary }]}>
        {completed} of {scheduled} planned check-ins completed
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: 18,
  },
  heading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  eyebrow: {
    fontFamily: fonts.bold,
    fontSize: 9,
    letterSpacing: 1.4,
  },
  title: {
    fontFamily: fonts.displaySemiBold,
    fontSize: 20,
    letterSpacing: -0.45,
    marginTop: 2,
  },
  average: {
    fontFamily: fonts.display,
    fontSize: 27,
    letterSpacing: -1,
  },
  chart: {
    height: 146,
    marginTop: 22,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 7,
    position: 'relative',
  },
  guide: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderStyle: 'dashed',
  },
  guideTop: {
    top: 6,
  },
  guideMiddle: {
    top: 62,
  },
  barColumn: {
    flex: 1,
    height: 140,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  barTrack: {
    height: 116,
    width: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bar: {
    width: '68%',
    minWidth: 12,
    maxWidth: 26,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
    alignItems: 'center',
  },
  barCap: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 5,
  },
  label: {
    height: 18,
    fontSize: 9,
    marginTop: 6,
  },
  caption: {
    fontFamily: fonts.medium,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 5,
  },
});
