import { useEffect, useState, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
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
  const geoJsonRef = useRef<L.GeoJSON>(null);

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

  // Memoize borders so it doesn't recalculate on every render loosely
  const currentlyBordering = useMemo(() => {
    return currentFrontier ? (countryGraph[currentFrontier] || []) : [];
  }, [currentFrontier]);

  // We use imperative updates to avoid re-rendering the heavy SVG layer
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!geoJsonRef.current) return;

      geoJsonRef.current.eachLayer((layer: any) => {
        const iso = layer.feature.properties.iso;

        // Calculate style
        let fillOpacity = 1;
        let color = '#e2e8f0'; // slate-200
        let weight = 1;
        let borderColor = '#94a3b8'; // slate-400

        let isYellow = false;
        let isCurrent = false;

        if (iso === originId || iso === destId) {
          fillOpacity = 0.6;
          color = '#3b82f6';
          borderColor = 'white';
          weight = 2;
        } else if (guessedIds.includes(iso)) {
          fillOpacity = 0.6;
          color = '#22c55e';
          borderColor = 'white';
          weight = 2;
          if (iso === currentFrontier) isCurrent = true;
        } else if (errorIds.includes(iso)) {
          isYellow = currentlyBordering.includes(iso);
          fillOpacity = 0.6;
          color = isYellow ? '#eab308' : '#ef4444';
          borderColor = 'white';
          weight = 2;
        }

        layer.setStyle({
          fillColor: color,
          weight: weight,
          opacity: 1,
          color: borderColor,
          fillOpacity: fillOpacity
        });

        // Handle label/tooltips removal first
        if (layer.getTooltip()) {
          layer.unbindTooltip();
        }

        // Re-bind tooltips dynamically
        if (iso === originId || iso === destId || guessedIds.includes(iso) || errorIds.includes(iso)) {
          const textColorClass = isYellow ? 'text-yellow-800' : (errorIds.includes(iso) ? 'text-red-800' : (iso === originId || iso === destId ? 'text-blue-800' : 'text-green-800'));

          let labelText = getCountryName(iso);
          if (guessedIds.includes(iso)) {
            const index = guessedIds.indexOf(iso) + 1;
            labelText = `<div class="flex flex-col items-center justify-center -mt-2"><div class="bg-green-700 text-white rounded-full w-5 h-5 flex items-center justify-center font-black mt-1 p-3 text-[12px] shadow-sm">${index}</div><span class="mt-0.5 whitespace-nowrap drop-shadow-md text-[13px] bg-white/60 px-1 rounded truncate leading-tight">${getCountryName(iso)}</span></div>`;
          } else if (iso === originId) {
            labelText = `<div class="text-xs uppercase tracking-wider text-blue-600 bg-white/70 px-1 rounded mb-0.5">Origem</div>${getCountryName(iso)}`;
          } else if (iso === destId) {
            labelText = `<div class="text-xs uppercase tracking-wider text-blue-600 bg-white/70 px-1 rounded mb-0.5">Destino</div>${getCountryName(iso)}`;
          }

          layer.bindTooltip(labelText, {
            permanent: true,
            direction: "center",
            className: `country-label font-bold text-[13px] bg-transparent border-none shadow-none ${textColorClass}`
          });
        }
      });
    }, 50); // Small 50ms delay queue to ensure layer is completely mounted
    return () => clearTimeout(timer);
  }, [geoData, originId, destId, guessedIds, errorIds, currentlyBordering]);

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
        <MapCenterController geoJsonRef={geoJsonRef} focusIso={originId} />
        {geoData && (
          <GeoJSON
            ref={geoJsonRef}
            data={geoData}
            // We provide a static initial style, and the UE imperatively updates it later
            style={{
              fillColor: '#e2e8f0',
              weight: 1,
              opacity: 1,
              color: '#94a3b8',
              fillOpacity: 1
            }}
          />
        )}
      </MapContainer>
      <style>{`
        .country-label {
          background: rgba(255, 255, 255, 0.0) !important;
          border: none !important;
          box-shadow: none !important;
          text-align: center;
        }
      `}</style>
    </div>
  );
}
export function MapCenterController({ geoJsonRef, focusIso }: { geoJsonRef: React.RefObject<any>, focusIso: string | null }) {
  const map = useMap();

  useEffect(() => {
    if (!geoJsonRef.current || !focusIso) return;

    // Slight delay to ensure the GeoJSON layer is fully attached to the map
    setTimeout(() => {
      if (!geoJsonRef.current) return;
      const layers = geoJsonRef.current.getLayers();
      const targetLayer = layers.find((l: any) => l.feature?.properties?.iso === focusIso);

      if (targetLayer && targetLayer.getBounds) {
        map.flyToBounds(targetLayer.getBounds(), { padding: [50, 50], duration: 1.5, maxZoom: 4 });
      }
    }, 200);
  }, [map, geoJsonRef, focusIso]);

  return null;
}
