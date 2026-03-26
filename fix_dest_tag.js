const fs = require('fs');
const file = 'src/components/Map.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "labelText = `<div class=\"flex flex-col items-center justify-center -mt-2\"><div class=\"bg-green-700 text-white rounded-full w-5 h-5 flex items-center justify-center font-black mt-1 p-3 text-[12px] shadow-sm\">\${index}</div><span class=\"mt-0.5 whitespace-nowrap drop-shadow-md text-[13px] bg-white/60 px-1 rounded truncate leading-tight\">\${getCountryName(iso)}</span></div>`;",
  "let extra = (iso === destId) ? `<div class=\"text-[10px] uppercase tracking-wider text-green-900 bg-white/70 px-1 rounded mb-0.5 mt-1\">Destino</div>` : '';\n            labelText = `<div class=\"flex flex-col items-center justify-center -mt-2\"><div class=\"bg-green-700 text-white rounded-full w-5 h-5 flex items-center justify-center font-black mt-1 p-3 text-[12px] shadow-sm\">\${index}</div>\${extra}<span class=\"mt-0.5 whitespace-nowrap drop-shadow-md text-[13px] bg-white/60 px-1 rounded truncate leading-tight\">\${getCountryName(iso)}</span></div>`;"
);

fs.writeFileSync(file, content);
