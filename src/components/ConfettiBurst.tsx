import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

const particles = [
  { angle: -150, color: '#F47C6A', size: 6, distance: 43 },
  { angle: -112, color: '#C9F04A', size: 8, distance: 52 },
  { angle: -74, color: '#8FA7FF', size: 6, distance: 47 },
  { angle: -35, color: '#F3A96B', size: 7, distance: 54 },
  { angle: 12, color: '#7BC8A4', size: 6, distance: 45 },
  { angle: 52, color: '#C497E8', size: 8, distance: 50 },
  { angle: 105, color: '#F47C6A', size: 5, distance: 44 },
  { angle: 154, color: '#C9F04A', size: 7, distance: 49 },
];

function Particle({ index }: { index: number }) {
  const progress = useSharedValue(0);
  const particle = particles[index];
  const radians = (particle.angle * Math.PI) / 180;

  useEffect(() => {
    progress.value = withTiming(1, {
      duration: 620,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress]);

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.68, 1], [0, 1, 0]),
    transform: [
      {
        translateX:
          Math.cos(radians) * particle.distance * progress.value,
      },
      {
        translateY:
          Math.sin(radians) * particle.distance * progress.value +
          14 * progress.value * progress.value,
      },
      { rotate: `${progress.value * 220}deg` },
      { scale: interpolate(progress.value, [0, 0.2, 1], [0.3, 1, 0.65]) },
    ],
  }));

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          width: particle.size,
          height: particle.size,
          borderRadius: index % 2 === 0 ? 2 : particle.size,
          backgroundColor: particle.color,
        },
        style,
      ]}
    />
  );
}

export function ConfettiBurst() {
  return (
    <Animated.View style={styles.container}>
      {particles.map((_, index) => (
        <Particle key={index} index={index} />
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: 120,
    height: 120,
    left: -36,
    top: -36,
    pointerEvents: 'none',
  },
  particle: {
    position: 'absolute',
    left: 57,
    top: 57,
  },
});
