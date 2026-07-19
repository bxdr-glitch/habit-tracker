import { Alert, Linking, Platform } from 'react-native';

export async function openLink(url: string): Promise<void> {
  try {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }
    await Linking.openURL(url);
  } catch {
    Alert.alert('Could not open the link', `Please visit ${url} in your browser.`);
  }
}
