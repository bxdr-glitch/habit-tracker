import Ionicons from '@expo/vector-icons/Ionicons';
import { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useApp } from '../context/AppContext';
import { fonts, radii } from '../theme';

type StackHeaderProps = {
  title: string;
  eyebrow?: string;
  onBack: () => void;
  right?: ReactNode;
};

export function StackHeader({
  title,
  eyebrow,
  onBack,
  right,
}: StackHeaderProps) {
  const { theme } = useApp();

  return (
    <View style={styles.container}>
      <Pressable
        accessibilityLabel="Go back"
        accessibilityRole="button"
        hitSlop={10}
        onPress={onBack}
        style={({ pressed }) => [
          styles.backButton,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
            opacity: pressed ? 0.72 : 1,
          },
        ]}
      >
        <Ionicons name="arrow-back" size={21} color={theme.text} />
      </Pressable>
      <View style={styles.titleWrap}>
        {eyebrow ? (
          <Text style={[styles.eyebrow, { color: theme.textSecondary }]}>
            {eyebrow}
          </Text>
        ) : null}
        <Text numberOfLines={1} style={[styles.title, { color: theme.text }]}>
          {title}
        </Text>
      </View>
      <View style={styles.right}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 72,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: radii.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleWrap: {
    flex: 1,
  },
  eyebrow: {
    fontFamily: fonts.semiBold,
    fontSize: 10,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: 1,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 23,
    letterSpacing: -0.5,
  },
  right: {
    minWidth: 42,
    alignItems: 'flex-end',
  },
});
