const fs = require('fs');

const bordersFile = 'src/data/borders.json';
let borders = JSON.parse(fs.readFileSync(bordersFile, 'utf8'));

const pairs = [
  ['USA', 'RUS'],
  ['CAN', 'GRL'],
  ['GRL', 'ISL'],
  ['ISL', 'GBR'],
  ['AUS', 'IDN'],
  ['AUS', 'NZL'],
  ['AUS', 'PNG'],
  ['JPN', 'KOR'],
  ['JPN', 'RUS'],
  ['MDG', 'MOZ'],
  ['PHL', 'MYS'],
  ['IDN', 'SGP']
];

pairs.forEach(([a, b]) => {
  if (!borders[a]) borders[a] = [];
  if (!borders[b]) borders[b] = [];
  
  if (!borders[a].includes(b)) borders[a].push(b);
  if (!borders[b].includes(a)) borders[b].push(a);
});

fs.writeFileSync(bordersFile, JSON.stringify(borders, null, 2));
