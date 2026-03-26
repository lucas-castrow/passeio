import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import type { FeatureCollection } from 'geojson';
import 'leaflet/dist/leaflet.css';
import { countries } from '@/lib/countries';

interface MapProps {
  originId: string | null;
  destId: string | null;
  guessedIds: string[];
  errorIds?: string[];
}

export default function InteractiveMap({ originId, destId, guessedIds, errorIds = [] }: MapProps) {
  const [geoData, setGeoData] = useState<FeatureCollection | null>(null);

  useEffect(() => {
    fetch('/countries.geojson')
      .then(res => res.json())
      .then(data => setGeoData(data))
      .catch(err => console.error("Error loading geojson", err));
  }, []);

  const getCountryName = (iso: string) => {
    const c = countries.find(x => x.id === iso);
    return c ? c.name : iso;
  };

  const styleFeature = (feature: any) => {
    const iso = feature.properties.iso;

    // Default style (hidden or very faint)
    let fillOpacity = 0;
    let color = 'transparent';
    let weight = 1;

    if (iso === originId || iso === destId) {
      fillOpacity = 0.6;
      color = '#3b82f6'; // blue-500
    } else if (guessedIds.includes(iso)) {
      fillOpacity = 0.6;
      color = '#22c55e'; // green-500
    } else if (errorIds.includes(iso)) {
      fillOpacity = 0.6;
      color = '#ef4444'; // red-500
    }

    return {
      fillColor: color,
      weight: color !== 'transparent' ? 2 : 0,
      opacity: 1,
      color: color !== 'transparent' ? 'white' : 'transparent',
      fillOpacity
    };
  };

  const onEachFeature = (feature: any, layer: any) => {
    const iso = feature.properties.iso;
    if (iso === originId || iso === destId || guessedIds.includes(iso) || errorIds.includes(iso)) {
      const textColorClass = errorIds.includes(iso) ? 'text-red-800' : (iso === originId || iso === destId ? 'text-blue-800' : 'text-green-800');
      layer.bindTooltip(getCountryName(iso), { permanent: true, direction: "center", className: `country-label font-bold text-sm bg-transparent border-none shadow-none ${textColorClass}` });
    }
  };

  return (
    <div className="w-full h-[400px] sm:h-[500px] rounded-lg overflow-hidden border border-green-300 shadow-md relative z-0">
      <MapContainer
        center={[20.0, 0.0]}
        zoom={2}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
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
