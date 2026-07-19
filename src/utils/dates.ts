import { CheckIn, Habit } from '../types';

const DAY_MS = 24 * 60 * 60 * 1000;

export const weekdayLetters = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
export const weekdayNames = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseDateKey(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function addDays(date: Date, amount: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

export function startOfWeek(date: Date): Date {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - start.getDay());
  return start;
}

export function isScheduled(habit: Habit, date: Date): boolean {
  return (
    habit.frequency.type === 'daily' ||
    habit.frequency.days.includes(date.getDay())
  );
}

export function hasCheckIn(
  habitId: string,
  date: Date,
  checkIns: CheckIn[],
): boolean {
  const key = formatDateKey(date);
  return checkIns.some(
    (checkIn) => checkIn.habitId === habitId && checkIn.date === key,
  );
}

export function getCurrentStreak(habit: Habit, checkIns: CheckIn[]): number {
  const completed = new Set(
    checkIns
      .filter((checkIn) => checkIn.habitId === habit.id)
      .map((checkIn) => checkIn.date),
  );
  const created = new Date(habit.createdAt);
  created.setHours(0, 0, 0, 0);
  let cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  if (isScheduled(habit, cursor) && !completed.has(formatDateKey(cursor))) {
    cursor = addDays(cursor, -1);
  }

  let streak = 0;
  while (cursor >= created) {
    if (isScheduled(habit, cursor)) {
      if (!completed.has(formatDateKey(cursor))) {
        break;
      }
      streak += 1;
    }
    cursor = addDays(cursor, -1);
  }

  return streak;
}

export function getLongestStreak(habit: Habit, checkIns: CheckIn[]): number {
  const completed = new Set(
    checkIns
      .filter((checkIn) => checkIn.habitId === habit.id)
      .map((checkIn) => checkIn.date),
  );
  const created = new Date(habit.createdAt);
  created.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let cursor = created;
  let running = 0;
  let longest = 0;

  while (cursor <= today) {
    if (isScheduled(habit, cursor)) {
      if (completed.has(formatDateKey(cursor))) {
        running += 1;
        longest = Math.max(longest, running);
      } else {
        running = 0;
      }
    }
    cursor = addDays(cursor, 1);
  }

  return longest;
}

export type WeeklyCompletion = {
  label: string;
  completed: number;
  scheduled: number;
  rate: number;
  start: Date;
};

export function getWeeklyCompletion(
  habit: Habit,
  checkIns: CheckIn[],
  weekCount = 8,
): WeeklyCompletion[] {
  const completed = new Set(
    checkIns
      .filter((checkIn) => checkIn.habitId === habit.id)
      .map((checkIn) => checkIn.date),
  );
  const currentWeek = startOfWeek(new Date());

  return Array.from({ length: weekCount }, (_, index) => {
    const start = addDays(currentWeek, (index - weekCount + 1) * 7);
    let scheduled = 0;
    let done = 0;

    for (let day = 0; day < 7; day += 1) {
      const date = addDays(start, day);
      if (date <= new Date() && isScheduled(habit, date)) {
        scheduled += 1;
        if (completed.has(formatDateKey(date))) {
          done += 1;
        }
      }
    }

    return {
      label: start.toLocaleDateString(undefined, { month: 'short' }).slice(0, 3),
      completed: done,
      scheduled,
      rate: scheduled === 0 ? 0 : done / scheduled,
      start,
    };
  });
}

export function getFrequencyLabel(habit: Habit): string {
  if (habit.frequency.type === 'daily') {
    return 'Every day';
  }

  const days = habit.frequency.days;
  if (days.length === 5 && [1, 2, 3, 4, 5].every((day) => days.includes(day))) {
    return 'Weekdays';
  }
  if (days.length === 2 && days.includes(0) && days.includes(6)) {
    return 'Weekends';
  }

  return days.map((day) => weekdayNames[day].slice(0, 3)).join(', ');
}

export function getTodayLabel(): string {
  return new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

export function formatTimeLabel(value: string): string {
  const [hourPart, minutePart] = value.split(':');
  const hour = Number(hourPart);
  const minute = Number(minutePart);
  const period = hour < 12 ? 'AM' : 'PM';
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:${String(minute).padStart(2, '0')} ${period}`;
}

export function shiftTime(value: string, minutes: number): string {
  const [hourPart, minutePart] = value.split(':');
  const total = (Number(hourPart) * 60 + Number(minutePart) + minutes + 1440) % 1440;
  const hour = Math.floor(total / 60);
  const minute = total % 60;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

export function isSameDay(left: Date, right: Date): boolean {
  return Math.abs(
    parseDateKey(formatDateKey(left)).getTime() -
      parseDateKey(formatDateKey(right)).getTime(),
  ) < DAY_MS;
}
