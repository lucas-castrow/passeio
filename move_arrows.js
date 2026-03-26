const fs = require('fs');
const file = 'src/components/Map.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  '        <ArrowsController currentFrontier={currentFrontier} currentlyBordering={currentlyBordering} geoJsonRef={geoJsonRef} geoData={geoData} />\n        {geoData && (',
  '        {geoData && ('
);

content = content.replace(
  '          />\n        )}\n      </MapContainer>',
  '          />\n        )}\n        <ArrowsController currentFrontier={currentFrontier} currentlyBordering={currentlyBordering} geoJsonRef={geoJsonRef} geoData={geoData} />\n      </MapContainer>'
);

fs.writeFileSync(file, content);
