import Ionicons from '@expo/vector-icons/Ionicons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useApp } from '../context/AppContext';
import { HabitDetailScreen } from '../screens/HabitDetailScreen';
import { HabitFormScreen } from '../screens/HabitFormScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { fonts, radii } from '../theme';
import { RootStackParamList, TabParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function TabBar({
  state,
  navigation,
}: {
  state: { index: number };
  navigation: {
    navigate: (name: keyof TabParamList) => void;
    getParent: () =>
      | { navigate: (name: 'HabitForm') => void }
      | undefined;
  };
}) {
  const { theme, preferences } = useApp();
  const insets = useSafeAreaInsets();

  const select = (name: keyof TabParamList) => {
    if (preferences.hapticsEnabled) {
      void Haptics.selectionAsync();
    }
    navigation.navigate(name);
  };

  const add = () => {
    if (preferences.hapticsEnabled) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation.getParent()?.navigate('HabitForm');
  };

  return (
    <View
      style={[
        styles.tabOuter,
        {
          backgroundColor: theme.background,
          paddingBottom: Math.max(insets.bottom, 8),
        },
      ]}
    >
      <View
        style={[
          styles.tabBar,
          {
            backgroundColor: theme.tabBar,
            borderColor: theme.border,
          },
          Platform.OS === 'web' ? undefined : { shadowColor: theme.shadow },
        ]}
      >
        <Pressable
          accessibilityRole="tab"
          accessibilityState={{ selected: state.index === 0 }}
          onPress={() => select('Today')}
          style={styles.tabItem}
        >
          <View
            style={[
              styles.tabIconWrap,
              {
                backgroundColor:
                  state.index === 0 ? `${theme.accent}35` : 'transparent',
              },
            ]}
          >
            <Ionicons
              name={state.index === 0 ? 'leaf' : 'leaf-outline'}
              size={20}
              color={state.index === 0 ? theme.text : theme.textTertiary}
            />
          </View>
          <Text
            style={[
              styles.tabLabel,
              {
                color: state.index === 0 ? theme.text : theme.textTertiary,
              },
            ]}
          >
            Today
          </Text>
        </Pressable>

        <Pressable
          accessibilityLabel="Add a habit"
          accessibilityRole="button"
          onPress={add}
          style={({ pressed }) => [
            styles.fab,
            {
              backgroundColor: theme.accent,
              borderColor: theme.background,
              transform: [
                { translateY: -17 },
                { rotate: pressed ? '8deg' : '0deg' },
                { scale: pressed ? 0.92 : 1 },
              ],
            },
            Platform.OS === 'web' ? undefined : { shadowColor: theme.shadow },
          ]}
        >
          <Ionicons name="add" size={28} color={theme.accentText} />
        </Pressable>

        <Pressable
          accessibilityRole="tab"
          accessibilityState={{ selected: state.index === 1 }}
          onPress={() => select('Settings')}
          style={styles.tabItem}
        >
          <View
            style={[
              styles.tabIconWrap,
              {
                backgroundColor:
                  state.index === 1 ? `${theme.accent}35` : 'transparent',
              },
            ]}
          >
            <Ionicons
              name={state.index === 1 ? 'options' : 'options-outline'}
              size={20}
              color={state.index === 1 ? theme.text : theme.textTertiary}
            />
          </View>
          <Text
            style={[
              styles.tabLabel,
              {
                color: state.index === 1 ? theme.text : theme.textTertiary,
              },
            ]}
          >
            Settings
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => (
        <TabBar
          state={props.state}
          navigation={props.navigation as never}
        />
      )}
    >
      <Tab.Screen name="Today" component={HomeScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  const { theme } = useApp();
  const baseTheme = theme.isDark ? DarkTheme : DefaultTheme;
  const navigationTheme = {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      primary: theme.accent,
      background: theme.background,
      card: theme.surface,
      text: theme.text,
      border: theme.border,
      notification: theme.danger,
    },
  };

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="Tabs" component={Tabs} />
        <Stack.Screen
          name="HabitForm"
          component={HabitFormScreen}
          options={{
            animation: 'slide_from_bottom',
            gestureDirection: 'vertical',
          }}
        />
        <Stack.Screen name="HabitDetail" component={HabitDetailScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabOuter: {
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 4,
  },
  tabBar: {
    width: '100%',
    maxWidth: 520,
    height: 68,
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Platform.select({
      web: { boxShadow: '0 10px 20px rgba(5, 10, 6, 0.12)' },
      default: {
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.12,
        shadowRadius: 20,
        elevation: 8,
      },
    }),
  },
  tabItem: {
    width: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconWrap: {
    width: 33,
    height: 28,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 9,
    marginTop: 2,
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 22,
    borderWidth: 5,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: { boxShadow: '0 10px 13px rgba(5, 10, 6, 0.2)' },
      default: {
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 13,
        elevation: 8,
      },
    }),
  },
});
