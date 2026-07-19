import * as Crypto from 'expo-crypto';

import { CheckIn, Habit, PersistedState } from '../types';
import { addDays, formatDateKey, isScheduled } from '../utils/dates';

function makeHabit(
  index: number,
  id: string,
  input: Pick<Habit, 'name' | 'icon' | 'color' | 'frequency' | 'reminderTime'>,
): Habit {
  const createdAt = addDays(new Date(), -98 + index * 8).toISOString();
  return {
    id,
    ...input,
    createdAt,
    updatedAt: createdAt,
  };
}

function makeDemoCheckIns(habits: Habit[]): CheckIn[] {
  const today = new Date();
  today.setHours(9, 12, 0, 0);
  const checkIns: CheckIn[] = [];

  habits.forEach((habit, habitIndex) => {
    for (let offset = 90; offset >= 0; offset -= 1) {
      const date = addDays(today, -offset);
      if (!isScheduled(habit, date)) {
        continue;
      }

      const isToday = offset === 0;
      const shouldComplete =
        habitIndex === 0
          ? offset < 9 || (offset + 3) % 13 !== 0
          : habitIndex === 1
            ? offset < 12 || (offset + 5) % 9 !== 0
            : !isToday && (offset < 4 || (offset + 1) % 4 !== 0);

      if (shouldComplete) {
        checkIns.push({
          id: Crypto.randomUUID(),
          habitId: habit.id,
          date: formatDateKey(date),
          completedAt: date.toISOString(),
        });
      }
    }
  });

  return checkIns;
}

export function createDemoState(): PersistedState {
  const habitIds = [
    Crypto.randomUUID(),
    Crypto.randomUUID(),
    Crypto.randomUUID(),
  ];
  const habits: Habit[] = [
    makeHabit(0, habitIds[0], {
      name: 'Morning sunlight',
      icon: '☀️',
      color: '#F3A96B',
      frequency: { type: 'daily' },
      reminderTime: '07:30',
    }),
    makeHabit(1, habitIds[1], {
      name: 'Deep work hour',
      icon: '✦',
      color: '#8FA7FF',
      frequency: { type: 'weekdays', days: [1, 2, 3, 4, 5] },
      reminderTime: '09:00',
    }),
    makeHabit(2, habitIds[2], {
      name: 'Read 20 pages',
      icon: '◒',
      color: '#7BC8A4',
      frequency: { type: 'daily' },
      reminderTime: '21:00',
    }),
  ];

  return {
    habits,
    checkIns: makeDemoCheckIns(habits),
    preferences: {
      theme: 'system',
      notificationsEnabled: false,
      hapticsEnabled: true,
    },
    outbox: [],
    hasSeenDemo: true,
  };
}
