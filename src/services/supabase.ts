import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

import {
  CheckIn,
  Frequency,
  Habit,
  PendingMutation,
  PersistedState,
} from '../types';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

let client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (!url || !anonKey) {
    throw new Error('Supabase is not configured.');
  }

  if (!client) {
    client = createClient(url, anonKey, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
  }

  return client;
}

async function ensureUser(supabase: SupabaseClient): Promise<User> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.user) {
    return session.user;
  }

  const { data, error } = await supabase.auth.signInAnonymously();
  if (error || !data.user) {
    throw error ?? new Error('Anonymous Supabase sign-in failed.');
  }

  return data.user;
}

type HabitRow = {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  color: string;
  frequency: Frequency;
  reminder_time: string | null;
  created_at: string;
  updated_at: string;
};

type CheckInRow = {
  id: string;
  habit_id: string;
  date: string;
  completed_at: string;
};

function toHabitRow(habit: Habit, userId: string): HabitRow {
  return {
    id: habit.id,
    user_id: userId,
    name: habit.name,
    icon: habit.icon,
    color: habit.color,
    frequency: habit.frequency,
    reminder_time: habit.reminderTime,
    created_at: habit.createdAt,
    updated_at: habit.updatedAt,
  };
}

function fromHabitRow(row: HabitRow): Habit {
  return {
    id: row.id,
    name: row.name,
    icon: row.icon,
    color: row.color,
    frequency: row.frequency,
    reminderTime: row.reminder_time,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toCheckInRow(checkIn: CheckIn): CheckInRow {
  return {
    id: checkIn.id,
    habit_id: checkIn.habitId,
    date: checkIn.date,
    completed_at: checkIn.completedAt,
  };
}

function fromCheckInRow(row: CheckInRow): CheckIn {
  return {
    id: row.id,
    habitId: row.habit_id,
    date: row.date,
    completedAt: row.completed_at,
  };
}

async function flushMutation(
  supabase: SupabaseClient,
  user: User,
  mutation: PendingMutation,
): Promise<void> {
  if (mutation.type === 'upsert_habit') {
    const { error } = await supabase
      .from('habits')
      .upsert(toHabitRow(mutation.payload as Habit, user.id));
    if (error) throw error;
    return;
  }

  if (mutation.type === 'delete_habit') {
    const { error } = await supabase
      .from('habits')
      .delete()
      .eq('id', mutation.payload.id)
      .eq('user_id', user.id);
    if (error) throw error;
    return;
  }

  if (mutation.type === 'upsert_check_in') {
    const { error } = await supabase
      .from('check_ins')
      .upsert(toCheckInRow(mutation.payload as CheckIn), {
        onConflict: 'habit_id,date',
      });
    if (error) throw error;
    return;
  }

  const { error } = await supabase
    .from('check_ins')
    .delete()
    .eq('id', mutation.payload.id);
  if (error) throw error;
}

export async function syncWithSupabase(
  state: PersistedState,
): Promise<PersistedState> {
  const supabase = getClient();
  const user = await ensureUser(supabase);

  for (const mutation of state.outbox) {
    await flushMutation(supabase, user, mutation);
  }

  if (state.habits.length > 0) {
    const { error } = await supabase
      .from('habits')
      .upsert(state.habits.map((habit) => toHabitRow(habit, user.id)));
    if (error) throw error;
  }

  if (state.checkIns.length > 0) {
    const { error } = await supabase
      .from('check_ins')
      .upsert(state.checkIns.map(toCheckInRow), {
        onConflict: 'habit_id,date',
      });
    if (error) throw error;
  }

  const { data: habitRows, error: habitError } = await supabase
    .from('habits')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true });
  if (habitError) throw habitError;

  const habits = ((habitRows ?? []) as HabitRow[]).map(fromHabitRow);
  if (habits.length === 0) {
    return { ...state, habits: [], checkIns: [], outbox: [] };
  }

  const { data: checkInRows, error: checkInError } = await supabase
    .from('check_ins')
    .select('*')
    .in(
      'habit_id',
      habits.map((habit) => habit.id),
    );
  if (checkInError) throw checkInError;

  return {
    ...state,
    habits,
    checkIns: ((checkInRows ?? []) as CheckInRow[]).map(fromCheckInRow),
    outbox: [],
  };
}
