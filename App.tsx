import { AlbertSans_400Regular } from '@expo-google-fonts/albert-sans/400Regular';
import { AlbertSans_500Medium } from '@expo-google-fonts/albert-sans/500Medium';
import { AlbertSans_600SemiBold } from '@expo-google-fonts/albert-sans/600SemiBold';
import { AlbertSans_700Bold } from '@expo-google-fonts/albert-sans/700Bold';
import { Fraunces_600SemiBold } from '@expo-google-fonts/fraunces/600SemiBold';
import { Fraunces_600SemiBold_Italic } from '@expo-google-fonts/fraunces/600SemiBold_Italic';
import { Fraunces_700Bold } from '@expo-google-fonts/fraunces/700Bold';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, useColorScheme, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppProvider, useApp } from './src/context/AppContext';
import { AppNavigator } from './src/navigation/AppNavigator';

function AppContent() {
  const { theme } = useApp();
  return (
    <>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
      <AppNavigator />
    </>
  );
}

export default function App() {
  const systemScheme = useColorScheme();
  const [fontsLoaded] = useFonts({
    AlbertSans_400Regular,
    AlbertSans_500Medium,
    AlbertSans_600SemiBold,
    AlbertSans_700Bold,
    Fraunces_600SemiBold,
    Fraunces_600SemiBold_Italic,
    Fraunces_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View
        style={[
          styles.loading,
          { backgroundColor: systemScheme === 'dark' ? '#0F1510' : '#F2F0E7' },
        ]}
      >
        <View
          style={[
            styles.loadingMark,
            {
              backgroundColor: '#C9F04A',
              borderColor: systemScheme === 'dark' ? '#F1F2E8' : '#172019',
            },
          ]}
        >
          <View style={styles.loadingSeed} />
        </View>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <AppProvider>
          <AppContent />
        </AppProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingMark: {
    width: 58,
    height: 58,
    borderRadius: 19,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-7deg' }],
  },
  loadingSeed: {
    width: 10,
    height: 19,
    borderTopLeftRadius: 9,
    borderBottomRightRadius: 9,
    backgroundColor: '#172019',
    transform: [{ rotate: '18deg' }],
  },
});
