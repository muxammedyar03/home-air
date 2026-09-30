import React from 'react';
import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { AirProvider } from '../state/AirContext';
import { colors, Icon, IconName } from '../components/ui';

export default function Layout() {
  const routes: [string, string, IconName][] = [['index', 'Havo', 'wind'], ['forecast', 'Prognoz', 'chart'], ['location', 'Uyim', 'pin'], ['sensors', 'Sensorlar', 'sensor']];
  return <SafeAreaProvider><SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top', 'left', 'right']}>
    <StatusBar style="light" /><AirProvider><Tabs screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.bg },
      tabBarStyle: { backgroundColor: colors.bg, borderTopColor: colors.line, height: 78, paddingTop: 12, paddingBottom: 14 },
      tabBarActiveTintColor: colors.green, tabBarInactiveTintColor: colors.muted,
      tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginTop: 4 },
    }}>{routes.map(([name, title, icon]) => <Tabs.Screen key={name} name={name} options={{ title,
      tabBarIcon: ({ color }) => <Icon name={icon} color={String(color)} />,
    }} />)}</Tabs></AirProvider></SafeAreaView></SafeAreaProvider>;
}
