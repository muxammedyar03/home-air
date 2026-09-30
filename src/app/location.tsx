import React, { useState } from 'react';
import { Text, TextInput } from 'react-native';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useAir } from '../state/AirContext';
import { coordinates } from '../domain/air';
import HomeMap from '../components/HomeMap';
import { Page, Card, Button, Notice, s, colors } from '../components/ui';

export default function LocationPage() {
  const { home, ready } = useAir();
  if (!ready) return <Page title="Uy joylashuvi" eyebrow="UYIM"><Notice>Sozlamalar yuklanmoqda…</Notice></Page>;
  return <HomeLocation key={`${home?.latitude},${home?.longitude},${home?.name}`} />;
}

function HomeLocation() {
  const { home, saveHome } = useAir();
  const [name, setName] = useState(home?.name ?? 'Uyim'); const [lat, setLat] = useState(home ? String(home.latitude) : '');
  const [lon, setLon] = useState(home ? String(home.longitude) : ''); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  let point = null;
  try { point = { ...coordinates(lat, lon), name }; } catch { /* The form remains editable before valid coordinates exist. */ }
  async function gps() {
    setBusy(true); setError('');
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') throw new Error('Joylashuv ruxsati berilmadi. Koordinatalarni qo‘lda kiritishingiz mumkin.');
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setLat(location.coords.latitude.toFixed(6)); setLon(location.coords.longitude.toFixed(6));
    } catch (e) { setError(e instanceof Error ? e.message : 'GPS joylashuvini olib bo‘lmadi.'); }
    finally { setBusy(false); }
  }
  async function save() {
    setError(''); setBusy(true);
    try {
      if (!name.trim()) throw new Error('Joy nomini kiriting.');
      await saveHome({ name: name.trim(), ...coordinates(lat, lon) }); router.push('/');
    } catch (e) { setError(e instanceof Error ? e.message : 'Saqlash amalga oshmadi.'); }
    finally { setBusy(false); }
  }
  return <Page title="Uy joylashuvi" eyebrow="BITTA NUQTA / DOIMIY KUZATUV">
    <Notice>Uyda turganingizda GPS orqali tanlang yoki xaritada nuqta belgilang. Saqlangan manzil sayohat qilganingizda o‘zgarmaydi.</Notice>
    <Card><Text style={s.label}>Joy nomi</Text><TextInput style={s.input} value={name} onChangeText={setName} accessibilityLabel="Joy nomi" maxLength={60} placeholderTextColor={colors.muted} />
      <Text style={s.label}>Latitude</Text><TextInput style={s.input} value={lat} onChangeText={setLat} accessibilityLabel="Latitude" keyboardType="numbers-and-punctuation" placeholder="41.3111" placeholderTextColor={colors.muted} />
      <Text style={s.label}>Longitude</Text><TextInput style={s.input} value={lon} onChangeText={setLon} accessibilityLabel="Longitude" keyboardType="numbers-and-punctuation" placeholder="69.2797" placeholderTextColor={colors.muted} />
      <Button title={busy ? 'Kutilmoqda…' : 'Hozirgi joylashuvimni olish'} onPress={() => void gps()} disabled={busy} secondary />
      {point ? <HomeMap point={point} onChange={p => { setLat(p.latitude.toFixed(6)); setLon(p.longitude.toFixed(6)); }} /> : null}
      {error ? <Notice warning>{error}</Notice> : null}
      <Button title="Uy nuqtasini saqlash" onPress={() => void save()} disabled={busy} />
    </Card>
    <Text style={s.caption}>Faqat tanlash vaqtida GPS ishlatiladi. Doimiy joylashuv kuzatuvi yo‘q. Manzil shu telefonda saqlanadi; koordinatalar havo API xizmatiga yuboriladi.</Text>
  </Page>;
}
