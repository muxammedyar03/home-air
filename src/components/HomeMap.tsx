import React from 'react';
import MapView, { Marker } from 'react-native-maps';
import { Home } from '../domain/air';
import { Notice } from './ui';
import Constants from 'expo-constants';

export default function HomeMap({ point, onChange }: { point: Home; onChange(point: Home): void }) {
  // Expo Go supplies its own maps configuration; standalone Android requires the owner's API key.
  if (!process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY && Constants.executionEnvironment !== 'storeClient') {
    return <Notice>Xarita uchun Google Maps kaliti kerak. Hozir GPS yoki koordinatalardan foydalaning.</Notice>;
  }
  return <MapView style={{ height: 250, borderRadius: 16 }} region={{ ...point, latitudeDelta: .016, longitudeDelta: .016 }}
    onPress={event => onChange({ ...point, ...event.nativeEvent.coordinate })}>
    <Marker coordinate={point} title={point.name} draggable onDragEnd={event => onChange({ ...point, ...event.nativeEvent.coordinate })} />
  </MapView>;
}
