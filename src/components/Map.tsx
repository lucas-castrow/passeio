import * as turf from '@turf/turf';
import { useEffect, useState, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap, Polyline, Marker } from 'react-leaflet';
import L from 'leaflet';
import type { FeatureCollection } from 'geojson';
import 'leaflet/dist/leaflet.css';
import { countries, countryGraph, getCountryName } from '@/lib/countries';
import { useParams } from 'next/navigation';
// Border arrows removed — visualized via darker neighbor fill instead

interface MapProps {
  originId: string | null;
  destId: string | null;
  guessedIds: string[];
  errorIds?: string[];
  focusErrorIso?: string | null;
  setFocusErrorIso?: (iso: string | null) => void;
  refreshTrigger?: number;
}

interface BBox { minx: number; miny: number; maxx: number; maxy: number; }

function getPolygonBBox(polygon: number[][]): BBox {
  let minx = Number.POSITIVE_INFINITY;
  let miny = Number.POSITIVE_INFINITY;
  let maxx = Number.NEGATIVE_INFINITY;
  let maxy = Number.NEGATIVE_INFINITY;
  for (const [x, y] of polygon) {
    if (x < minx) minx = x;
    if (y < miny) miny = y;
    if (x > maxx) maxx = x;
    if (y > maxy) maxy = y;
  }
  return { minx, miny, maxx, maxy };
}

function getTerritoryIso(originalIso: string, bbox: BBox): string {
  // French overseas splits
  if (originalIso === 'FRA') {
    if (bbox.minx >= -56 && bbox.maxx <= -50 && bbox.miny >= 1 && bbox.maxy <= 7) return 'GUF';
    if (bbox.minx >= 54 && bbox.maxx <= 56 && bbox.miny >= -22 && bbox.maxy <= -20) return 'REU';
    if (bbox.minx >= 44 && bbox.maxx <= 46 && bbox.miny >= -13.5 && bbox.maxy <= -12.4) return 'MYT';
    if (bbox.minx >= -63.5 && bbox.maxx <= -62.5 && bbox.miny >= 17.8 && bbox.maxy <= 18.3) return 'MAF';
    if (bbox.minx >= -63.2 && bbox.maxx <= -62.8 && bbox.miny >= 17.4 && bbox.maxy <= 18.1) return 'SXM';
    if (bbox.minx >= -62.5 && bbox.maxx <= -60 && bbox.miny >= 14 && bbox.maxy <= 15.5) return 'MTQ';
    if (bbox.minx >= -62.5 && bbox.maxx <= -60 && bbox.miny >= 15.5 && bbox.maxy <= 17.5) return 'GLP';
  }

  // Dutch overseas splits
  if (originalIso === 'NLD') {
    if (bbox.minx >= -69.2 && bbox.maxx <= -67.7 && bbox.miny >= 11.6 && bbox.maxy <= 13.4) return 'BES';
    if (bbox.minx >= -63.5 && bbox.maxx <= -62.5 && bbox.miny >= 17.4 && bbox.maxy <= 18.5) return 'SXM';
  }

  return originalIso;
}

function splitMultiPolygonFeature(feature: FeatureCollection['features'][number]): FeatureCollection['features'] {
  if (feature.geometry.type !== 'MultiPolygon') {
    return [feature];
  }

  const splitFeatures: FeatureCollection['features'] = [];
  for (const subPolygon of feature.geometry.coordinates) {
    const mappedBBox = getPolygonBBox(subPolygon[0]);
    const targetIso = getTerritoryIso(feature.properties.iso, mappedBBox);

    splitFeatures.push({
      type: 'Feature',
      properties: { iso: targetIso },
      geometry: { type: 'Polygon', coordinates: subPolygon }
    });
  }

  return splitFeatures;
}

