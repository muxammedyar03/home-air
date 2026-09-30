import { test } from 'node:test';
import assert from 'node:assert/strict';
import { coordinates, category, sensorUrl, parseOutdoor, parseIndoor } from '../src/domain/air';

test('coordinates accept zero, negatives and decimal comma; reject empty and out of range', () => {
  assert.deepEqual(coordinates('0', '-1,5'), { latitude: 0, longitude: -1.5 });
  for (const [lat, lon] of [['', '0'], ['91', '0'], ['0', '181'], ['NaN', '0']])
    assert.throws(() => coordinates(lat, lon));
});
test('US and EU classifications do not share thresholds; missing is not good air', () => {
  assert.equal(category(50).label, 'Yaxshi');
  assert.equal(category(50.1).label, 'O‘rtacha');
  assert.equal(category(50, 'eu').label, 'O‘rtacha');
  assert.equal(category(null).label, 'Ma’lumot yo‘q');
  assert.equal(category(600).label, 'Xavfli');
});
test('sensor endpoint stays inside private LAN and drops arbitrary paths/query', () => {
  assert.equal(sensorUrl('http://192.168.1.50/something?token=x'), 'http://192.168.1.50/measures/current');
  assert.equal(sensorUrl('http://airgradient_123.local'), 'http://airgradient_123.local/measures/current');
  for (const url of ['https://example.com', 'file:///tmp/a', 'http://user:pass@192.168.1.1', 'http://172.32.0.1'])
    assert.throws(() => sensorUrl(url));
});
test('outdoor preserves missing values and separates archive/forecast using UTC epochs', () => {
  const result = parseOutdoor({ current: { time: 2000, us_aqi: 88, european_aqi: null, pm2_5: 0, pm10: -1 },
    current_units: {}, hourly: { time: [1000, 2000, 3000], us_aqi: [null, 88, 100] } }, 3000000);
  assert.equal(result.time, 2000000); assert.equal(result.metrics[0].value, 0);
  assert.equal(result.metrics[1].value, null); assert.equal(result.europeanAqi, null);
  assert.equal(result.history.length, 2); assert.equal(result.history[0].value, null);
  assert.equal(result.forecast.length, 1); assert.equal(result.forecast[0].time, 3000000);
  assert.throws(() => parseOutdoor({}));
});
test('AirGradient adapter chooses compensated fields, retains negative temperature and VOC unit', () => {
  const result = parseIndoor({ serialno: 'test', pm02: 10, pm02Compensated: 7, atmp: -3, rco2: 600, tvocIndex: 100, rhum: 110 });
  assert.equal(result.metrics.find(m => m.key === 'pm02')?.value, 7);
  assert.equal(result.metrics.find(m => m.key === 'atmp')?.value, -3);
  assert.equal(result.metrics.find(m => m.key === 'tvocIndex')?.unit, 'indeks');
  assert.equal(result.metrics.find(m => m.key === 'rhum')?.value, null);
  assert.throws(() => parseIndoor({ status: 'ok' }));
});
