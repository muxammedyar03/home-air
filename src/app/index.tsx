import React, { useState, useEffect } from 'react';
import { Text, View, Linking } from 'react-native';
import { router } from 'expo-router';
import { useAir } from '../state/AirContext';
import { Page, Card, AqiRing, Metrics, Notice, Button, Chart, Icon, s, clock } from '../components/ui';

export default function Dashboard() {
  const { home, outdoor, outdoorError, sensor, indoor, sensorError, ready } = useAir();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 30000); return () => clearInterval(timer); }, []);
  const stale = outdoor && now - outdoor.fetchedAt > 600000;
  return <Page title="Uyimning havosi" eyebrow="HOME AIR / BUGUN">
    {!ready ? <Notice>Sozlamalar yuklanmoqda…</Notice> : !home ? <Card>
      <Icon name="home" size={38} /><Text style={s.heading}>Hamma narsa uy nuqtasidan boshlanadi</Text>
      <Text style={s.text}>Uy manzilingizni bir marta belgilang. Havo sifati keyin shu joy uchun ko‘rsatiladi.</Text>
      <Button title="Uy joylashuvini belgilash" onPress={() => router.push('/location')} />
    </Card> : <View style={s.row}><View><Text style={s.heading}>{home.name}</Text>
      <Text style={s.caption}>{home.latitude.toFixed(4)}° · {home.longitude.toFixed(4)}°</Text></View><Icon name="pin" /></View>}
    {outdoorError ? <Notice warning>{outdoorError}{outdoor ? ' Oxirgi olingan ma’lumot ko‘rsatilmoqda.' : ''}</Notice> : null}
    {home ? <Card>
      <View style={s.row}><Text style={s.eyebrow}>TASHQI HAVO</Text><Text style={s.caption}>Hududiy model</Text></View>
      <AqiRing value={outdoor?.usAqi ?? null} />
      <Text style={[s.caption, { textAlign: 'center' }]}>{outdoor ? `Model vaqti ${clock(outdoor.time)} · Olingan ${clock(outdoor.fetchedAt)}` : outdoorError ? 'Ma’lumot yuklanmadi. Qayta yangilang.' : 'Ma’lumot kutilmoqda…'}</Text>
      {stale ? <Notice warning>Ma’lumot 10 daqiqadan beri yangilanmagan.</Notice> : null}
      <Text style={s.caption}>AQI — indeks, foiz emas. Open-Meteo / CAMS hududiy prognozi uy sensori o‘lchovi o‘rnini bosmaydi.</Text>
    </Card> : null}
    {outdoor ? <><View style={s.row}><Text style={s.heading}>Havo tarkibi</Text><Text style={s.caption}>Konsentratsiya</Text></View>
      <Metrics metrics={outdoor.metrics} />
      <Card><View style={s.row}><Text style={s.heading}>Yevropa indeksi</Text><Text style={s.metricValue}>{outdoor.europeanAqi === null ? '—' : Math.round(outdoor.europeanAqi)}</Text></View>
        <Text style={s.caption}>EU AQI boshqa shkala. US AQI raqami bilan to‘g‘ridan-to‘g‘ri solishtirmang.</Text></Card>
      <Chart points={outdoor.history} label="Oxirgi 24 soat" />
      <Button title="Barcha indekslarni ko‘rish" secondary onPress={() => router.push('/forecast')} />
    </> : null}
    <Card><View style={s.row}><Text style={s.heading}>Uy ichidagi havo</Text><Icon name="sensor" /></View>
      {sensor ? <><Text style={s.caption}>{sensor.name} · {indoor ? `So‘nggi o‘lchov ${clock(indoor.fetchedAt)}` : 'Ulanish kutilmoqda'}</Text>
        {sensorError ? <Notice warning>{sensorError}{indoor ? ' Eski o‘lchov ko‘rsatilmoqda.' : ''}</Notice> : null}
        {indoor && now - indoor.fetchedAt > 120000 ? <Notice warning>Sensor o‘lchovi 2 daqiqadan beri yangilanmagan.</Notice> : null}
        {indoor ? <Metrics metrics={indoor.metrics.filter(m => ['pm02', 'rco2'].includes(m.key))} /> : null}</>
        : <Text style={s.text}>Sensor qo‘shilgach, xonangizdagi haqiqiy PM2.5, CO₂ va boshqa o‘lchovlar shu yerda chiqadi.</Text>}
      <Button title={sensor ? 'Sensor ma’lumotlari' : 'Sensor ulash'} secondary onPress={() => router.push('/sensors')} />
    </Card>
    <Text style={s.caption}>Manba: <Text style={{ textDecorationLine: 'underline' }} onPress={() => void Linking.openURL('https://open-meteo.com/')}>Open-Meteo</Text> va CAMS. O‘zbekistonda global model taxminan 45 km. Uy koordinatalari prognoz olish uchun Open-Meteo xizmatiga yuboriladi.</Text>
  </Page>;
}
