const fs = require('fs');
const https = require('https');
const path = require('path');

const url = 'https://raw.githubusercontent.com/mledoze/countries/master/countries.json';

https.get(url, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    const rawCountries = JSON.parse(data);
    const borders = {};
    const ptNames = {};

    rawCountries.forEach((country) => {
        const id = country.cca3;
        borders[id] = country.borders || [];
        
        let ptName = id;
        if (country.translations && country.translations.por) {
            ptName = country.translations.por.common;
        }
        ptNames[id] = ptName;
    });

    const dataDir = path.join(__dirname, '..', 'src', 'data');
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }

    fs.writeFileSync(path.join(dataDir, 'borders.json'), JSON.stringify(borders, null, 2));
    fs.writeFileSync(path.join(dataDir, 'countries-pt-br.json'), JSON.stringify(ptNames, null, 2));

    console.log('✅ Dados de países atualizados com sucesso (borders.json e countries-pt-br.json)!');
  });
}).on('error', (err) => {
  console.log('Erro ao buscar dados:', err.message);
});
