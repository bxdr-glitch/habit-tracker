import NetInfo from '@react-native-community/netinfo';
import * as Crypto from 'expo-crypto';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Platform, useColorScheme } from 'react-native';

import { createDemoState } from '../data/seed';
import { syncHabitReminders } from '../services/notifications';
import { loadState, saveState } from '../services/storage';
import {
  isSupabaseConfigured,
  syncWithSupabase,
} from '../services/supabase';
import { resolveTheme, Theme } from '../theme';
import {
  CheckIn,
  Habit,
  HabitDraft,
  PendingMutation,
  PersistedState,
  Preferences,
  SyncStatus,
} from '../types';
import { formatDateKey } from '../utils/dates';

type AppContextValue = {
  habits: Habit[];
  checkIns: CheckIn[];
  preferences: Preferences;
  theme: Theme;
  isLoading: boolean;
  syncStatus: SyncStatus;
  isCloudEnabled: boolean;
  addHabit: (draft: HabitDraft) => string;
  updateHabit: (id: string, draft: HabitDraft) => void;
  deleteHabit: (id: string) => void;
  toggleCheckIn: (habitId: string) => boolean;
  updatePreferences: (updates: Partial<Preferences>) => void;
  refresh: () => Promise<void>;
  exportCsv: () => Promise<void>;
  clearAllData: () => void;
  restoreDemoData: () => void;
};

const AppContext = createContext<AppContextValue | null>(null);

const defaultPreferences: Preferences = {
  theme: 'system',
  notificationsEnabled: false,
  hapticsEnabled: true,
};

function makeMutation(
  type: PendingMutation['type'],
  payload: PendingMutation['payload'],
): PendingMutation {
  return {
    id: Crypto.randomUUID(),
    type,
    payload,
    createdAt: new Date().toISOString(),
  };
}

function csvCell(value: unknown): string {
  const text = String(value ?? '');
  return `"${text.replace(/"/g, '""')}"`;
}

