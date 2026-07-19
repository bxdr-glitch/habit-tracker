import { ColorSchemeName } from 'react-native';

import { ThemePreference } from './types';

export const habitColors = [
  '#F3A96B',
  '#C9F04A',
  '#7BC8A4',
  '#8FA7FF',
  '#F47C6A',
  '#C497E8',
];

export const fonts = {
  display: 'Fraunces_700Bold',
  displaySemiBold: 'Fraunces_600SemiBold',
  regular: 'AlbertSans_400Regular',
  medium: 'AlbertSans_500Medium',
  semiBold: 'AlbertSans_600SemiBold',
  bold: 'AlbertSans_700Bold',
};

const light = {
  isDark: false,
  background: '#F2F0E7',
  backgroundRaised: '#E9E7DC',
  surface: '#FFFCF5',
  surfaceStrong: '#FFFFFF',
  text: '#172019',
  textSecondary: '#657066',
  textTertiary: '#8B938A',
  border: '#D9DED4',
  accent: '#C9F04A',
  accentText: '#17220D',
  danger: '#D95942',
  dangerSoft: '#F8DED7',
  shadow: '#172019',
  white: '#FFFFFF',
  black: '#101510',
  tabBar: 'rgba(255, 252, 245, 0.97)',
  skeleton: '#E2E3DA',
  skeletonHighlight: '#F3F2EB',
};

const dark = {
  isDark: true,
  background: '#0F1510',
  backgroundRaised: '#141C16',
  surface: '#182019',
  surfaceStrong: '#202A21',
  text: '#F1F2E8',
  textSecondary: '#A8B2A8',
  textTertiary: '#778078',
  border: '#303B31',
  accent: '#C9F04A',
  accentText: '#142008',
  danger: '#FF856D',
  dangerSoft: '#482820',
  shadow: '#000000',
  white: '#FFFFFF',
  black: '#0A0D0A',
  tabBar: 'rgba(24, 32, 25, 0.97)',
  skeleton: '#273128',
  skeletonHighlight: '#354037',
};

export type Theme = typeof light;

export function resolveTheme(
  preference: ThemePreference,
  systemScheme: ColorSchemeName,
): Theme {
  const shouldUseDark =
    preference === 'dark' || (preference === 'system' && systemScheme === 'dark');

  return shouldUseDark ? dark : light;
}

export const radii = {
  sm: 12,
  md: 18,
  lg: 24,
  xl: 32,
  pill: 999,
};

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 44,
};
