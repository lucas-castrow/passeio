const fs = require('fs');
const file = 'src/components/Map.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  '<ArrowsController currentFrontier={currentFrontier} currentlyBordering={currentlyBordering} geoJsonRef={geoJsonRef} />',
  '<ArrowsController currentFrontier={currentFrontier} currentlyBordering={currentlyBordering} geoJsonRef={geoJsonRef} geoData={geoData} />'
);

content = content.replace(
  'export function ArrowsController({ currentFrontier, currentlyBordering, geoJsonRef }: any) {',
  'export function ArrowsController({ currentFrontier, currentlyBordering, geoJsonRef, geoData }: any) {'
);

content = content.replace(
  '}, [currentFrontier, currentlyBordering, geoJsonRef]);',
  '}, [currentFrontier, currentlyBordering, geoJsonRef, geoData]);'
);

const crossDateLineCode = `
                    let lng1 = fCenter.lng;
                    let lng2 = bc.center.lng;
                    
                    // Adjust for date line crossing (e.g. Russia -> USA)
                    if (Math.abs(lng1 - lng2) > 180) {
                        if (lng1 > lng2) lng2 += 360;
                        else lng1 += 360;
                    }
                    
                    const lat1 = fCenter.lat;
                    const lat2 = bc.center.lat;

                    const midLat = (lat1 + lat2) / 2;
                    let midLng = (lng1 + lng2) / 2;
                    if (midLng > 180) midLng -= 360;
`;

content = content.replace(
  `                    const lat1 = fCenter.lat;\n                    const lng1 = fCenter.lng;\n                    const lat2 = bc.center.lat;\n                    const lng2 = bc.center.lng;\n\n                    const midLat = (lat1 + lat2) / 2;\n                    const midLng = (lng1 + lng2) / 2;`,
  crossDateLineCode
);

fs.writeFileSync(file, content);