function splitTerritoryFeatures(geoData: FeatureCollection): FeatureCollection {
  if (!geoData || !Array.isArray(geoData.features)) return geoData;

  const newFeatures: FeatureCollection['features'] = [];
  for (const feature of geoData.features) {
    if (feature.geometry?.type === 'MultiPolygon') {
      newFeatures.push(...splitMultiPolygonFeature(feature));
    } else {
      newFeatures.push(feature);
    }
  }

  return { ...geoData, features: newFeatures };
}

export default function InteractiveMap({ originId, destId, guessedIds, errorIds = [], focusErrorIso = null, setFocusErrorIso, refreshTrigger = 0 }: MapProps) {
  const params = useParams();
  const lang = (params?.lang as string) || 'pt';
  const [geoData, setGeoData] = useState<FeatureCollection | null>(null);
  const geoJsonRef = useRef<L.GeoJSON>(null);
  const mapRef = useRef<L.Map | null>(null);

  function MapReadySetter({ mapRef }: { mapRef: React.RefObject<L.Map | null> }) {
    const map = useMap();
    useEffect(() => {
      if (map) mapRef.current = map;
    }, [map]);
    return null;
  }
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.invalidateSize();
    }
  }, [geoData, refreshTrigger]);

  useEffect(() => {
    fetch('/countries.geojson?v=3')
      .then(res => res.json())
      .then(data => setGeoData(splitTerritoryFeatures(data)))
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
    if (!geoJsonRef.current) return;

    const labelledIsos = new Set<string>();

    geoJsonRef.current.eachLayer((layer: L.Layer) => {
      const geoJsonLayer = layer as unknown as L.GeoJSON;
      const iso = geoJsonLayer.feature?.properties?.iso;

      // Calculate style
      let fillOpacity = 1;
      let color = '#e2e8f0'; // slate-200
      let weight = 1;
      let borderColor = '#94a3b8'; // slate-400

      let isYellow = false;
      let isCurrent = false;

      if (iso === originId) {
        fillOpacity = 0.6;
        color = '#3b82f6';
        borderColor = 'white';
        weight = 2;
      } else if (iso === destId && destId && !guessedIds.includes(destId)) {
        fillOpacity = 0.6;
        color = '#3b82f6';
        borderColor = 'white';
        weight = 2;
      } else if (iso && guessedIds.includes(iso)) {
        fillOpacity = 0.6;
        if (iso === currentFrontier) {
          color = '#22c55e';
          isCurrent = true;
        } else {
          color = '#94a3b8';
        }
        borderColor = 'white';
        weight = 2;
      } else if (iso && errorIds.includes(iso)) {
        isYellow = currentlyBordering.includes(iso);
        fillOpacity = 0.6;
        color = isYellow ? '#eab308' : '#ef4444';
        borderColor = 'white';
        weight = 2;
      } else if (iso && currentlyBordering.includes(iso) && !guessedIds.includes(iso) && !errorIds.includes(iso) && iso !== originId && iso !== destId) {
        color = '#eab308';
        fillOpacity = 0.6;
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

      const isLabelCandidate = !!iso && (iso === originId || iso === destId || guessedIds.includes(iso) || errorIds.includes(iso));

      if (layer.getTooltip()) {
        layer.unbindTooltip();
      }

      if (isLabelCandidate && !labelledIsos.has(iso)) {
        labelledIsos.add(iso);

        const textColorClass = isYellow ? 'text-yellow-800' : (errorIds.includes(iso) ? 'text-red-800' : (iso === originId || iso === destId ? 'text-blue-800' : 'text-green-800'));

        let labelText = getCountryName(iso, lang);

        if (iso === originId) {
          labelText = `<div class="flex flex-col items-center justify-center -mt-2"><div class="text-[10px] uppercase tracking-wider text-blue-900 bg-white/70 px-1 rounded mb-0.5 shadow-sm font-black">${lang === 'en' ? 'Orig' : 'Origem'}</div><span class="mt-0.5 whitespace-nowrap drop-shadow-md text-[14px] bg-white/60 px-1.5 rounded truncate leading-tight text-blue-800">${getCountryName(iso, lang)}</span></div>`;
        } else if (iso === destId) {
          labelText = `<div class="flex flex-col items-center justify-center -mt-2"><div class="text-[10px] uppercase tracking-wider text-blue-900 bg-white/70 px-1 rounded mb-0.5 shadow-sm font-black">${lang === 'en' ? 'Dest' : 'Destino'}</div><span class="mt-0.5 whitespace-nowrap drop-shadow-md text-[14px] bg-white/60 px-1.5 rounded truncate leading-tight text-blue-800">${getCountryName(iso, lang)}</span></div>`;
        } else if (iso && guessedIds.includes(iso)) {
          const isCurrentStep = iso === currentFrontier;
          const index = guessedIds.lastIndexOf(iso) + 1;
          let extra = (iso === destId) ? `<div class="text-[10px] uppercase tracking-wider text-green-900 bg-white/70 px-1 rounded mb-0.5 mt-1">${lang === 'en' ? 'Dest' : 'Destino'}</div>` : '';
          if (isCurrentStep) {
            labelText = `<div class="flex flex-col items-center justify-center -mt-2"><div class="bg-green-700 text-white rounded-full w-5 h-5 flex items-center justify-center font-black mt-1 p-3 text-[12px] shadow-sm">${index}</div>${extra}<span class="mt-0.5 whitespace-nowrap drop-shadow-md text-[13px] bg-white/60 px-1 rounded truncate leading-tight">${getCountryName(iso, lang)}</span></div>`;
          } else {
            labelText = `<div class="flex flex-col items-center justify-center -mt-2">${extra}<span class="mt-0.5 whitespace-nowrap drop-shadow-md text-[13px] bg-white/60 px-1 rounded truncate leading-tight">${getCountryName(iso, lang)}</span></div>`;
          }
        }

        layer.bindTooltip(labelText, {
          permanent: true,
          direction: 'center',
          className: `country-label font-bold text-[13px] bg-transparent border-none shadow-none ${textColorClass}`
        });
      }
    });
  }, [geoData, originId, destId, guessedIds, errorIds, currentlyBordering, focusErrorIso, refreshTrigger]);

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
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
        />
        <MapReadySetter mapRef={mapRef} />
        <MapCenterController geoJsonRef={geoJsonRef} focusIso={focusErrorIso} setFocusErrorIso={setFocusErrorIso} />
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
        {/* Arrows removed — neighbor countries are shown by a darker fill color. */}
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

export function MapCenterController({ geoJsonRef, focusIso, setFocusErrorIso }: { geoJsonRef: React.RefObject<L.GeoJSON | null>, focusIso: string | null, setFocusErrorIso?: (iso: string | null) => void }) {
  const map = useMap();

  useEffect(() => {
    if (!geoJsonRef.current || !focusIso) return;

    // Slight delay to ensure the GeoJSON layer is fully attached to the map
    setTimeout(() => {
      if (!geoJsonRef.current) return;
      const layers = geoJsonRef.current.getLayers();
      const targetLayer = layers.find((l: L.Layer) => (l as unknown as L.GeoJSON).feature?.properties?.iso === focusIso);

      if (targetLayer && targetLayer.feature) {
        // Use turf.bbox as requested
        const bbox = turf.bbox(targetLayer.feature);
        // bbox format is [minLng, minLat, maxLng, maxLat]
        const bounds = L.latLngBounds(
          [bbox[1], bbox[0]], // SouthWest: [minLat, minLng]
          [bbox[3], bbox[2]]  // NorthEast: [maxLat, maxLng]
        );
        map.flyToBounds(bounds, { padding: [50, 50], duration: 3.5, maxZoom: 6 });
        // After animation ends, clear focus to allow styles to reapply normally
        if (setFocusErrorIso) setTimeout(() => setFocusErrorIso(null), 1600);
      }
    }, 200);
  }, [map, geoJsonRef, focusIso, setFocusErrorIso]);

  return null;
}

// ArrowsController removed — arrows replaced by darker neighbor fill.
