// src/components/IntroModal.tsx
"use client";

interface IntroModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function IntroModal({ isOpen, onClose }: IntroModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl p-6 max-w-2xl w-full shadow-2xl border-4 border-green-500 overflow-y-auto max-h-[90vh] custom-scrollbar">
        <h2 className="text-2xl sm:text-3xl font-black text-green-700 mb-2 tracking-tight flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          Bem-vindo, Viajante!
        </h2>
        
        <p className="text-slate-600 mb-5 leading-relaxed text-sm sm:text-base">
          Seu mapa global perdeu os nomes dos países! O objetivo do jogo é encontrar uma rota de fronteiras conectadas do país de <strong className="text-blue-600">Origem</strong> até o país de <strong className="text-blue-600">Destino</strong>.
        </p>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-5">
          <h3 className="font-bold text-slate-700 mb-3 text-sm uppercase tracking-wider">Como funciona o mapa:</h3>
          
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <div className="w-5 h-5 mt-0.5 rounded bg-blue-500 border border-blue-600 shadow-sm shrink-0"></div>
              <p className="text-sm text-slate-700 leading-tight">
                <strong className="text-blue-700">Origem e Destino:</strong> Seus extremos (Início e Fim da viagem).
              </p>
            </li>
            
            <li className="flex items-start gap-3">
              <div className="w-5 h-5 mt-0.5 rounded bg-green-500 border border-green-600 shadow-sm shrink-0 flex items-center justify-center text-[10px] text-white font-bold">1</div>
              <p className="text-sm text-slate-700 leading-tight">
                <strong className="text-green-700">Caminho Correto (Números):</strong> Países que você acertou na rota. O número no meio do país mostra a <strong>ordem</strong> em que você o visitou!
              </p>
            </li>

            <li className="flex items-start gap-3">
              <div className="w-5 h-5 mt-0.5 rounded bg-red-500 border border-red-600 shadow-sm shrink-0"></div>
              <p className="text-sm text-slate-700 leading-tight">
                <strong className="text-red-600">Erro Distante:</strong> Você chutou esse país mas ele <em>não</em> faz fronteira com a sua posição atual.
              </p>
            </li>

            <li className="flex items-start gap-3">
              <div className="relative shrink-0 mt-0.5">
                <div className="w-5 h-5 rounded bg-yellow-400 border border-yellow-500 shadow-sm"></div>
                <div className="absolute -top-1 -right-1.5 bg-white rounded-full p-[1px]">
                  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/></svg>
                </div>
              </div>
              <p className="text-sm text-slate-700 leading-tight">
                <strong className="text-yellow-600">Dica de Fronteira (Amarelo):</strong> Aquele país que você errou antes ficou amarelo? Isso significa que ele <strong className="text-yellow-700">agora é VIZINHO</strong> da sua posição atual!
              </p>
            </li>
          </ul>
        </div>

        <button
          onClick={onClose}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 px-4 rounded-xl transition-all duration-200 shadow-lg shadow-green-200 text-lg flex justify-center items-center gap-2"
        >
          Começar Passeio
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
        </button>
      </div>
    </div>
  );
}
