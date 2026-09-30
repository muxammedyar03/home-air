import React, { useState } from 'react';
import { Text, TextInput } from 'react-native';
import { useAir } from '../state/AirContext';
import { airGradient } from '../services/providers';
import { sensorUrl } from '../domain/air';
import { Page, Card, Button, Notice, Metrics, s, colors, clock } from '../components/ui';

export default function SensorPage() {
  const { sensor, ready } = useAir();
  if (!ready) return <Page title="Uy sensorlari" eyebrow="SENSORLAR"><Notice>Sozlamalar yuklanmoqda…</Notice></Page>;
  return <Sensors key={`${sensor?.name},${sensor?.url}`} />;
}

function Sensors() {
  const { sensor, indoor, sensorError, saveSensor } = useAir();
  const [name, setName] = useState(sensor?.name ?? 'Mehmonxona'); const [url, setUrl] = useState(sensor?.url ?? '');
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  async function connect() {
    setBusy(true); setError('');
    try {
      if (!name.trim()) throw new Error('Sensor nomini kiriting.');
      const next = { name: name.trim(), url: sensorUrl(url) };
      await airGradient.read(next); await saveSensor(next);
    } catch (e) { setError(e instanceof Error ? e.message : 'Sensor ulanmagan.'); }
    finally { setBusy(false); }
  }
  async function disconnect() {
    setBusy(true); setError('');
    try { await saveSensor(null); setUrl(''); } catch { setError('Sozlamani saqlab bo‘lmadi.'); }
    finally { setBusy(false); }
  }
  return <Page title="Uy sensorlari" eyebrow="UY ICHIDA / HAQIQIY O‘LCHOV">
    <Notice>AirGradient ONE / Open Air lokal API. Telefon va sensor bir Wi-Fi tarmog‘ida bo‘lishi kerak. Boshqa brendlar uchun adapter keyin qo‘shiladi.</Notice>
    {sensorError ? <Notice warning>{sensorError}{indoor ? ' Oxirgi o‘lchov ko‘rsatilmoqda.' : ''}</Notice> : null}
    {indoor ? <><Card><Text style={s.heading}>{sensor?.name}</Text><Text style={s.caption}>Qurilma: {indoor.serial} · So‘nggi so‘rov: {clock(indoor.fetchedAt)}</Text></Card>
      <Metrics metrics={indoor.metrics} /></> : null}
    <Card><Text style={s.heading}>{sensor ? 'Ulanishni o‘zgartirish' : 'Birinchi sensorni qo‘shish'}</Text>
      <Text style={s.label}>Xona / sensor nomi</Text><TextInput style={s.input} value={name} onChangeText={setName} accessibilityLabel="Sensor nomi" maxLength={60} />
      <Text style={s.label}>Sensor manzili</Text><TextInput style={s.input} value={url} onChangeText={setUrl} accessibilityLabel="Sensor manzili" autoCapitalize="none" autoCorrect={false} placeholder="http://192.168.1.50" placeholderTextColor={colors.muted} />
      <Text style={s.caption}>IP manzil yoki http://airgradient_SERIAL.local. Ilova /measures/current manzilidan o‘lchovlarni oladi.</Text>
      {error ? <Notice warning>{error}</Notice> : null}
      <Button title={busy ? 'Ulanish tekshirilmoqda…' : 'Tekshirish va ulash'} disabled={busy} onPress={() => void connect()} />
      {sensor ? <Button title="Sensorni uzish" secondary disabled={busy} onPress={() => void disconnect()} /> : null}
    </Card>
    <Notice>PM: µg/m³. CO₂: ppm. VOC/NOx: qurilma indeksi. Faqat namlik foizda ko‘rsatiladi. Sensor o‘lchovlaridan avtomatik US AQI hisoblanmaydi: buning uchun standartga mos vaqtli o‘rtachalar kerak.</Notice>
    <Text style={s.caption}>Ochiq ilovada sensor har 60 soniyada yangilanadi. Masofadan kuzatish, MQTT, Bluetooth, tarix saqlash va fon bildirishnomalari keyingi bosqichda.</Text>
  </Page>;
}
