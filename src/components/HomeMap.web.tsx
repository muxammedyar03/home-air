import React from 'react';
import { Home } from '../domain/air';
import { Notice } from './ui';

export default function HomeMap({ point }: { point: Home; onChange(point: Home): void }) {
  const { latitude: lat, longitude: lon } = point;
  const bbox = `${lon - .015},${lat - .01},${lon + .015},${lat + .01}`;
  return <><iframe title="Uy joylashuvi" style={{ width: '100%', height: 235, border: 0, borderRadius: 16 }}
    src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lon}`} />
    <Notice>Web ko‘rinishda koordinatalar bilan tanlang. Android xaritasida nuqtani bosib yoki markerni surib tanlash mumkin.</Notice></>;
}
