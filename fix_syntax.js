const fs = require('fs');
const file = 'src/components/Map.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/\\\`/g, '`');
content = content.replace(/\\\$\\{/g, '${');

fs.writeFileSync(file, content);
