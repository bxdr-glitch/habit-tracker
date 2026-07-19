import AsyncStorage from '@react-native-async-storage/async-storage';

import { createDemoState } from '../data/seed';
import { PersistedState } from '../types';

const STORAGE_KEY = '@steady/state/v1';

export async function loadState(): Promise<PersistedState> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return createDemoState();
  }

  try {
    const parsed = JSON.parse(raw) as Partial<PersistedState>;
    return {
      habits: parsed.habits ?? [],
      checkIns: parsed.checkIns ?? [],
      preferences: {
        theme: parsed.preferences?.theme ?? 'system',
        notificationsEnabled:
          parsed.preferences?.notificationsEnabled ?? false,
        hapticsEnabled: parsed.preferences?.hapticsEnabled ?? true,
      },
      outbox: parsed.outbox ?? [],
      hasSeenDemo: parsed.hasSeenDemo ?? true,
    };
  } catch {
    return createDemoState();
  }
}

export async function saveState(state: PersistedState): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
