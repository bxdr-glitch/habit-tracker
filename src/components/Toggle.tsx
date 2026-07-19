import * as Haptics from 'expo-haptics';
import { Platform, Pressable, StyleSheet } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { useApp } from '../context/AppContext';

type ToggleProps = {
  value: boolean;
  onValueChange: (value: boolean) => void;
  activeColor?: string;
  disabled?: boolean;
  accessibilityLabel?: string;
};

const TRACK_WIDTH = 52;
const TRACK_HEIGHT = 31;
const THUMB_SIZE = 25;
const PADDING = 3;
const TRAVEL = TRACK_WIDTH - THUMB_SIZE - PADDING * 2;

export function Toggle({
  value,
  onValueChange,
  activeColor,
  disabled = false,
  accessibilityLabel,
}: ToggleProps) {
  const { theme, preferences } = useApp();
  const onColor = activeColor ?? theme.accent;
  const progress = useDerivedValue(() =>
    withSpring(value ? 1 : 0, { damping: 15, stiffness: 170 }),
  );
  const pressed = useSharedValue(0);

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [theme.backgroundRaised, onColor],
    ),
  }));

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: progress.value * TRAVEL },
      { scale: withTiming(pressed.value ? 0.86 : 1, { duration: 120 }) },
    ],
  }));

  const handlePress = () => {
    if (disabled) return;
    if (preferences.hapticsEnabled && Platform.OS !== 'web') {
      void Haptics.selectionAsync();
    }
    onValueChange(!value);
  };

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: value, disabled }}
      disabled={disabled}
      hitSlop={10}
      onPressIn={() => {
        pressed.value = 1;
      }}
      onPressOut={() => {
        pressed.value = 0;
      }}
      onPress={handlePress}
      style={{ opacity: disabled ? 0.45 : 1 }}
    >
      <Animated.View style={[styles.track, trackStyle]}>
        <Animated.View
          style={[
            styles.thumb,
            { backgroundColor: theme.white },
            thumbStyle,
          ]}
        />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    width: TRACK_WIDTH,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    padding: PADDING,
    justifyContent: 'center',
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    ...Platform.select({
      web: { boxShadow: '0 1px 3px rgba(10, 18, 12, 0.28)' },
      default: {
        shadowColor: '#0A120C',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.28,
        shadowRadius: 3,
        elevation: 2,
      },
    }),
  },
});
