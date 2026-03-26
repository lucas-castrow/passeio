import React, { useMemo } from 'react';
import { Polyline, Marker } from 'react-leaflet';
import L from 'leaflet';
import * as turf from '@turf/turf';

interface BorderArrowProps {
  countryA: any; // GeoJSON Feature
  countryB: any; // GeoJSON Feature
}

export default function BorderArrow({ countryA, countryB }: BorderArrowProps) {
  // Memoize heavy turf calculations
  const arrowData = useMemo(() => {
    if (!countryA || !countryB || !countryA.geometry || !countryB.geometry) return null;

    try {
      // 1. Simplify polygons to improve performance 
      const options = { tolerance: 0.05, highQuality: false };
      const simplifiedA = turf.simplify(countryA, options);
      const simplifiedB = turf.simplify(countryB, options);

      // 2. Explode to extract coordinate vertices
      const verticesA = turf.explode(simplifiedA);
      const verticesB = turf.explode(simplifiedB);

      // 3. Find closest pair of vertices
      let minDistance = Infinity;
      let closestPtA: any = null;
      let closestPtB: any = null;

      turf.featureEach(verticesA, (ptA) => {
        turf.featureEach(verticesB, (ptB) => {
          // Adjust for date line wrap in distance if needed? turf.distance uses great circle which is safe across date line.
          const dist = turf.distance(ptA, ptB);
          if (dist < minDistance) {
            minDistance = dist;
            closestPtA = ptA;
            closestPtB = ptB;
          }
        });
      });

      if (!closestPtA || !closestPtB) return null;

      // Extract coords [lng, lat]
      const coordA = turf.getCoord(closestPtA);
      const coordB = turf.getCoord(closestPtB);

      // Fix rendering gap across dateline (e.g. Russia to USA/Alaska)
      let lng1 = coordA[0];
      let lng2 = coordB[0];
      const lat1 = coordA[1];
      const lat2 = coordB[1];
      
      if (Math.abs(lng1 - lng2) > 180) {
        if (lng1 > lng2) lng2 += 360;
        else lng1 += 360;
      }

      // Calculate bearing from start to end
      // We can use the adjusted lngs just for Leaflet polyline rendering.
      // For accurate geographical bearing, we use the original Turf points.
      const bearing = turf.bearing(closestPtA, closestPtB);

      return {
        positions: [[lat1, lng1], [lat2, lng2]] as L.LatLngExpression[],
        midPt: [(lat1 + lat2) / 2, (lng1 + lng2) / 2] as [number, number],
        bearing
      };
    } catch (err) {
      console.error("Error calculating border arrow:", err);
      return null;
    }
  }, [countryA, countryB]);

  if (!arrowData) return null;

  // Custom arrow head SVG icon rotated to the correct bearing
  // Since Leaflet markers point UP (0 degrees) by default usually, if our SVG points UP.
  const arrowIcon = L.divIcon({
    className: 'custom-arrow-icon',
    html: `<div style="transform: rotate(${arrowData.bearing}deg); display: flex; align-items: center; justify-content: center; width: 100%; height: 100%;">
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFD700" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 22V2M19 9l-7-7-7 7"/>
             </svg>
           </div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });

  return (
    <>
      <Polyline
        positions={arrowData.positions}
        pathOptions={{
          color: '#FFD700',
          weight: 3,
          dashArray: '4, 6',
          opacity: 0.9,
          lineCap: 'round',
          lineJoin: 'round'
        }}
      />
      <Marker position={arrowData.midPt} icon={arrowIcon} />
    </>
  );
}
