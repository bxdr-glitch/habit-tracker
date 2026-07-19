import { useEffect } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { useApp } from '../context/AppContext';
import { radii } from '../theme';

type SkeletonProps = {
  width: ViewStyle['width'];
  height: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
};

export function Skeleton({
  width,
  height,
  radius = radii.sm,
  style,
}: SkeletonProps) {
  const { theme } = useApp();
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(1, { duration: 760 }), -1, true);
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        { width, height, borderRadius: radius, backgroundColor: theme.skeleton },
        animatedStyle,
        style,
      ]}
    />
  );
}

export function HomeSkeleton() {
  const { theme } = useApp();
  return (
    <View style={styles.wrapper}>
      <Skeleton width={132} height={13} />
      <Skeleton width="80%" height={46} radius={16} style={styles.title} />
      <Skeleton width="100%" height={126} radius={radii.lg} style={styles.hero} />
      {[0, 1, 2].map((item) => (
        <View
          key={item}
          style={[
            styles.card,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <Skeleton width={54} height={54} radius={18} />
          <View style={styles.cardText}>
            <Skeleton width="70%" height={17} />
            <Skeleton width="44%" height={12} style={styles.line} />
          </View>
          <Skeleton width={48} height={48} radius={24} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  title: {
    marginTop: 12,
  },
  hero: {
    marginTop: 28,
    marginBottom: 36,
  },
  card: {
    height: 92,
    borderRadius: radii.lg,
    borderWidth: 1,
    marginBottom: 12,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  cardText: {
    flex: 1,
  },
  line: {
    marginTop: 10,
  },
});
