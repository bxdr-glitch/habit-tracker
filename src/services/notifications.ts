import { Platform } from 'react-native';

import { Habit } from '../types';

type NotificationsModule = typeof import('expo-notifications');

let notificationsModule: NotificationsModule | null = null;
let handlerReady = false;

async function getNotifications(): Promise<NotificationsModule> {
  if (!notificationsModule) {
    notificationsModule = await import('expo-notifications');
  }
  if (!handlerReady) {
    notificationsModule.setNotificationHandler({
      handleNotification: async () => ({
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
    handlerReady = true;
  }
  return notificationsModule;
}

async function prepareNotifications(
  Notifications: NotificationsModule,
): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  let status = current.status;

  if (status !== 'granted') {
    const requested = await Notifications.requestPermissionsAsync();
    status = requested.status;
  }

  if (status !== 'granted') {
    return false;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('habit-reminders', {
      name: 'Habit reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 180, 90, 180],
      lightColor: '#C9F04A',
    });
  }

  return true;
}

export async function syncHabitReminders(
  habits: Habit[],
  enabled: boolean,
): Promise<boolean> {
  if (Platform.OS === 'web') {
    return !enabled;
  }

  const Notifications = await getNotifications();
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!enabled) {
    return true;
  }

  const allowed = await prepareNotifications(Notifications);
  if (!allowed) {
    return false;
  }

  for (const habit of habits) {
    if (!habit.reminderTime) continue;

    const [hour, minute] = habit.reminderTime.split(':').map(Number);
    const content: import('expo-notifications').NotificationContentInput = {
      title: `${habit.icon} A small promise`,
      body: `Ready for "${habit.name}"?`,
      sound: true,
      data: { habitId: habit.id },
    };

    if (habit.frequency.type === 'daily') {
      await Notifications.scheduleNotificationAsync({
        content,
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute,
          channelId: 'habit-reminders',
        },
      });
      continue;
    }

    for (const day of habit.frequency.days) {
      await Notifications.scheduleNotificationAsync({
        content,
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday: day + 1,
          hour,
          minute,
          channelId: 'habit-reminders',
        },
      });
    }
  }

  return true;
}
