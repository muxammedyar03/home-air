import { Home, Outdoor, Indoor, Sensor, parseOutdoor, parseIndoor, pollutants, subIndices, sensorUrl } from '../domain/air';

async function getJson(url: string, timeout = 15000): Promise<unknown> {
  const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(response.status === 429 ? 'So‘rov limiti tugadi. Birozdan keyin yangilang.' : `Server xatosi (${response.status}).`);
    return await response.json();
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw new Error('So‘rov vaqti tugadi. Internet yoki Wi-Fi ulanishini tekshiring.');
    if (error instanceof TypeError) throw new Error('Ulanish amalga oshmadi. Internet yoki sensorning Wi-Fi tarmog‘ini tekshiring.');
    throw error;
  } finally { clearTimeout(timer); }
}

export interface OutdoorProvider { read(home: Home): Promise<Outdoor> }
export interface IndoorProvider { read(sensor: Sensor): Promise<Indoor> }

export const openMeteo: OutdoorProvider = {
  async read(home) {
    const current = [...pollutants.map(([key]) => key), 'us_aqi', 'european_aqi', ...subIndices].join(',');
    const params = new URLSearchParams({ latitude: String(home.latitude), longitude: String(home.longitude),
      current, hourly: 'us_aqi,pm2_5,pm10', past_days: '1', forecast_days: '3', timeformat: 'unixtime', timezone: 'auto' });
    return parseOutdoor(await getJson(`https://air-quality-api.open-meteo.com/v1/air-quality?${params}`));
  },
};

export const airGradient: IndoorProvider = {
  async read(sensor) { return parseIndoor(await getJson(sensorUrl(sensor.url), 8000)); },
};
