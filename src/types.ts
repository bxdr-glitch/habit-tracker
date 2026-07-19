export type Frequency =
  | { type: 'daily' }
  | { type: 'weekdays'; days: number[] };

export type Habit = {
  id: string;
  name: string;
  icon: string;
  color: string;
  frequency: Frequency;
  reminderTime: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CheckIn = {
  id: string;
  habitId: string;
  date: string;
  completedAt: string;
};

export type ThemePreference = 'system' | 'light' | 'dark';

export type Preferences = {
  theme: ThemePreference;
  notificationsEnabled: boolean;
  hapticsEnabled: boolean;
};

export type MutationType =
  | 'upsert_habit'
  | 'delete_habit'
  | 'upsert_check_in'
  | 'delete_check_in';

export type PendingMutation = {
  id: string;
  type: MutationType;
  payload: Habit | CheckIn | { id: string };
  createdAt: string;
};

export type PersistedState = {
  habits: Habit[];
  checkIns: CheckIn[];
  preferences: Preferences;
  outbox: PendingMutation[];
  hasSeenDemo: boolean;
};

export type SyncStatus = 'local' | 'syncing' | 'synced' | 'offline' | 'error';

export type HabitDraft = {
  name: string;
  icon: string;
  color: string;
  frequency: Frequency;
  reminderTime: string | null;
};
