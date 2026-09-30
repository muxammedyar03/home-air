import React from 'react';
import { Text, View } from 'react-native';
import { useAir } from '../state/AirContext';
import { Page, Chart, Card, Notice, s, clock } from '../components/ui';
import { category } from '../domain/air';

export default function Forecast() {
  const { outdoor, outdoorError } = useAir();
  return <Page title="Havo dinamikasi" eyebrow="KECHA / BUGUN / ERTAGA">
    {outdoorError ? <Notice warning>{outdoorError}</Notice> : null}
    {!outdoor ? <Notice>Avval Uyim bo‘limida manzilni belgilang va ma’lumotni yuklang.</Notice> : <>
      <Chart points={outdoor.history} label="Oxirgi 24 soat" />
      <Notice>O‘tgan soatlar grafigi model ma’lumotidir; uyda o‘lchangan sensor tarixi emas.</Notice>
      <Chart points={outdoor.forecast} label="Keyingi 24 soat" />
      <Card><Text style={s.heading}>Soatlik prognoz</Text>{outdoor.forecast.filter((_, i) => i % 3 === 0).map(p => <View style={s.row} key={p.time}>
        <Text style={[s.caption, { width: 65 }]}>{clock(p.time)}</Text>
        <Text style={[s.text, { color: category(p.value).color, flex: 1 }]}>{category(p.value).label}</Text>
        <Text style={s.text}>{p.value === null ? '—' : Math.round(p.value)}</Text></View>)}</Card>
      <Card><Text style={s.heading}>Har bir modda indeksi</Text>{outdoor.subIndices.map(m => <View style={s.row} key={m.key}>
        <Text style={[s.caption, { flex: 1 }]}>{m.label.replace('nitrogen_dioxide', 'NO₂').replace('sulphur_dioxide', 'SO₂').replace('carbon_monoxide', 'CO').replace('ozone', 'O₃').replace('pm2_5', 'PM2.5').replace('pm10', 'PM10')}</Text>
        <Text style={s.text}>{m.value === null ? '—' : Math.round(m.value)}</Text></View>)}</Card>
      <Notice>Umumiy AQI alohida indekslarning eng kattasiga asoslanadi. AQI “havo necha foiz iflos” degani emas.</Notice>
    </>}
  </Page>;
}
