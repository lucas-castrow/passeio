const fs = require('fs');
const https = require('https');
const path = require('path');

const url = 'https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson';
const targetPath = path.join(__dirname, '..', 'public', 'countries.geojson');

https.get(url, (res) => {
  let data = '';
  res.on('data', chunk => { data += chunk; });
  res.on('end', () => {
    try {
      const geojson = JSON.parse(data);

      const customIsoMap = {
        'France': 'FRA',
        'Norway': 'NOR',
        'Kosovo': 'UNK',
        'Northern Cyprus': 'CYP',
        'Somaliland': 'SOM'
      };

      // Map correctly
      geojson.features.forEach(f => {
        let iso = f.properties['ISO3166-1-Alpha-3'];
        const name = f.properties.name;

        if (iso === '-99' && customIsoMap[name]) {
          iso = customIsoMap[name];
        }
        f.properties = { iso: iso };
      });

      const fra2 = geojson.features.find(f => f.properties.iso === 'FRA');
      console.log('FRA exists now:', !!fra2);

      fs.writeFileSync(targetPath, JSON.stringify(geojson));
      console.log('✅ GeoJSON baixado, minimizado e corrigido!');
    } catch (e) {
      console.error(e);
    }
  });
});
