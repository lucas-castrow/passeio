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
      <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl border-4 border-green-500">
        <h2 className="text-3xl font-bold text-green-700 mb-4 tracking-tight">Bem-vindo, Viajante!</h2>

        <p className="text-slate-700 mb-4 leading-relaxed">
          Você é um explorador global experiente. Você acabou de chegar a uma nova região, mas seu mapa físico está danificado: <strong className="text-green-800">não há nomes de países!</strong>
        </p>

        <p className="text-slate-700 mb-6 leading-relaxed">
          Seu objetivo é decifrar a rota. Nós lhe damos o país de <span className="font-semibold text-blue-600">Origem</span> e o país de <span className="font-semibold text-red-500">Destino</span>. Você precisa digitar os nomes dos países que fazem fronteira entre eles para construir o seu caminho.
        </p>

        <div className="bg-green-50 rounded-lg p-4 border border-green-200 mb-6">
          <p className="text-green-800 italic text-sm">
            <strong>Dica:</strong> Tente encontrar a rota mais curta. Use o mapa abaixo para visualizar as formas dos países.
          </p>
        </div>

        <button
          onClick={onClose}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-xl transition-colors duration-200 shadow-lg shadow-green-200"
        >
          Começar Passeio
        </button>
      </div>
    </div>
  );
}