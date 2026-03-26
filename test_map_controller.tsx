import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

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
