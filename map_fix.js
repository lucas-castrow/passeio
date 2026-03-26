const fs = require('fs');
const file = 'src/components/Map.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';",
  "import { MapContainer, TileLayer, GeoJSON, useMap, Polyline, Marker } from 'react-leaflet';"
);

content = content.replace(
  "  const currentFrontier = guessedIds.length > 0 ? guessedIds[guessedIds.length - 1] : originId;",
  `  const isCompleted = destId && guessedIds.includes(destId);
  const currentFrontier = guessedIds.length > 0 
      ? (isCompleted && guessedIds.length > 1 ? guessedIds[guessedIds.length - 2] : (isCompleted ? originId : guessedIds[guessedIds.length - 1]))
      : originId;`
);

const colorsLogic = `        if (iso === originId || (iso === destId && !guessedIds.includes(destId))) {
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
        }`;

// Replace the old strictly 'if (iso === originId || iso === destId)' logic block
content = content.replace(/        if \(iso === originId \|\| iso === destId\) \{\s+fillOpacity = [^}]+\} else if \(guessedIds\.includes\(iso\)\) \{\s+fillOpacity = [^}]+\s+if \(iso === currentFrontier\) isCurrent = true;\s+\} else if \(errorIds\.includes\(iso\)\) \{\s+isYellow = [^}]+\}/, colorsLogic);

// Add arrows rendering component
const arrowsComponent = `
export function ArrowsController({ currentFrontier, currentlyBordering, geoJsonRef }: any) {
    const [arrows, setArrows] = useState<any[]>([]);

    useEffect(() => {
        if (!geoJsonRef.current || !currentFrontier) {
            setArrows([]);
            return;
        }

        const timer = setTimeout(() => {
            let fCenter: any = null;
            let bCenters: any[] = [];
            
            if (!geoJsonRef.current) return;
            
            geoJsonRef.current.eachLayer((layer: any) => {
                const iso = layer.feature?.properties?.iso;
                if (!iso) return;
                
                if (iso === currentFrontier) {
                    if (layer.getBounds) fCenter = layer.getBounds().getCenter();
                } else if (currentlyBordering.includes(iso)) {
                    if (layer.getBounds) bCenters.push({ iso, center: layer.getBounds().getCenter() });
                }
            });

            if (fCenter) {
                const newArrows = bCenters.map(bc => {
                    const lat1 = fCenter.lat;
                    const lng1 = fCenter.lng;
                    const lat2 = bc.center.lat;
                    const lng2 = bc.center.lng;

                    const midLat = (lat1 + lat2) / 2;
                    const midLng = (lng1 + lng2) / 2;
                    
                    const angle = Math.atan2(lng2 - lng1, lat2 - lat1) * (180 / Math.PI);
                    
                    return {
                        id: bc.iso,
                        positions: [[lat1, lng1], [lat2, lng2]],
                        midLat,
                        midLng,
                        angle
                    };
                });
                setArrows(newArrows);
            } else {
                setArrows([]);
            }
        }, 100);

        return () => clearTimeout(timer);
    }, [currentFrontier, currentlyBordering, geoJsonRef]);

    if (arrows.length === 0) return null;

    return (
        <>
            {arrows.map((arr) => (
                <div key={arr.id}>
                    <Polyline 
                        positions={arr.positions as [number, number][]} 
                        pathOptions={{ color: '#fbbf24', weight: 3, dashArray: '5,5', opacity: 0.8 }} 
                    />
                    <Marker 
                        position={[arr.midLat, arr.midLng]} 
                        icon={L.divIcon({
                            html: \`<div style="transform: rotate(\${arr.angle}deg); display: flex; align-items: center; justify-content: center; width: 14px; height: 14px; background: #fbbf24; border-radius: 50%; border: 1.5px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.3);"><div style="width: 0; height: 0; border-left: 3px solid transparent; border-right: 3px solid transparent; border-bottom: 5px solid white; margin-bottom: 1px;"></div></div>\`,
                            className: '',
                            iconSize: [14, 14],
                            iconAnchor: [7, 7]
                        })}
                    />
                </div>
            ))}
        </>
    );
}
`;

content += "\n" + arrowsComponent;

// Add <ArrowsController /> inside <MapContainer>
const mapContainerTarget = `        <MapCenterController geoJsonRef={geoJsonRef} focusIso={originId} />`;
content = content.replace(mapContainerTarget, mapContainerTarget + `\n        <ArrowsController currentFrontier={currentFrontier} currentlyBordering={currentlyBordering} geoJsonRef={geoJsonRef} />`);

fs.writeFileSync(file, content);
