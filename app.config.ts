import { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'Home Air', slug: 'home-air', version: '0.1.0', scheme: 'homeair',
  orientation: 'portrait', userInterfaceStyle: 'dark', icon: './assets/icon.png',
  android: { package: 'uz.homeair.app' },
  web: { bundler: 'metro', output: 'single', favicon: './assets/favicon.png' },
  plugins: [
    'expo-router',
    ['expo-location', { locationWhenInUsePermission: 'Uy joylashuvini belgilash uchun GPS kerak.' }],
    ['expo-build-properties', { android: { usesCleartextTraffic: true } }],
    ...(process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY
      ? [['react-native-maps', { androidGoogleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY }] as [string, Record<string, string>]] : []),
  ],
};
export default config;
