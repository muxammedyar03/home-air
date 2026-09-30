import React from 'react';
import { StyleSheet, View, Text, Pressable, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import Svg, { Path, Circle, Line, Polyline } from 'react-native-svg';
import { Metric, Point, category } from '../domain/air';
import { useAir } from '../state/AirContext';

export const colors = { bg: '#0c1915', panel: '#14271f', line: '#2a4035', text: '#f4f6ef', muted: '#b0bfb5', green: '#b6f18c' };
export type IconName = 'home' | 'chart' | 'pin' | 'sensor' | 'wind' | 'refresh' | 'arrow';
const paths: Record<IconName, string> = {
  home: 'M3 11 12 3l9 8M5 10v10h5v-6h4v6h5V10',
  chart: 'M4 4v16h16M7 15l4-5 4 2 5-7',
  pin: 'M19 10c0 6-7 11-7 11S5 16 5 10a7 7 0 1 1 14 0Z M14 10a2 2 0 1 1-4 0 2 2 0 0 1 4 0',
  sensor: 'M7 7h10v10H7ZM10 2v3m4-3v3m-4 14v3m4-3v3M2 10h3m-3 4h3m14-4h3m-3 4h3',
  wind: 'M3 8h12a3 3 0 1 0-3-3M3 12h15a3 3 0 1 1-3 3M3 16h5a3 3 0 1 1-3 3',
  refresh: 'M20 8a8 8 0 1 0 0 8M20 3v5h-5',
  arrow: 'M5 12h14m-5-5 5 5-5 5',
};
export function Icon({ name, size = 23, color = colors.muted }: { name: IconName; size?: number; color?: string }) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Path d={paths[name]} stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" /></Svg>;
}
export function Button({ title, onPress, secondary = false, disabled = false }: {
  title: string; onPress(): void; secondary?: boolean; disabled?: boolean;
}) {
  return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress}
    style={({ pressed }) => [s.button, secondary && s.secondary, { opacity: disabled ? .45 : pressed ? .75 : 1 }]}>
    <Text style={[s.buttonText, secondary && { color: colors.text }]}>{title}</Text>
  </Pressable>;
}
export function Card({ children, style }: { children: React.ReactNode; style?: object }) {
  return <View style={[s.card, style]}>{children}</View>;
}
export function Notice({ children, warning = false }: { children: React.ReactNode; warning?: boolean }) {
  return <View style={[s.notice, warning && { borderColor: '#9a653c' }]}><Text style={s.caption}>{children}</Text></View>;
}
export function Page({ title, eyebrow, children }: { title: string; eyebrow: string; children: React.ReactNode }) {
  const air = useAir();
  return <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={s.page}
    refreshControl={<RefreshControl refreshing={air.loading} onRefresh={() => void air.refresh()} tintColor={colors.green} />}>
    <View style={s.header}><View style={{ flex: 1 }}><Text style={s.eyebrow}>{eyebrow}</Text><Text style={s.title}>{title}</Text></View>
      <Pressable accessibilityRole="button" accessibilityLabel="Yangilash" onPress={() => void air.refresh()} style={s.iconButton}>
        {air.loading ? <ActivityIndicator color={colors.green} /> : <Icon name="refresh" color={colors.green} />}
      </Pressable></View>
    {air.storageError ? <Notice warning>{air.storageError}</Notice> : null}{children}
    <Text style={[s.caption, { textAlign: 'center', marginTop: 8, marginBottom: 16 }]}>Home Air · Havoni tushuning.</Text>
  </ScrollView>;
}
export function Metrics({ metrics }: { metrics: Metric[] }) {
  return <View style={s.grid}>{metrics.map(metric => <View style={s.metric} key={metric.key}>
    <Text style={s.metricLabel}>{metric.label}</Text>
    <Text style={s.metricValue}>{metric.value === null ? '—' : metric.value.toFixed(metric.value < 10 ? 1 : 0)} <Text style={s.unit}>{metric.unit}</Text></Text>
    <Text style={s.caption}>{metric.value === null ? 'Ma’lumot yo‘q' : metric.description}</Text>
  </View>)}</View>;
}
export function AqiRing({ value, standard = 'us' }: { value: number | null; standard?: 'us' | 'eu' }) {
  const status = category(value, standard); const progress = Math.min(1, (value ?? 0) / (standard === 'us' ? 500 : 120));
  return <View style={{ alignItems: 'center', paddingVertical: 10 }}>
    <View style={{ width: 218, height: 218, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={218} height={218} style={StyleSheet.absoluteFill} viewBox="0 0 218 218">
        <Circle cx={109} cy={109} r={96} stroke={colors.line} strokeWidth={9} fill="none" />
        <Circle cx={109} cy={109} r={96} stroke={status.color} strokeWidth={9} fill="none" strokeLinecap="round"
          strokeDasharray={`${Math.max(4, progress * 603)} 603`} rotation={-90} origin="109,109" />
      </Svg>
      <Text style={[s.aqiValue, { color: status.color }]}>{value === null ? '—' : Math.round(value)}</Text>
      <Text style={s.caption}>{standard === 'us' ? 'US AQI' : 'EU AQI'} · indeks</Text>
    </View><Text style={[s.heading, { color: status.color, textAlign: 'center', marginTop: 12 }]}>{status.label}</Text>
  </View>;
}
export function Chart({ points, label }: { points: Point[]; label: string }) {
  const finite = points.filter(p => p.value !== null);
  if (!finite.length) return <Notice>Grafik uchun ma’lumot yo‘q.</Notice>;
  const max = Math.max(50, ...finite.map(p => p.value!)); const w = 340; const h = 122;
  const y = (value: number) => h - 8 - (value / max) * (h - 20);
  // Split missing observations: do not draw a false continuous line across gaps.
  const segments: string[] = []; let segment: string[] = [];
  points.forEach((p, i) => {
    if (p.value === null) { if (segment.length) segments.push(segment.join(' ')); segment = []; }
    else segment.push(`${8 + i / Math.max(1, points.length - 1) * (w - 16)},${y(p.value)}`);
  });
  if (segment.length) segments.push(segment.join(' '));
  return <Card><View style={s.row}><Text style={s.heading}>{label}</Text><Text style={s.caption}>US AQI</Text></View>
    <Svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} accessibilityLabel={label}>
      {[.25, .5, .75].map(r => <Line key={r} x1={8} x2={w - 8} y1={r * h} y2={r * h} stroke={colors.line} strokeDasharray="3 5" />)}
      {segments.map((segment, i) => <Polyline key={i} points={segment} fill="none" stroke={colors.green} strokeWidth={2.8} strokeLinejoin="round" />)}
    </Svg><View style={s.row}><Text style={s.caption}>{clock(points[0].time)}</Text><Text style={s.caption}>Maks. {Math.round(max)}</Text>
      <Text style={s.caption}>{clock(points[points.length - 1].time)}</Text></View>
  </Card>;
}
export function clock(time: number) { return new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
export const s = StyleSheet.create({
  page: { width: '100%', maxWidth: 720, alignSelf: 'center', paddingHorizontal: 22, paddingTop: 22, gap: 18, paddingBottom: 16 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 2 },
  eyebrow: { color: colors.green, fontSize: 11, fontWeight: '700', letterSpacing: 2, marginBottom: 8, textTransform: 'uppercase' },
  title: { color: colors.text, fontSize: 30, fontWeight: '600', letterSpacing: -.9 },
  heading: { color: colors.text, fontSize: 18, fontWeight: '600', letterSpacing: -.3 },
  text: { color: colors.text, fontSize: 15, lineHeight: 24 },
  caption: { color: colors.muted, fontSize: 12, lineHeight: 19 },
  card: { backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.line, borderRadius: 23, padding: 20, gap: 12 },
  notice: { backgroundColor: '#192a20', borderWidth: 1, borderColor: colors.line, padding: 14, borderRadius: 14 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  button: { backgroundColor: colors.green, borderRadius: 14, minHeight: 50, justifyContent: 'center', alignItems: 'center', padding: 14 },
  secondary: { backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.line },
  buttonText: { color: colors.bg, fontSize: 15, fontWeight: '700' },
  iconButton: { height: 46, width: 46, borderRadius: 23, backgroundColor: colors.panel, justifyContent: 'center', alignItems: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  metric: { width: '48%', flexGrow: 1, backgroundColor: colors.panel, borderRadius: 18, borderWidth: 1, borderColor: colors.line, padding: 16, gap: 9 },
  metricLabel: { color: colors.muted, fontSize: 14, fontWeight: '600' },
  metricValue: { color: colors.text, fontSize: 28, fontWeight: '500', letterSpacing: -.8 },
  unit: { color: colors.muted, fontSize: 11, letterSpacing: 0 },
  aqiValue: { fontSize: 68, fontWeight: '500', letterSpacing: -3 },
  input: { backgroundColor: colors.bg, color: colors.text, borderWidth: 1, borderColor: colors.line, borderRadius: 12, padding: 14, fontSize: 15, minHeight: 48 },
  label: { color: colors.muted, fontSize: 13, marginTop: 8 },
});
