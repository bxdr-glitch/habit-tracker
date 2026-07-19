import Ionicons from '@expo/vector-icons/Ionicons';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { ReactNode, useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { AppScreen } from '../components/AppScreen';
import { Toggle } from '../components/Toggle';
import { useApp } from '../context/AppContext';
import { TabParamList } from '../navigation/types';
import { fonts, radii } from '../theme';
import { ThemePreference } from '../types';
import { openLink } from '../utils/links';

type Props = BottomTabScreenProps<TabParamList, 'Settings'>;

type SettingRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
  children: ReactNode;
};

function SettingRow({ icon, title, body, children }: SettingRowProps) {
  const { theme } = useApp();
  return (
    <View style={styles.settingRow}>
      <View
        style={[
          styles.settingIcon,
          { backgroundColor: theme.backgroundRaised },
        ]}
      >
        <Ionicons name={icon} size={19} color={theme.text} />
      </View>
      <View style={styles.settingCopy}>
        <Text style={[styles.settingTitle, { color: theme.text }]}>{title}</Text>
        <Text style={[styles.settingBody, { color: theme.textSecondary }]}>
          {body}
        </Text>
      </View>
      {children}
    </View>
  );
}

export function SettingsScreen(_: Props) {
  const {
    habits,
    checkIns,
    preferences,
    theme,
    syncStatus,
    isCloudEnabled,
    updatePreferences,
    exportCsv,
    clearAllData,
    restoreDemoData,
  } = useApp();
  const [exporting, setExporting] = useState(false);

  const setTheme = (preference: ThemePreference) => {
    updatePreferences({ theme: preference });
  };

  const toggleNotifications = (enabled: boolean) => {
    if (enabled && Platform.OS === 'web') {
      Alert.alert(
        'Reminders need a device',
        'Run Steady in Expo Go or a native build to schedule local reminders.',
      );
      return;
    }
    updatePreferences({ notificationsEnabled: enabled });
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportCsv();
    } catch {
      Alert.alert(
        'Export paused',
        'Your data is safe. Please try sharing the CSV again.',
      );
    } finally {
      setExporting(false);
    }
  };

  const confirmClear = () => {
    Alert.alert(
      'Clear every habit?',
      'This removes your habits and check-ins from this device.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear data',
          style: 'destructive',
          onPress: clearAllData,
        },
      ],
    );
  };

  const syncCopy = !isCloudEnabled
    ? 'Local-first mode'
    : syncStatus === 'synced'
      ? 'Cloud is up to date'
      : syncStatus === 'syncing'
        ? 'Syncing in the background'
        : syncStatus === 'error'
          ? 'Safe locally, cloud retry pending'
          : 'Available offline';

  return (
    <AppScreen>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(420)}>
          <Text style={[styles.eyebrow, { color: theme.textSecondary }]}>
            YOUR SPACE
          </Text>
          <Text style={[styles.heading, { color: theme.text }]}>
            Make it feel{'\n'}like yours.
          </Text>
          <Text style={[styles.intro, { color: theme.textSecondary }]}>
            Quiet controls for how Steady looks, feels, and keeps your data.
          </Text>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(80).duration(420)}
          style={[
            styles.syncCard,
            {
              backgroundColor: theme.text,
            },
            Platform.OS === 'web' ? undefined : { shadowColor: theme.shadow },
          ]}
        >
          <View
            style={[styles.syncIcon, { backgroundColor: theme.accent }]}
          >
            <Ionicons
              name={isCloudEnabled ? 'cloud-done-outline' : 'phone-portrait-outline'}
              size={21}
              color={theme.accentText}
            />
          </View>
          <View style={styles.syncCopy}>
            <Text style={[styles.syncTitle, { color: theme.background }]}>
              {syncCopy}
            </Text>
            <Text
              style={[
                styles.syncBody,
                { color: theme.isDark ? '#929C93' : '#BFC5BA' },
              ]}
            >
              {habits.length} habits · {checkIns.length} check-ins
            </Text>
          </View>
          <View
            style={[
              styles.syncDot,
              {
                backgroundColor:
                  syncStatus === 'error' ? theme.danger : theme.accent,
              },
            ]}
          />
        </Animated.View>

        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
          APPEARANCE
        </Text>
        <View
          style={[
            styles.card,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <View style={styles.appearanceHeading}>
            <View
              style={[
                styles.settingIcon,
                { backgroundColor: theme.backgroundRaised },
              ]}
            >
              <Ionicons name="contrast-outline" size={19} color={theme.text} />
            </View>
            <View>
              <Text style={[styles.settingTitle, { color: theme.text }]}>
                Color mode
              </Text>
              <Text
                style={[styles.settingBody, { color: theme.textSecondary }]}
              >
                System changes automatically
              </Text>
            </View>
          </View>
          <View
            style={[
              styles.themePicker,
              { backgroundColor: theme.backgroundRaised },
            ]}
          >
            {(
              [
                ['system', 'System', 'phone-portrait-outline'],
                ['light', 'Light', 'sunny-outline'],
                ['dark', 'Dark', 'moon-outline'],
              ] as const
            ).map(([value, label, icon]) => {
              const selected = preferences.theme === value;
              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  key={value}
                  onPress={() => setTheme(value)}
                  style={[
                    styles.themeOption,
                    {
                      backgroundColor: selected
                        ? theme.surfaceStrong
                        : 'transparent',
                      borderColor: selected ? theme.border : 'transparent',
                    },
                  ]}
                >
                  <Ionicons
                    name={icon}
                    size={16}
                    color={selected ? theme.text : theme.textTertiary}
                  />
                  <Text
                    style={[
                      styles.themeLabel,
                      {
                        color: selected ? theme.text : theme.textSecondary,
                      },
                    ]}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
          GENTLE NUDGES
        </Text>
        <View
          style={[
            styles.card,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <SettingRow
            icon="notifications-outline"
            title="Habit reminders"
            body="Only at the times you choose"
          >
            <Toggle
              accessibilityLabel="Habit reminders"
              value={preferences.notificationsEnabled}
              onValueChange={toggleNotifications}
            />
          </SettingRow>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <SettingRow
            icon="radio-outline"
            title="Tactile check-ins"
            body="A small tap when you show up"
          >
            <Toggle
              accessibilityLabel="Tactile check-ins"
              value={preferences.hapticsEnabled}
              onValueChange={(enabled) =>
                updatePreferences({ hapticsEnabled: enabled })
              }
            />
          </SettingRow>
        </View>

        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
          YOUR DATA
        </Text>
        <View
          style={[
            styles.card,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <Pressable
            accessibilityRole="button"
            onPress={handleExport}
            style={({ pressed }) => [
              styles.actionRow,
              { opacity: pressed ? 0.65 : 1 },
            ]}
          >
            <View
              style={[
                styles.settingIcon,
                { backgroundColor: `${theme.accent}28` },
              ]}
            >
              <Ionicons name="download-outline" size={20} color={theme.text} />
            </View>
            <View style={styles.settingCopy}>
              <Text style={[styles.settingTitle, { color: theme.text }]}>
                {exporting ? 'Preparing CSV...' : 'Export as CSV'}
              </Text>
              <Text
                style={[styles.settingBody, { color: theme.textSecondary }]}
              >
                Portable, readable, always yours
              </Text>
            </View>
            <Ionicons
              name="arrow-forward"
              size={19}
              color={theme.textSecondary}
            />
          </Pressable>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <Pressable
            accessibilityRole="button"
            onPress={restoreDemoData}
            style={({ pressed }) => [
              styles.actionRow,
              { opacity: pressed ? 0.65 : 1 },
            ]}
          >
            <View
              style={[
                styles.settingIcon,
                { backgroundColor: theme.backgroundRaised },
              ]}
            >
              <Ionicons name="sparkles-outline" size={20} color={theme.text} />
            </View>
            <View style={styles.settingCopy}>
              <Text style={[styles.settingTitle, { color: theme.text }]}>
                Restore demo garden
              </Text>
              <Text
                style={[styles.settingBody, { color: theme.textSecondary }]}
              >
                Bring back the sample habits
              </Text>
            </View>
            <Ionicons
              name="refresh"
              size={19}
              color={theme.textSecondary}
            />
          </Pressable>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <Pressable
            accessibilityRole="button"
            onPress={confirmClear}
            style={({ pressed }) => [
              styles.actionRow,
              { opacity: pressed ? 0.65 : 1 },
            ]}
          >
            <View
              style={[
                styles.settingIcon,
                { backgroundColor: theme.dangerSoft },
              ]}
            >
              <Ionicons name="trash-outline" size={20} color={theme.danger} />
            </View>
            <View style={styles.settingCopy}>
              <Text style={[styles.settingTitle, { color: theme.danger }]}>
                Clear all data
              </Text>
              <Text
                style={[styles.settingBody, { color: theme.textSecondary }]}
              >
                Start again with an empty plot
              </Text>
            </View>
          </Pressable>
        </View>

        <Pressable
          accessibilityRole="link"
          accessibilityLabel="Visit buildfast.us"
          onPress={() => void openLink('https://buildfast.us')}
          style={({ pressed }) => [
            styles.buildFast,
            {
              backgroundColor: theme.backgroundRaised,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <View style={styles.buildFastCopy}>
            <Text style={[styles.buildFastEyebrow, { color: theme.textSecondary }]}>
              A SMALL APP, BUILT WITH CARE
            </Text>
            <Text style={[styles.buildFastTitle, { color: theme.text }]}>
              Visit buildfast.us
            </Text>
          </View>
          <View style={[styles.buildFastIcon, { backgroundColor: theme.text }]}>
            <Ionicons name="open-outline" size={18} color={theme.background} />
          </View>
        </Pressable>

        <Text style={[styles.version, { color: theme.textTertiary }]}>
          Steady 1.0 · Made for the return, not the streak
        </Text>
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 27,
    paddingBottom: 135,
  },
  eyebrow: {
    fontFamily: fonts.bold,
    fontSize: 9.5,
    letterSpacing: 1.4,
  },
  heading: {
    fontFamily: fonts.display,
    fontSize: 39,
    lineHeight: 42,
    letterSpacing: -1.3,
    marginTop: 8,
  },
  intro: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 20,
    maxWidth: 315,
    marginTop: 12,
  },
  syncCard: {
    minHeight: 84,
    borderRadius: radii.lg,
    marginTop: 26,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    ...Platform.select({
      web: { boxShadow: '0 12px 22px rgba(5, 10, 6, 0.1)' },
      default: {
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.1,
        shadowRadius: 22,
        elevation: 3,
      },
    }),
  },
  syncIcon: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  syncCopy: {
    flex: 1,
    paddingHorizontal: 13,
  },
  syncTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 13.5,
  },
  syncBody: {
    fontFamily: fonts.medium,
    fontSize: 10,
    marginTop: 4,
  },
  syncDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  sectionLabel: {
    fontFamily: fonts.bold,
    fontSize: 9,
    letterSpacing: 1.4,
    marginTop: 30,
    marginBottom: 10,
    marginLeft: 3,
  },
  card: {
    borderRadius: radii.lg,
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  appearanceHeading: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingRow: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingCopy: {
    flex: 1,
    paddingHorizontal: 12,
  },
  settingTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 13.5,
  },
  settingBody: {
    fontFamily: fonts.regular,
    fontSize: 10.5,
    marginTop: 3,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 54,
  },
  themePicker: {
    height: 54,
    borderRadius: 17,
    padding: 4,
    flexDirection: 'row',
    marginBottom: 14,
  },
  themeOption: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  themeLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 10.5,
  },
  actionRow: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
  },
  buildFast: {
    minHeight: 80,
    borderRadius: radii.lg,
    marginTop: 28,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  buildFastCopy: {
    flex: 1,
    paddingRight: 12,
  },
  buildFastIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buildFastEyebrow: {
    fontFamily: fonts.bold,
    fontSize: 8,
    letterSpacing: 1.2,
  },
  buildFastTitle: {
    fontFamily: fonts.displaySemiBold,
    fontSize: 18,
    marginTop: 3,
  },
  version: {
    fontFamily: fonts.medium,
    fontSize: 9.5,
    textAlign: 'center',
    marginTop: 26,
  },
});
