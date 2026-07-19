import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { useApp } from '../context/AppContext';
import { fonts, radii } from '../theme';

export function EmptyState({ onAdd }: { onAdd: () => void }) {
  const { theme } = useApp();

  return (
    <Animated.View entering={FadeIn.duration(450)} style={styles.container}>
      <View style={styles.illustration}>
        <View
          style={[
            styles.sun,
            { backgroundColor: theme.accent, borderColor: theme.text },
          ]}
        />
        <View
          style={[
            styles.leaf,
            styles.leafLeft,
            { backgroundColor: '#7BC8A4', borderColor: theme.text },
          ]}
        />
        <View
          style={[
            styles.leaf,
            styles.leafRight,
            { backgroundColor: '#C9F04A', borderColor: theme.text },
          ]}
        />
        <View style={[styles.stem, { backgroundColor: theme.text }]} />
        <View
          style={[
            styles.pot,
            { backgroundColor: '#F3A96B', borderColor: theme.text },
          ]}
        />
        <View
          style={[
            styles.ground,
            { backgroundColor: theme.border },
          ]}
        />
      </View>
      <Animated.View entering={FadeInDown.delay(120).duration(420)}>
        <Text style={[styles.title, { color: theme.text }]}>
          An empty plot.{'\n'}Plenty of possibility.
        </Text>
        <Text style={[styles.body, { color: theme.textSecondary }]}>
          Add one tiny habit. Keep it small enough to do on your messiest day.
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={onAdd}
          style={({ pressed }) => [
            styles.button,
            {
              backgroundColor: theme.accent,
              opacity: pressed ? 0.82 : 1,
            },
          ]}
        >
          <Ionicons name="add" size={20} color={theme.accentText} />
          <Text style={[styles.buttonText, { color: theme.accentText }]}>
            Plant your first habit
          </Text>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 34,
    paddingTop: 22,
    alignItems: 'center',
  },
  illustration: {
    width: 210,
    height: 184,
    marginBottom: 28,
  },
  sun: {
    position: 'absolute',
    width: 42,
    height: 42,
    right: 24,
    top: 4,
    borderRadius: 21,
    borderWidth: 2,
  },
  stem: {
    position: 'absolute',
    width: 3,
    height: 75,
    left: 104,
    top: 60,
    borderRadius: 3,
    transform: [{ rotate: '-4deg' }],
  },
  leaf: {
    position: 'absolute',
    width: 50,
    height: 31,
    borderWidth: 2,
    borderTopLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  leafLeft: {
    left: 57,
    top: 73,
    transform: [{ rotate: '18deg' }],
  },
  leafRight: {
    left: 106,
    top: 48,
    transform: [{ rotate: '-19deg' }],
  },
  pot: {
    position: 'absolute',
    width: 82,
    height: 62,
    left: 65,
    bottom: 8,
    borderWidth: 2,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    transform: [{ rotate: '2deg' }],
  },
  ground: {
    position: 'absolute',
    height: 8,
    width: 172,
    borderRadius: 8,
    left: 19,
    bottom: 0,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 30,
    lineHeight: 34,
    letterSpacing: -0.8,
    textAlign: 'center',
  },
  body: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginTop: 13,
    maxWidth: 310,
  },
  button: {
    height: 54,
    borderRadius: radii.pill,
    paddingHorizontal: 22,
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonText: {
    fontFamily: fonts.bold,
    fontSize: 14,
  },
});
