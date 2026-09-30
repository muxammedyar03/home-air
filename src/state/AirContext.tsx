import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Home, Sensor, Outdoor, Indoor, coordinates, sensorUrl } from '../domain/air';
import { openMeteo, airGradient } from '../services/providers';

const KEY = 'home-air:v1';
type Settings = { home: Home | null; sensor: Sensor | null };
type State = Settings & {
  ready: boolean; outdoor: Outdoor | null; indoor: Indoor | null; loading: boolean;
  outdoorError: string; sensorError: string; storageError: string;
  saveHome(home: Home): Promise<void>; saveSensor(sensor: Sensor | null): Promise<void>; refresh(): Promise<void>;
};
const Context = createContext<State | null>(null);
const message = (e: unknown) => e instanceof Error ? e.message : 'Ulanish amalga oshmadi.';

export function AirProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>({ home: null, sensor: null });
  const [ready, setReady] = useState(false); const [outdoor, setOutdoor] = useState<Outdoor | null>(null);
  const [indoor, setIndoor] = useState<Indoor | null>(null); const [loading, setLoading] = useState(false);
  const [outdoorError, setOutdoorError] = useState(''); const [sensorError, setSensorError] = useState('');
  const [storageError, setStorageError] = useState('');
  const epoch = useRef(0); const sensorEpoch = useRef(0);
  const invalidateOutdoor = useCallback(() => { epoch.current++; }, []);
  const invalidateSensor = useCallback(() => { sensorEpoch.current++; }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as Settings;
          if (parsed.home) coordinates(String(parsed.home.latitude), String(parsed.home.longitude));
          if (parsed.sensor) sensorUrl(parsed.sensor.url);
          if (alive) setSettings({ home: parsed.home ?? null, sensor: parsed.sensor ?? null });
        }
      } catch { if (alive) setStorageError('Saqlangan sozlamalarni o‘qib bo‘lmadi. Manzilni qayta saqlang.'); }
      finally { if (alive) setReady(true); }
    })();
    return () => { alive = false; };
  }, []);

  const persist = async (next: Settings) => {
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
    if (next.home !== settings.home) { invalidateOutdoor(); setOutdoor(null); setOutdoorError(''); setLoading(false); }
    if (next.sensor !== settings.sensor) { invalidateSensor(); setIndoor(null); setSensorError(''); }
    setSettings(next); setStorageError('');
  };

  const refreshOutdoor = useCallback(async () => {
    if (!settings.home) return;
    const generation = ++epoch.current; setLoading(true);
    try { const result = await openMeteo.read(settings.home);
      if (generation === epoch.current) { setOutdoor(result); setOutdoorError(''); }
    } catch (e) { if (generation === epoch.current) setOutdoorError(message(e)); }
    finally { if (generation === epoch.current) setLoading(false); }
  }, [settings.home]);

  const refreshSensor = useCallback(async () => {
    if (!settings.sensor) return;
    const generation = ++sensorEpoch.current;
    try { const result = await airGradient.read(settings.sensor);
      if (generation === sensorEpoch.current) { setIndoor(result); setSensorError(''); }
    } catch (e) { if (generation === sensorEpoch.current) setSensorError(message(e)); }
  }, [settings.sensor]);

  useEffect(() => {
    if (!ready) return;
    const initial = setTimeout(() => { void refreshOutdoor(); }, 0);
    const timer = setInterval(() => { if (AppState.currentState === 'active') void refreshOutdoor(); }, 300000);
    const listener = AppState.addEventListener('change', state => { if (state === 'active') void refreshOutdoor(); });
    return () => { clearTimeout(initial); clearInterval(timer); listener.remove(); invalidateOutdoor(); };
  }, [ready, refreshOutdoor, invalidateOutdoor]);

  useEffect(() => {
    if (!ready) return;
    const initial = setTimeout(() => { void refreshSensor(); }, 0);
    const timer = setInterval(() => { if (AppState.currentState === 'active') void refreshSensor(); }, 60000);
    const listener = AppState.addEventListener('change', state => { if (state === 'active') void refreshSensor(); });
    return () => { clearTimeout(initial); clearInterval(timer); listener.remove(); invalidateSensor(); };
  }, [ready, refreshSensor, invalidateSensor]);

  return <Context.Provider value={{ ...settings, ready, outdoor, indoor, loading, outdoorError, sensorError, storageError,
    saveHome: home => persist({ ...settings, home }), saveSensor: sensor => persist({ ...settings, sensor }),
    refresh: async () => { await Promise.allSettled([refreshOutdoor(), refreshSensor()]); },
  }}>{children}</Context.Provider>;
}

export function useAir() {
  const context = useContext(Context); if (!context) throw new Error('AirProvider topilmadi.'); return context;
}