function buildCsv(habits: Habit[], checkIns: CheckIn[]): string {
  const header = [
    'habit_id',
    'habit_name',
    'icon',
    'color',
    'frequency',
    'date',
    'completed_at',
  ];
  const rows = habits.flatMap((habit) => {
    const habitCheckIns = checkIns.filter(
      (checkIn) => checkIn.habitId === habit.id,
    );
    const base = [
      habit.id,
      habit.name,
      habit.icon,
      habit.color,
      JSON.stringify(habit.frequency),
    ];

    if (habitCheckIns.length === 0) {
      return [[...base, '', '']];
    }

    return habitCheckIns.map((checkIn) => [
      ...base,
      checkIn.date,
      checkIn.completedAt,
    ]);
  });

  return [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\n');
}

export function AppProvider({ children }: PropsWithChildren) {
  const systemScheme = useColorScheme();
  const [state, setState] = useState<PersistedState | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(
    isSupabaseConfigured ? 'offline' : 'local',
  );
  const stateRef = useRef<PersistedState | null>(null);
  const syncingRef = useRef(false);
  const syncNowRef = useRef<() => Promise<void>>(async () => undefined);

  useEffect(() => {
    let active = true;
    void loadState().then((stored) => {
      if (active) {
        stateRef.current = stored;
        setState(stored);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    stateRef.current = state;
    if (state) {
      void saveState(state);
    }
  }, [state]);

  const syncNow = useCallback(async () => {
    if (!isSupabaseConfigured || !stateRef.current || syncingRef.current) {
      return;
    }

    syncingRef.current = true;
    setSyncStatus('syncing');
    try {
      const synced = await syncWithSupabase(stateRef.current);
      stateRef.current = synced;
      setState(synced);
      setSyncStatus('synced');
    } catch {
      setSyncStatus('error');
    } finally {
      syncingRef.current = false;
    }
  }, []);

  syncNowRef.current = syncNow;

  useEffect(() => {
    if (state && state.outbox.length > 0) {
      void syncNowRef.current();
    }
  }, [state?.outbox.length]);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((network) => {
      if (network.isConnected) {
        void syncNowRef.current();
      } else if (isSupabaseConfigured) {
        setSyncStatus('offline');
      }
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!state) return;
    void syncHabitReminders(
      state.habits,
      state.preferences.notificationsEnabled,
    )
      .then((scheduled) => {
        if (!scheduled && state.preferences.notificationsEnabled) {
          setState((current) =>
            current
              ? {
                  ...current,
                  preferences: {
                    ...current.preferences,
                    notificationsEnabled: false,
                  },
                }
              : current,
          );
        }
      })
      .catch(() => {
        if (!state.preferences.notificationsEnabled) return;
        setState((current) =>
          current
            ? {
                ...current,
                preferences: {
                  ...current.preferences,
                  notificationsEnabled: false,
                },
              }
            : current,
        );
      });
  }, [state?.habits, state?.preferences.notificationsEnabled]);

  const addHabit = useCallback((draft: HabitDraft) => {
    const id = Crypto.randomUUID();
    const now = new Date().toISOString();
    const habit: Habit = {
      id,
      ...draft,
      createdAt: now,
      updatedAt: now,
    };

    setState((current) =>
      current
        ? {
            ...current,
            habits: [...current.habits, habit],
            outbox: [
              ...current.outbox,
              makeMutation('upsert_habit', habit),
            ],
          }
        : current,
    );
    void syncNowRef.current();
    return id;
  }, []);

  const updateHabit = useCallback((id: string, draft: HabitDraft) => {
    setState((current) => {
      if (!current) return current;
      const existing = current.habits.find((habit) => habit.id === id);
      if (!existing) return current;

      const habit: Habit = {
        ...existing,
        ...draft,
        updatedAt: new Date().toISOString(),
      };
      return {
        ...current,
        habits: current.habits.map((item) => (item.id === id ? habit : item)),
        outbox: [...current.outbox, makeMutation('upsert_habit', habit)],
      };
    });
    void syncNowRef.current();
  }, []);

  const deleteHabit = useCallback((id: string) => {
    setState((current) => {
      if (!current) return current;
      const cleanedOutbox = current.outbox.filter((mutation) => {
        if (
          mutation.type === 'upsert_habit' &&
          mutation.payload.id === id
        ) {
          return false;
        }
        return !(
          'habitId' in mutation.payload && mutation.payload.habitId === id
        );
      });

      return {
        ...current,
        habits: current.habits.filter((habit) => habit.id !== id),
        checkIns: current.checkIns.filter(
          (checkIn) => checkIn.habitId !== id,
        ),
        outbox: [
          ...cleanedOutbox,
          makeMutation('delete_habit', { id }),
        ],
      };
    });
    void syncNowRef.current();
  }, []);

  const toggleCheckIn = useCallback((habitId: string): boolean => {
    const date = formatDateKey(new Date());
    const existing = stateRef.current?.checkIns.find(
      (checkIn) => checkIn.habitId === habitId && checkIn.date === date,
    );

    if (existing) {
      setState((current) =>
        current
          ? {
              ...current,
              checkIns: current.checkIns.filter(
                (checkIn) => checkIn.id !== existing.id,
              ),
              outbox: [
                ...current.outbox,
                makeMutation('delete_check_in', { id: existing.id }),
              ],
            }
          : current,
      );
      void syncNowRef.current();
      return false;
    }

    const checkIn: CheckIn = {
      id: Crypto.randomUUID(),
      habitId,
      date,
      completedAt: new Date().toISOString(),
    };
    setState((current) =>
      current
        ? {
            ...current,
            checkIns: [...current.checkIns, checkIn],
            outbox: [
              ...current.outbox,
              makeMutation('upsert_check_in', checkIn),
            ],
          }
        : current,
    );
    void syncNowRef.current();
    return true;
  }, []);

  const updatePreferences = useCallback((updates: Partial<Preferences>) => {
    setState((current) =>
      current
        ? {
            ...current,
            preferences: { ...current.preferences, ...updates },
          }
        : current,
    );
  }, []);

  const refresh = useCallback(async () => {
    const minimumDelay = new Promise((resolve) => setTimeout(resolve, 650));
    await Promise.all([minimumDelay, syncNow()]);
  }, [syncNow]);

  const exportCsv = useCallback(async () => {
    const current = stateRef.current;
    if (!current) return;
    const csv = buildCsv(current.habits, current.checkIns);
    const filename = `steady-habits-${formatDateKey(new Date())}.csv`;

    if (Platform.OS === 'web') {
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = filename;
      anchor.click();
      URL.revokeObjectURL(objectUrl);
      return;
    }

    const file = new File(Paths.cache, filename);
    file.create({ overwrite: true });
    file.write(csv);
    await Sharing.shareAsync(file.uri, {
      mimeType: 'text/csv',
      dialogTitle: 'Export your Steady data',
      UTI: 'public.comma-separated-values-text',
    });
  }, []);

  const clearAllData = useCallback(() => {
    setState((current) => {
      if (!current) return current;
      return {
        ...current,
        habits: [],
        checkIns: [],
        outbox: [
          ...current.outbox,
          ...current.habits.map((habit) =>
            makeMutation('delete_habit', { id: habit.id }),
          ),
        ],
        hasSeenDemo: true,
      };
    });
    void syncNowRef.current();
  }, []);

  const restoreDemoData = useCallback(() => {
    const demo = createDemoState();
    setState((current) => ({
      ...demo,
      preferences: current?.preferences ?? demo.preferences,
      outbox: [
        ...(current?.habits ?? []).map((habit) =>
          makeMutation('delete_habit', { id: habit.id }),
        ),
        ...demo.habits.map((habit) =>
          makeMutation('upsert_habit', habit),
        ),
        ...demo.checkIns.map((checkIn) =>
          makeMutation('upsert_check_in', checkIn),
        ),
      ],
    }));
    void syncNowRef.current();
  }, []);

  const preferences = state?.preferences ?? defaultPreferences;
  const theme = resolveTheme(preferences.theme, systemScheme);

  const value = useMemo<AppContextValue>(
    () => ({
      habits: state?.habits ?? [],
      checkIns: state?.checkIns ?? [],
      preferences,
      theme,
      isLoading: !state,
      syncStatus,
      isCloudEnabled: isSupabaseConfigured,
      addHabit,
      updateHabit,
      deleteHabit,
      toggleCheckIn,
      updatePreferences,
      refresh,
      exportCsv,
      clearAllData,
      restoreDemoData,
    }),
    [
      state,
      preferences,
      theme,
      syncStatus,
      addHabit,
      updateHabit,
      deleteHabit,
      toggleCheckIn,
      updatePreferences,
      refresh,
      exportCsv,
      clearAllData,
      restoreDemoData,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const value = useContext(AppContext);
  if (!value) {
    throw new Error('useApp must be used inside AppProvider.');
  }
  return value;
}
