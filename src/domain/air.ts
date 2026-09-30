export type Home = { name: string; latitude: number; longitude: number };
export type Metric = { key: string; label: string; description: string; unit: string; value: number | null };
export type Point = { time: number; value: number | null };
export type Outdoor = {
  fetchedAt: number; time: number; usAqi: number | null; europeanAqi: number | null;
  metrics: Metric[]; subIndices: Metric[]; history: Point[]; forecast: Point[];
};
export type Sensor = { name: string; url: string };
export type Indoor = { fetchedAt: number; serial: string; metrics: Metric[] };

export const pollutants = [
  ['pm2_5', 'PM2.5', 'Mayda chang zarrachalari', 'µg/m³'],
  ['pm10', 'PM10', 'Yirik chang zarrachalari', 'µg/m³'],
  ['nitrogen_dioxide', 'NO₂', 'Azot dioksidi', 'µg/m³'],
  ['ozone', 'O₃', 'Ozon', 'µg/m³'],
  ['sulphur_dioxide', 'SO₂', 'Oltingugurt dioksidi', 'µg/m³'],
  ['carbon_monoxide', 'CO', 'Uglerod monoksidi', 'µg/m³'],
  ['dust', 'Chang', 'Modeldagi chang konsentratsiyasi', 'µg/m³'],
  ['uv_index', 'UV', 'Ultrabinafsha indeksi', 'indeks'],
] as const;

export const subIndices = [
  'us_aqi_pm2_5', 'us_aqi_pm10', 'us_aqi_nitrogen_dioxide',
  'us_aqi_ozone', 'us_aqi_sulphur_dioxide', 'us_aqi_carbon_monoxide',
  'european_aqi_pm2_5', 'european_aqi_pm10', 'european_aqi_nitrogen_dioxide',
  'european_aqi_ozone', 'european_aqi_sulphur_dioxide',
] as const;

export function numeric(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null;
}

export function coordinates(latitude: string, longitude: string) {
  if (!latitude.trim() || !longitude.trim()) throw new Error('Ikkala koordinatani ham kiriting.');
  const lat = Number(latitude.trim().replace(',', '.'));
  const lon = Number(longitude.trim().replace(',', '.'));
  if (!Number.isFinite(lat) || lat < -90 || lat > 90 || !Number.isFinite(lon) || lon < -180 || lon > 180)
    throw new Error('Latitude −90…90, longitude −180…180 oralig‘ida bo‘lishi kerak.');
  return { latitude: lat, longitude: lon };
}

export function category(value: number | null, standard: 'us' | 'eu' = 'us') {
  const labels = standard === 'us'
    ? ['Yaxshi', 'O‘rtacha', 'Sezgir guruhlar uchun zararli', 'Zararli', 'Juda zararli', 'Xavfli']
    : ['Yaxshi', 'Qoniqarli', 'O‘rtacha', 'Yomon', 'Juda yomon', 'O‘ta yomon'];
  const limits = standard === 'us' ? [50, 100, 150, 200, 300] : [20, 40, 60, 80, 100];
  const colors = ['#9fe6b5', '#edd181', '#f4ad71', '#f08b8b', '#bfa4eb', '#e3a4c8'];
  if (value === null) return { label: 'Ma’lumot yo‘q', color: '#9aaca7' };
  const index = limits.findIndex(limit => value <= limit);
  return { label: labels[index < 0 ? 5 : index], color: colors[index < 0 ? 5 : index] };
}

type Json = Record<string, unknown>;
function record(value: unknown): Json {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Ma’lumot formati noto‘g‘ri.');
  return value as Json;
}

export function parseOutdoor(raw: unknown, fetchedAt = Date.now()): Outdoor {
  const data = record(raw); const current = record(data.current); const hourly = record(data.hourly);
  const time = numeric(current.time);
  if (time === null || !Array.isArray(hourly.time) || !Array.isArray(hourly.us_aqi))
    throw new Error('Havo sifati javobida vaqt yoki indekslar yo‘q.');
  const units = record(data.current_units);
  const metrics = pollutants.map(([key, label, description, unit]) => ({
    key, label, description, unit: typeof units[key] === 'string' ? units[key] as string : unit,
    value: numeric(current[key]),
  }));
  const points: Point[] = hourly.time.flatMap((timestamp: unknown, i: number) => {
    const t = numeric(timestamp); return t === null ? [] : [{ time: t * 1000, value: numeric((hourly.us_aqi as unknown[])[i]) }];
  });
  return {
    fetchedAt, time: time * 1000, usAqi: numeric(current.us_aqi), europeanAqi: numeric(current.european_aqi), metrics,
    subIndices: subIndices.map(key => ({ key, label: key.replace('european_aqi_', 'EU · ').replace('us_aqi_', 'US · '),
      description: 'Alohida ifloslantiruvchi indeksi', unit: 'AQI', value: numeric(current[key]) })),
    history: points.filter(p => p.time <= time * 1000).slice(-24),
    forecast: points.filter(p => p.time > time * 1000).slice(0, 24),
  };
}

export function sensorUrl(input: string) {
  let url: URL;
  try { url = new URL(input.trim()); } catch { throw new Error('Sensor URL manzili noto‘g‘ri.'); }
  const host = url.hostname.toLowerCase();
  const parts = host.split('.').map(Number);
  const ipv4 = parts.length === 4 && parts.every(n => Number.isInteger(n) && n >= 0 && n <= 255);
  const privateIp = ipv4 && (parts[0] === 10 || (parts[0] === 192 && parts[1] === 168) ||
    (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31));
  if (!['http:', 'https:'].includes(url.protocol) || (!privateIp && !host.endsWith('.local')) || url.username || url.password)
    throw new Error('Uy tarmog‘idagi IP yoki .local manzilni kiriting: http://192.168.1.50');
  url.pathname = '/measures/current'; url.search = ''; url.hash = '';
  return url.toString();
}

export function parseIndoor(raw: unknown, fetchedAt = Date.now()): Indoor {
  const data = record(raw);
  const specs = [
    ['pm02', 'PM2.5', 'Mayda zarrachalar', 'µg/m³'], ['pm10', 'PM10', 'Yirik zarrachalar', 'µg/m³'],
    ['pm01', 'PM1', 'Eng mayda zarrachalar', 'µg/m³'], ['rco2', 'CO₂', 'Uglerod dioksidi', 'ppm'],
    ['tvocIndex', 'VOC', 'VOC indeksi; konsentratsiya emas', 'indeks'], ['noxIndex', 'NOx', 'NOx indeksi; konsentratsiya emas', 'indeks'],
    ['atmp', 'Harorat', 'Xona harorati', '°C'], ['rhum', 'Namlik', 'Nisbiy namlik', '%'],
  ];
  const metrics = specs.map(([key, label, description, unit]) => {
    let rawValue = data[key];
    if (key === 'pm02') rawValue = data.pm02Compensated ?? rawValue;
    if (key === 'atmp') rawValue = data.atmpCompensated ?? rawValue;
    if (key === 'rhum') rawValue = data.rhumCompensated ?? rawValue;
    let value = numeric(rawValue);
    if (key === 'atmp' && typeof rawValue === 'number' && Number.isFinite(rawValue)) value = rawValue;
    if (key === 'rhum' && value !== null && value > 100) value = null;
    return { key, label, description, unit, value };
  });
  if (metrics.every(metric => metric.value === null)) throw new Error('Sensor o‘lchovlarni qaytarmadi.');
  return { fetchedAt, serial: typeof data.serialno === 'string' ? data.serialno : 'AirGradient', metrics };
}
