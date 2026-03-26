import { countries } from '@/lib/countries';

interface SuccessModalProps {
  t?: any;
  isOpen: boolean;
  onClose: () => void;
  guessedIds: string[];
  idealPath: string[];
  minSteps: number;
}

export default function SuccessModal({ t, isOpen, onClose, guessedIds, idealPath, minSteps }: SuccessModalProps) {
  if (!isOpen) return null;

  const getCountryName = (iso: string) => {
    const c = countries.find(x => x.id === iso);
    return c ? c.name : iso;
  };

  const userSteps = guessedIds.length;
  const tt = t || {};
  let title = tt.completedTitle || "Viagem Concluída!";
  let subtitle = tt.completedSub || "Você chegou ao seu destino!";
  let colorClass = "bg-green-600";

  if (userSteps <= minSteps) {
    title = tt.perfectTitle || "Perfeito!";
    subtitle = tt.perfectSub || "Você escolheu a rota mais otimizada possível!";
    colorClass = "bg-blue-600";
  } else if (userSteps <= minSteps + 2) {
    title = tt.greatTitle || "Muito Bem!";
    subtitle = tt.greatSub || "Chegou super perto da rota ideal da perfeição!";
    colorClass = "bg-green-500";
  }

  // Build display path for the user's path: include origin and destination when idealPath is available
  const buildUserPath = () => {
    if (idealPath && idealPath.length > 0) {
      const originIso = idealPath[0];
      const destIso = idealPath[idealPath.length - 1];
      const middle = guessedIds.filter(iso => iso !== originIso && iso !== destIso);
      const display = [originIso, ...middle, destIso].filter(Boolean);
      return display.map(iso => getCountryName(iso)).join(' → ');
    }
    return guessedIds.map(iso => getCountryName(iso)).join(' → ');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl p-0 w-full max-w-lg shadow-2xl border-4 border-green-500 overflow-hidden transform scale-100 transition-all">

        <div className={`${colorClass} text-white p-6 text-center shadow-inner relative`}>
          <div className="absolute top-2 right-2 cursor-pointer hover:bg-white/20 p-2 rounded-full" onClick={onClose}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
          </div>
          <h2 className="text-4xl font-black tracking-tight mb-2 drop-shadow-md">{title}</h2>
          <p className="text-lg font-medium opacity-90">{subtitle}</p>
        </div>

        <div className="p-6">
          <div className="flex flex-col gap-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-sm relative pt-6 text-center">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-200 text-slate-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-300">
                {tt.yourPath || 'O SEU CAMINHO'}
              </div>
              <p className="text-slate-800 font-medium leading-relaxed">
                {buildUserPath()}
              </p>
              <div className="mt-2 text-sm text-slate-500 font-bold bg-white inline-block px-3 py-1 rounded-full border border-slate-200">
                {tt.totalSteps || 'Total de Passos:'} <span className="text-blue-600 text-lg">{userSteps}</span>
              </div>
            </div>

            {idealPath && idealPath.length > 0 && (
              <div className="bg-green-50 p-4 rounded-xl border border-green-200 shadow-sm relative pt-6 text-center">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-200 text-green-800 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-green-300">
                  {tt.idealRoute || 'ROTA IDEAL RECOMENDADA'}
                </div>
                <p className="text-green-800 font-medium leading-relaxed opacity-90">
                  {idealPath.map(iso => getCountryName(iso)).join(' → ')}
                </p>
                <div className="mt-2 text-sm text-green-700 font-bold bg-white inline-block px-3 py-1 rounded-full border border-green-200">
                  {tt.minSteps || 'Passos Mínimos:'} <span className="text-green-600 text-lg">{minSteps}</span>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={onClose}
            className="mt-6 w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3.5 px-4 rounded-xl transition-all duration-200 shadow-lg"
          >
            {tt.seeMap || 'Ver Mapa Final'}
          </button>
        </div>

      </div>
    </div>
  );
}
