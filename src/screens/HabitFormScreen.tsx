import Ionicons from '@expo/vector-icons/Ionicons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { AppScreen } from '../components/AppScreen';
import { StackHeader } from '../components/StackHeader';
import { Toggle } from '../components/Toggle';
import { useApp } from '../context/AppContext';
import { RootStackParamList } from '../navigation/types';
import { fonts, habitColors, radii } from '../theme';
import { Frequency, HabitDraft } from '../types';
import { formatTimeLabel, shiftTime, weekdayLetters } from '../utils/dates';

type Props = NativeStackScreenProps<RootStackParamList, 'HabitForm'>;

const icons = [
  '☀️',
  '✦',
  '◒',
  '🌿',
  '💧',
  '⚡',
  '📚',
  '🧘',
  '🎨',
  '🏃',
  '🥑',
  '🫶',
  '🎸',
  '🧠',
  '🌙',
  '✍️',
];

const timePresets: { label: string; value: string }[] = [
  { label: 'Morning', value: '07:00' },
  { label: 'Midday', value: '12:00' },
  { label: 'Evening', value: '18:00' },
  { label: 'Night', value: '21:00' },
];

function FieldLabel({
  step,
  title,
  color,
  muted,
}: {
  step: string;
  title: string;
  color: string;
  muted: string;
}) {
  return (
    <View style={styles.fieldLabel}>
      <Text style={[styles.step, { color: muted }]}>{step}</Text>
      <Text style={[styles.label, { color }]}>{title}</Text>
    </View>
  );
}

