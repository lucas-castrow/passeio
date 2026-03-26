const fs = require('fs');
const file = 'src/components/IntroModal.tsx';
let content = fs.readFileSync(file, 'utf8');

const newItem = `
            <li className="flex items-start gap-3">
              <div className="relative flex items-center justify-center shrink-0 w-5 h-5 mt-0.5">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
              </div>
              <p className="text-sm text-slate-700 leading-tight">
                <strong className="text-yellow-600">Dica de Passagem (Setinhas):</strong> Linhas pontilhadas e setas amarelas no mapa marcam exatamente quais países fazem fronteira com a sua posição atual!
              </p>
            </li>
`;

content = content.replace('</ul>', newItem + '          </ul>');
fs.writeFileSync(file, content);
