import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import type { FeatureCollection } from 'geojson';
import 'leaflet/dist/leaflet.css';
import { countries, countryGraph } from '@/lib/countries';

interface MapProps {
  originId: string | null;
  destId: string | null;
  guessedIds: string[];
  errorIds?: string[];
}

export default function InteractiveMap({ originId, destId, guessedIds, errorIds = [] }: MapProps) {
  const [geoData, setGeoData] = useState<FeatureCollection | null>(null);

  useEffect(() => {
    fetch('/countries.geojson?v=3')
      .then(res => res.json())
      .then(data => setGeoData(data))
      .catch(err => console.error("Error loading geojson", err));
  }, []);

  const getCountryName = (iso: string) => {
    const c = countries.find(x => x.id === iso);
    return c ? c.name : iso;
  };

  const currentFrontier = guessedIds.length > 0 ? guessedIds[guessedIds.length - 1] : originId;
  const currentlyBordering = currentFrontier ? (countryGraph[currentFrontier] || []) : [];

  const styleFeature = (feature: any) => {
    const iso = feature.properties.iso;

    // Default style
    let fillOpacity = 1;
    let color = '#e2e8f0'; // slate-200 (grey default country fill)
    let weight = 1;
    let borderColor = '#94a3b8'; // slate-400 for visible borders

    if (iso === originId || iso === destId) {
      fillOpacity = 0.6;
      color = '#3b82f6'; // blue-500
      borderColor = 'white';
      weight = 2;
    } else if (guessedIds.includes(iso)) {
      fillOpacity = 0.6;
      color = '#22c55e'; // green-500
      borderColor = 'white';
      weight = 2;
    } else if (errorIds.includes(iso)) {
      const isYellow = currentlyBordering.includes(iso);
      fillOpacity = 0.6;
      color = isYellow ? '#eab308' : '#ef4444'; // yellow-500 or red-500
      borderColor = 'white';
      weight = 2;
    }

    return {
      fillColor: color,
      weight: weight,
      opacity: 1,
      color: borderColor,
      fillOpacity: fillOpacity
    };
  };

  const onEachFeature = (feature: any, layer: any) => {
    const iso = feature.properties.iso;
    if (iso === originId || iso === destId || guessedIds.includes(iso) || errorIds.includes(iso)) {
      const isYellow = errorIds.includes(iso) && currentlyBordering.includes(iso);
      const textColorClass = isYellow ? 'text-yellow-800' : (errorIds.includes(iso) ? 'text-red-800' : (iso === originId || iso === destId ? 'text-blue-800' : 'text-green-800'));
      layer.bindTooltip(getCountryName(iso), { permanent: true, className: `country-label font-bold text-sm bg-transparent border-none shadow-none ${textColorClass}` });
    }
  };

  return (
    <div className="absolute inset-0 w-full h-full z-0 bg-[#e2e8f0]">
      <MapContainer
        center={[20.0, 0.0]}
        zoom={2}
        scrollWheelZoom={true}
        style={{ height: '100vh', width: '100vw' }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
        />
        {geoData && (
          <GeoJSON
            key={`${originId}-${destId}-${guessedIds.join(',')}`}
            data={geoData}
            style={styleFeature}
            onEachFeature={onEachFeature}
          />
        )}
      </MapContainer>
      <style>{`
        .country-label {
          background: rgba(255, 255, 255, 0.7) !important;
          border: none !important;
          box-shadow: none !important;
        }
      `}</style>
    </div>
  );
}