export function HabitFormScreen({ route, navigation }: Props) {
  const {
    habits,
    theme,
    preferences,
    addHabit,
    updateHabit,
  } = useApp();
  const editingHabit = useMemo(
    () => habits.find((habit) => habit.id === route.params?.habitId),
    [habits, route.params?.habitId],
  );
  const [name, setName] = useState(editingHabit?.name ?? '');
  const [icon, setIcon] = useState(editingHabit?.icon ?? '🌿');
  const [color, setColor] = useState(editingHabit?.color ?? habitColors[1]);
  const [frequency, setFrequency] = useState<Frequency>(
    editingHabit?.frequency ?? { type: 'daily' },
  );
  const [reminderTime, setReminderTime] = useState<string | null>(
    editingHabit?.reminderTime ?? null,
  );
  const [error, setError] = useState('');

  const chooseFrequency = (type: Frequency['type']) => {
    setFrequency(
      type === 'daily'
        ? { type: 'daily' }
        : {
            type: 'weekdays',
            days:
              frequency.type === 'weekdays'
                ? frequency.days
                : [1, 2, 3, 4, 5],
          },
    );
  };

  const toggleWeekday = (day: number) => {
    setFrequency((current) => {
      if (current.type !== 'weekdays') return current;
      const days = current.days.includes(day)
        ? current.days.filter((item) => item !== day)
        : [...current.days, day].sort();
      return { type: 'weekdays', days };
    });
  };

  const save = () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Give this habit a name you'll recognize.");
      return;
    }
    if (frequency.type === 'weekdays' && frequency.days.length === 0) {
      setError('Choose at least one day for this rhythm.');
      return;
    }

    const draft: HabitDraft = {
      name: trimmedName,
      icon,
      color,
      frequency,
      reminderTime,
    };
    if (preferences.hapticsEnabled) {
      void Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success,
      );
    }

    if (editingHabit) {
      updateHabit(editingHabit.id, draft);
      navigation.goBack();
    } else {
      const id = addHabit(draft);
      navigation.replace('HabitDetail', { habitId: id });
    }
  };

  return (
    <AppScreen edges={['top', 'left', 'right', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <StackHeader
          title={editingHabit ? 'Tune your habit' : 'Plant a habit'}
          eyebrow={editingHabit ? 'Edit ritual' : 'New ritual'}
          onBack={navigation.goBack}
          right={
            <View
              style={[
                styles.headerIcon,
                { backgroundColor: `${color}${theme.isDark ? '32' : '28'}` },
              ]}
            >
              <Text style={styles.headerEmoji}>{icon}</Text>
            </View>
          }
        />

        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
        >
          <Animated.View
            entering={FadeInDown.duration(440)}
            style={[
              styles.preview,
              {
                backgroundColor: `${color}${theme.isDark ? '24' : '20'}`,
                borderColor: `${color}78`,
              },
            ]}
          >
            <View style={[styles.previewIcon, { backgroundColor: color }]}>
              <Text style={styles.previewEmoji}>{icon}</Text>
            </View>
            <View style={styles.previewCopy}>
              <Text style={[styles.previewEyebrow, { color: theme.textSecondary }]}>
                A PROMISE TO YOURSELF
              </Text>
              <Text
                numberOfLines={1}
                style={[styles.previewName, { color: theme.text }]}
              >
                {name.trim() || 'Name your new rhythm'}
              </Text>
            </View>
            <View
              style={[
                styles.previewCheck,
                { borderColor: `${color}AA`, backgroundColor: theme.surface },
              ]}
            >
              <Ionicons name="checkmark" size={19} color={color} />
            </View>
          </Animated.View>

          <View style={styles.section}>
            <FieldLabel
              step="01"
              title="What are you practicing?"
              color={theme.text}
              muted={theme.textTertiary}
            />
            <TextInput
              autoFocus={!editingHabit}
              maxLength={42}
              onChangeText={(value) => {
                setName(value);
                setError('');
              }}
              placeholder="e.g. Walk after lunch"
              placeholderTextColor={theme.textTertiary}
              selectionColor={color}
              value={name}
              style={[
                styles.nameInput,
                {
                  backgroundColor: theme.surface,
                  borderColor: error && !name.trim() ? theme.danger : theme.border,
                  color: theme.text,
                },
              ]}
            />
            <Text style={[styles.counter, { color: theme.textTertiary }]}>
              {name.length}/42
            </Text>
          </View>

          <View style={styles.section}>
            <FieldLabel
              step="02"
              title="Give it a symbol"
              color={theme.text}
              muted={theme.textTertiary}
            />
            <View style={styles.iconGrid}>
              {icons.map((item) => {
                const selected = item === icon;
                return (
                  <Pressable
                    accessibilityLabel={`Use ${item} icon`}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    key={item}
                    onPress={() => setIcon(item)}
                    style={({ pressed }) => [
                      styles.iconChoice,
                      {
                        backgroundColor: selected
                          ? `${color}${theme.isDark ? '35' : '28'}`
                          : theme.surface,
                        borderColor: selected ? color : theme.border,
                        opacity: pressed ? 0.65 : 1,
                      },
                    ]}
                  >
                    <Text style={styles.choiceEmoji}>{item}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.section}>
            <FieldLabel
              step="03"
              title="Choose its energy"
              color={theme.text}
              muted={theme.textTertiary}
            />
            <View style={styles.colorRow}>
              {habitColors.map((item) => {
                const selected = item === color;
                return (
                  <Pressable
                    accessibilityLabel={`Use color ${item}`}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    key={item}
                    onPress={() => setColor(item)}
                    style={[
                      styles.colorOuter,
                      {
                        borderColor: selected ? theme.text : 'transparent',
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.colorChoice,
                        { backgroundColor: item },
                      ]}
                    >
                      {selected ? (
                        <Ionicons
                          name="checkmark"
                          size={18}
                          color={theme.black}
                        />
                      ) : null}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.section}>
            <FieldLabel
              step="04"
              title="Set a rhythm"
              color={theme.text}
              muted={theme.textTertiary}
            />
            <View
              style={[
                styles.segmented,
                { backgroundColor: theme.backgroundRaised },
              ]}
            >
              {(['daily', 'weekdays'] as const).map((type) => {
                const selected = frequency.type === type;
                return (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    key={type}
                    onPress={() => chooseFrequency(type)}
                    style={[
                      styles.segment,
                      {
                        backgroundColor: selected
                          ? theme.surfaceStrong
                          : 'transparent',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.segmentText,
                        {
                          color: selected
                            ? theme.text
                            : theme.textSecondary,
                        },
                      ]}
                    >
                      {type === 'daily' ? 'Every day' : 'Specific days'}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {frequency.type === 'weekdays' ? (
              <Animated.View
                entering={FadeInDown.duration(280)}
                style={styles.weekdays}
              >
                {weekdayLetters.map((letter, day) => {
                  const selected = frequency.days.includes(day);
                  return (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      key={`${letter}-${day}`}
                      onPress={() => toggleWeekday(day)}
                      style={[
                        styles.weekday,
                        {
                          backgroundColor: selected ? color : theme.surface,
                          borderColor: selected ? color : theme.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.weekdayText,
                          {
                            color: selected ? theme.black : theme.textSecondary,
                          },
                        ]}
                      >
                        {letter}
                      </Text>
                    </Pressable>
                  );
                })}
              </Animated.View>
            ) : null}
          </View>

          <View style={styles.section}>
            <View
              style={[
                styles.reminderCard,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <View
                style={[
                  styles.reminderIcon,
                  { backgroundColor: `${color}${theme.isDark ? '32' : '24'}` },
                ]}
              >
                <Ionicons name="notifications-outline" size={21} color={color} />
              </View>
              <View style={styles.reminderCopy}>
                <Text style={[styles.reminderTitle, { color: theme.text }]}>
                  Gentle reminder
                </Text>
                <Text
                  style={[styles.reminderBody, { color: theme.textSecondary }]}
                >
                  Optional, never nagging
                </Text>
              </View>
              <Toggle
                accessibilityLabel="Gentle reminder"
                activeColor={color}
                value={reminderTime !== null}
                onValueChange={(enabled) =>
                  setReminderTime(enabled ? reminderTime ?? '08:00' : null)
                }
              />
            </View>
            {reminderTime !== null ? (
              <Animated.View
                entering={FadeInDown.duration(280)}
                style={styles.reminderControls}
              >
                <View style={styles.presetRow}>
                  {timePresets.map((preset) => {
                    const selected = reminderTime === preset.value;
                    return (
                      <Pressable
                        accessibilityLabel={`Remind in the ${preset.label.toLowerCase()}`}
                        accessibilityRole="button"
                        accessibilityState={{ selected }}
                        key={preset.value}
                        onPress={() => setReminderTime(preset.value)}
                        style={[
                          styles.presetChip,
                          {
                            backgroundColor: selected
                              ? `${color}${theme.isDark ? '35' : '24'}`
                              : theme.surface,
                            borderColor: selected ? color : theme.border,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.presetText,
                            {
                              color: selected ? theme.text : theme.textSecondary,
                            },
                          ]}
                        >
                          {preset.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                <View
                  style={[
                    styles.stepper,
                    { backgroundColor: theme.surface, borderColor: theme.border },
                  ]}
                >
                  <Pressable
                    accessibilityLabel="Fifteen minutes earlier"
                    accessibilityRole="button"
                    hitSlop={8}
                    onPress={() => setReminderTime(shiftTime(reminderTime, -15))}
                    style={({ pressed }) => [
                      styles.stepButton,
                      {
                        backgroundColor: theme.backgroundRaised,
                        opacity: pressed ? 0.55 : 1,
                      },
                    ]}
                  >
                    <Ionicons name="remove" size={20} color={theme.text} />
                  </Pressable>
                  <View style={styles.stepValue}>
                    <Text style={[styles.stepTime, { color: theme.text }]}>
                      {formatTimeLabel(reminderTime)}
                    </Text>
                    <Text style={[styles.stepHint, { color: theme.textTertiary }]}>
                      Tap to adjust by 15 min
                    </Text>
                  </View>
                  <Pressable
                    accessibilityLabel="Fifteen minutes later"
                    accessibilityRole="button"
                    hitSlop={8}
                    onPress={() => setReminderTime(shiftTime(reminderTime, 15))}
                    style={({ pressed }) => [
                      styles.stepButton,
                      {
                        backgroundColor: theme.backgroundRaised,
                        opacity: pressed ? 0.55 : 1,
                      },
                    ]}
                  >
                    <Ionicons name="add" size={20} color={theme.text} />
                  </Pressable>
                </View>
              </Animated.View>
            ) : null}
          </View>

          {error ? (
            <Text style={[styles.error, { color: theme.danger }]}>{error}</Text>
          ) : null}

          <Pressable
            accessibilityRole="button"
            onPress={save}
            style={({ pressed }) => [
              styles.saveButton,
              {
                backgroundColor: theme.text,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <Text style={[styles.saveText, { color: theme.background }]}>
              {editingHabit ? 'Save the changes' : 'Make this promise'}
            </Text>
            <View
              style={[styles.saveArrow, { backgroundColor: theme.accent }]}
            >
              <Ionicons name="arrow-forward" size={18} color={theme.accentText} />
            </View>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  headerIcon: {
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerEmoji: {
    fontSize: 21,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 36,
  },
  preview: {
    minHeight: 112,
    borderWidth: 1,
    borderRadius: radii.xl,
    padding: 17,
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewIcon: {
    width: 58,
    height: 58,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-3deg' }],
  },
  previewEmoji: {
    fontSize: 27,
  },
  previewCopy: {
    flex: 1,
    paddingHorizontal: 14,
  },
  previewEyebrow: {
    fontFamily: fonts.bold,
    fontSize: 8.5,
    letterSpacing: 1.2,
  },
  previewName: {
    fontFamily: fonts.displaySemiBold,
    fontSize: 19,
    letterSpacing: -0.5,
    marginTop: 3,
  },
  previewCheck: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    marginTop: 30,
  },
  fieldLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 13,
  },
  step: {
    fontFamily: fonts.bold,
    fontSize: 9,
    letterSpacing: 1.3,
  },
  label: {
    fontFamily: fonts.displaySemiBold,
    fontSize: 20,
    letterSpacing: -0.45,
  },
  nameInput: {
    height: 58,
    borderRadius: radii.md,
    borderWidth: 1,
    paddingHorizontal: 17,
    fontFamily: fonts.semiBold,
    fontSize: 16,
  },
  counter: {
    fontFamily: fonts.medium,
    fontSize: 9,
    textAlign: 'right',
    marginTop: 6,
    marginRight: 4,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
  },
  iconChoice: {
    width: '22.7%',
    aspectRatio: 1.3,
    borderWidth: 1,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceEmoji: {
    fontSize: 24,
  },
  colorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  colorOuter: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorChoice: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmented: {
    height: 52,
    borderRadius: 17,
    padding: 4,
    flexDirection: 'row',
  },
  segment: {
    flex: 1,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentText: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
  },
  weekdays: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  weekday: {
    width: 40,
    height: 40,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekdayText: {
    fontFamily: fonts.bold,
    fontSize: 11,
  },
  reminderCard: {
    borderWidth: 1,
    borderRadius: radii.lg,
    minHeight: 82,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  reminderIcon: {
    width: 44,
    height: 44,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reminderCopy: {
    flex: 1,
    marginLeft: 12,
  },
  reminderTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
  },
  reminderBody: {
    fontFamily: fonts.regular,
    fontSize: 10.5,
    marginTop: 3,
  },
  reminderControls: {
    marginTop: 12,
    gap: 10,
  },
  presetRow: {
    flexDirection: 'row',
    gap: 8,
  },
  presetChip: {
    flex: 1,
    height: 40,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetText: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
  },
  stepper: {
    height: 62,
    borderRadius: radii.md,
    borderWidth: 1,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepValue: {
    flex: 1,
    alignItems: 'center',
  },
  stepTime: {
    fontFamily: fonts.bold,
    fontSize: 18,
    letterSpacing: -0.3,
  },
  stepHint: {
    fontFamily: fonts.medium,
    fontSize: 9.5,
    marginTop: 2,
  },
  error: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 22,
  },
  saveButton: {
    height: 62,
    borderRadius: radii.pill,
    marginTop: 30,
    paddingLeft: 22,
    paddingRight: 7,
    flexDirection: 'row',
    alignItems: 'center',
  },
  saveText: {
    flex: 1,
    fontFamily: fonts.bold,
    fontSize: 14,
    textAlign: 'center',
    marginLeft: 42,
  },
  saveArrow: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
