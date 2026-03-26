import * as turf from '@turf/turf';
import { useEffect, useState, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap, Polyline, Marker } from 'react-leaflet';
import L from 'leaflet';
import type { FeatureCollection } from 'geojson';
import 'leaflet/dist/leaflet.css';
import { countries, countryGraph, getCountryName } from '@/lib/countries';
import { useParams } from 'next/navigation';
import BorderArrow from './BorderArrow';

interface MapProps {
  originId: string | null;
  destId: string | null;
  guessedIds: string[];
  errorIds?: string[];
  focusErrorIso?: string | null;
  setFocusErrorIso?: (iso: string | null) => void;
}

export default function InteractiveMap({ originId, destId, guessedIds, errorIds = [], focusErrorIso = null, setFocusErrorIso }: MapProps) {
  const params = useParams();
  const lang = (params?.lang as string) || 'pt';
  const [geoData, setGeoData] = useState<FeatureCollection | null>(null);
  const geoJsonRef = useRef<L.GeoJSON>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    fetch('/countries.geojson?v=3')
      .then(res => res.json())
      .then(data => setGeoData(data))
      .catch(err => console.error("Error loading geojson", err));
  }, []);


  const isCompleted = destId && guessedIds.includes(destId);
  const currentFrontier = guessedIds.length > 0
    ? (isCompleted && guessedIds.length > 1 ? guessedIds[guessedIds.length - 2] : (isCompleted ? originId : guessedIds[guessedIds.length - 1]))
    : originId;

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

        if (iso === originId || (iso === destId && destId && !guessedIds.includes(destId))) {
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

          let labelText = getCountryName(iso, lang);
          if (guessedIds.includes(iso)) {
            const index = guessedIds.indexOf(iso) + 1;
            let extra = (iso === destId) ? `<div class="text-[10px] uppercase tracking-wider text-green-900 bg-white/70 px-1 rounded mb-0.5 mt-1">${lang === 'en' ? 'Dest' : 'Destino'}</div>` : '';
            labelText = `<div class="flex flex-col items-center justify-center -mt-2"><div class="bg-green-700 text-white rounded-full w-5 h-5 flex items-center justify-center font-black mt-1 p-3 text-[12px] shadow-sm">${index}</div>${extra}<span class="mt-0.5 whitespace-nowrap drop-shadow-md text-[13px] bg-white/60 px-1 rounded truncate leading-tight">${getCountryName(iso, lang)}</span></div>`;
          } else if (iso === originId) {
            labelText = `<div class="flex flex-col items-center justify-center -mt-2"><div class="text-[10px] uppercase tracking-wider text-blue-900 bg-white/70 px-1 rounded mb-0.5 shadow-sm font-black">${lang === 'en' ? 'Orig' : 'Origem'}</div><span class="mt-0.5 whitespace-nowrap drop-shadow-md text-[14px] bg-white/60 px-1.5 rounded truncate leading-tight text-blue-800">${getCountryName(iso, lang)}</span></div>`;
          } else if (iso === destId) {
            labelText = `<div class="flex flex-col items-center justify-center -mt-2"><div class="text-[10px] uppercase tracking-wider text-blue-900 bg-white/70 px-1 rounded mb-0.5 shadow-sm font-black">${lang === 'en' ? 'Dest' : 'Destino'}</div><span class="mt-0.5 whitespace-nowrap drop-shadow-md text-[14px] bg-white/60 px-1.5 rounded truncate leading-tight text-blue-800">${getCountryName(iso, lang)}</span></div>`;
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
  }, [geoData, originId, destId, guessedIds, errorIds, currentlyBordering, focusErrorIso]);

  return (
    <div className="absolute inset-0 w-full h-full z-0 bg-[#e2e8f0]">
      <MapContainer
        center={[20.0, 0.0]}
        zoom={2}
        minZoom={2}
        maxBounds={[[-90, -180], [90, 180]]}
        maxBoundsViscosity={1.0}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
        whenCreated={(m) => (mapRef.current = m)}
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
        />
        <MapCenterController geoJsonRef={geoJsonRef} focusIso={focusErrorIso || originId} setFocusErrorIso={setFocusErrorIso} />
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
        <ArrowsController currentFrontier={currentFrontier} currentlyBordering={currentlyBordering} geoJsonRef={geoJsonRef} geoData={geoData} />
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

export function MapCenterController({ geoJsonRef, focusIso, setFocusErrorIso }: { geoJsonRef: React.RefObject<any>, focusIso: string | null, setFocusErrorIso?: (iso: string | null) => void }) {
  const map = useMap();

  useEffect(() => {
    if (!geoJsonRef.current || !focusIso) return;

    // Slight delay to ensure the GeoJSON layer is fully attached to the map
    setTimeout(() => {
      if (!geoJsonRef.current) return;
      const layers = geoJsonRef.current.getLayers();
      const targetLayer = layers.find((l: any) => l.feature?.properties?.iso === focusIso);

      if (targetLayer && targetLayer.feature) {
        // Use turf.bbox as requested
        const bbox = turf.bbox(targetLayer.feature);
        // bbox format is [minLng, minLat, maxLng, maxLat]
        const bounds = L.latLngBounds(
          [bbox[1], bbox[0]], // SouthWest: [minLat, minLng]
          [bbox[3], bbox[2]]  // NorthEast: [maxLat, maxLng]
        );
        map.flyToBounds(bounds, { padding: [50, 50], duration: 1.5, maxZoom: 6 });
        // After animation ends, clear focus to allow styles to reapply normally
        if (setFocusErrorIso) setTimeout(() => setFocusErrorIso(null), 1600);
      }
    }, 200);
  }, [map, geoJsonRef, focusIso, setFocusErrorIso]);

  return null;
}

export function ArrowsController({ currentFrontier, currentlyBordering, geoData }: any) {
  if (!geoData || !currentFrontier || !currentlyBordering || currentlyBordering.length === 0) return null;

  const frontierFeature = geoData.features.find((f: any) => f.properties?.iso === currentFrontier);
  if (!frontierFeature) return null;

  const borderingFeatures = geoData.features.filter((f: any) => currentlyBordering.includes(f.properties?.iso));

  if (borderingFeatures.length === 0) return null;

  return (
    <div style={{ zIndex: 999 }}>
      {borderingFeatures.map((bFeature: any) => (
        <BorderArrow
          key={bFeature.properties.iso}
          countryA={frontierFeature}
          countryB={bFeature}
        />
      ))}
    </div>
  );
}
