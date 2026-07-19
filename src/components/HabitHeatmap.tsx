import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Svg, { Rect, Text as SvgText } from 'react-native-svg';

import { useApp } from '../context/AppContext';
import { fonts, radii } from '../theme';
import { CheckIn, Habit } from '../types';
import {
  addDays,
  formatDateKey,
  isScheduled,
  startOfWeek,
} from '../utils/dates';

type HabitHeatmapProps = {
  habit: Habit;
  checkIns: CheckIn[];
};

export function HabitHeatmap({ habit, checkIns }: HabitHeatmapProps) {
  const { theme } = useApp();
  const { width: windowWidth } = useWindowDimensions();
  const width = Math.min(windowWidth - 64, 480);
  const labelWidth = 20;
  const gap = 3;
  const cell = Math.max(10, Math.floor((width - labelWidth - gap * 11) / 12));
  const chartHeight = 26 + cell * 7 + gap * 6;
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  const firstDay = addDays(startOfWeek(today), -11 * 7);
  const completed = new Set(
    checkIns
      .filter((checkIn) => checkIn.habitId === habit.id)
      .map((checkIn) => checkIn.date),
  );

  const monthLabels: { label: string; x: number }[] = [];
  let previousMonth = -1;
  for (let week = 0; week < 12; week += 1) {
    const date = addDays(firstDay, week * 7);
    if (date.getMonth() !== previousMonth) {
      monthLabels.push({
        label: date.toLocaleDateString(undefined, { month: 'short' }),
        x: labelWidth + week * (cell + gap),
      });
      previousMonth = date.getMonth();
    }
  }

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
            LAST 12 WEEKS
          </Text>
          <Text style={[styles.title, { color: theme.text }]}>
            Consistency map
          </Text>
        </View>
        <View style={[styles.liveDot, { backgroundColor: habit.color }]} />
      </View>

      <View style={styles.chartWrap}>
        <Svg width={width} height={chartHeight}>
          {monthLabels.map((month) => (
            <SvgText
              key={`${month.label}-${month.x}`}
              x={month.x}
              y={11}
              fill={theme.textSecondary}
              fontFamily={fonts.medium}
              fontSize={9}
            >
              {month.label}
            </SvgText>
          ))}
          {['M', 'W', 'F'].map((label, index) => (
            <SvgText
              key={label}
              x={0}
              y={26 + (index * 2 + 1) * (cell + gap) + cell * 0.72}
              fill={theme.textTertiary}
              fontFamily={fonts.medium}
              fontSize={8}
            >
              {label}
            </SvgText>
          ))}

          {Array.from({ length: 12 * 7 }, (_, index) => {
            const week = Math.floor(index / 7);
            const day = index % 7;
            const date = addDays(firstDay, week * 7 + day);
            const done = completed.has(formatDateKey(date));
            const scheduled = isScheduled(habit, date);
            const future = date > today;
            const fill = future
              ? theme.backgroundRaised
              : done
                ? habit.color
                : scheduled
                  ? theme.isDark
                    ? '#303A31'
                    : '#DDE1D7'
                  : theme.backgroundRaised;

            return (
              <Rect
                key={formatDateKey(date)}
                x={labelWidth + week * (cell + gap)}
                y={22 + day * (cell + gap)}
                width={cell}
                height={cell}
                rx={Math.min(4, cell / 3)}
                fill={fill}
                opacity={future ? 0.45 : scheduled || done ? 1 : 0.58}
              />
            );
          })}
        </Svg>
      </View>

      <View style={styles.legend}>
        <Text style={[styles.legendText, { color: theme.textTertiary }]}>
          A little
        </Text>
        <View
          style={[styles.legendSquare, { backgroundColor: theme.backgroundRaised }]}
        />
        <View
          style={[
            styles.legendSquare,
            { backgroundColor: `${habit.color}77` },
          ]}
        />
        <View
          style={[styles.legendSquare, { backgroundColor: habit.color }]}
        />
        <Text style={[styles.legendText, { color: theme.textTertiary }]}>
          A lot
        </Text>
      </View>
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
    alignItems: 'center',
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
  liveDot: {
    width: 11,
    height: 11,
    borderRadius: 6,
  },
  chartWrap: {
    marginTop: 19,
    alignItems: 'center',
    overflow: 'hidden',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 5,
    marginTop: 9,
  },
  legendText: {
    fontFamily: fonts.medium,
    fontSize: 9,
    marginHorizontal: 2,
  },
  legendSquare: {
    width: 9,
    height: 9,
    borderRadius: 3,
  },
});
