"use client";

import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import IntroModal from '@/components/IntroModal';
import InputAutocomplete from '@/components/InputAutocomplete';
import InteractiveMap from '@/components/MapWrapper';
import { loadGameState, saveGameState, GameState } from '@/lib/storage';
import { countries } from '@/lib/countries';

export default function Home() {
  const [showIntro, setShowIntro] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState('');

  const [origin, setOrigin] = useState<{ id: string, name: string } | null>(null);
  const [destination, setDestination] = useState<{ id: string, name: string } | null>(null);
  const [minSteps, setMinSteps] = useState(0);
  const [idealPath, setIdealPath] = useState<string[]>([]);

  const [guessedIds, setGuessedIds] = useState<string[]>([]);
  const [errorIds, setErrorIds] = useState<string[]>([]);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    async function initialize() {
      try {
        const res = await fetch('/api/daily-puzzle');
        const data = await res.json();

        setOrigin(data.origin);
        setDestination(data.destination);
        setMinSteps(data.minSteps || 0);
        setIdealPath(data.idealPath || []);

        const savedState = loadGameState();

        if (!savedState || savedState.date !== data.date) {
          setShowIntro(true);
          const newState: GameState = { date: data.date, guesses: [], errors: [], completed: false };
          saveGameState(newState);
        } else {
          setGuessedIds(savedState.guesses);
          setErrorIds(savedState.errors || []);
          setCompleted(savedState.completed);
        }
      } catch (err) {
        console.error("Failed to load daily puzzle", err);
      } finally {
        setLoading(false);
      }
    }

    initialize();
  }, []);

  const handleGuess = async (isoCode: string) => {
    if (!origin || !destination) return;

    try {
      setErrorText('');
      const res = await fetch('/api/validate-guess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isoCode,
          originId: origin.id,
          destId: destination.id,
          currentGuesses: guessedIds
        })
      });

      const data = await res.json();

      const currentState = loadGameState() || { date: new Date().toISOString().slice(0, 10), guesses: [], errors: [], completed: false };

      if (!res.ok || !data.valid) {
        setErrorText(data.message || data.error || 'Tentativa inválida.');

        // Track the error if it hasn't been tracked yet
        const newErrorIds = [...errorIds];
        if (!newErrorIds.includes(isoCode)) {
          newErrorIds.push(isoCode);
          setErrorIds(newErrorIds);
          saveGameState({ ...currentState, errors: newErrorIds });
        }
        return;
      }

      const newGuessedIds = [...guessedIds, data.countryId];
      if (!guessedIds.includes(data.countryId)) {
        setGuessedIds(newGuessedIds);
      }

      const isComplete = data.reachedDestination;
      if (isComplete) {
        setCompleted(true);
      }

      saveGameState({
        ...currentState,
        guesses: newGuessedIds,
        completed: isComplete
      });

    } catch (err) {
      console.error('Erro na validação', err);
      setErrorText('Erro ao validar tentativa.');
    }
  };

  const undoGuess = (index: number) => {
    if (index < 0 || index >= guessedIds.length) return;

    // Slice removes the clicked element and everything after it
    const newGuessedIds = guessedIds.slice(0, index);
    setGuessedIds(newGuessedIds);
    setCompleted(false);

    const currentState = loadGameState() || { date: new Date().toISOString().slice(0, 10), guesses: [], errors: [], completed: false };
    saveGameState({
      ...currentState,
      guesses: newGuessedIds,
      completed: false
    });
  };

  const calculateScoreMessage = () => {
    const userSteps = guessedIds.length;
    if (userSteps <= minSteps) return "Perfeito! Você fez a rota mais otimizada!";
    if (userSteps <= minSteps + 2) return "Muito bem! Chegou perto da rota perfeita.";
    return "Deu uma volta ao mundo, mas conseguiu chegar!";
  };

  const getCountryName = (iso: string) => {
    const c = countries.find(x => x.id === iso);
    return c ? c.name : iso;
  };

  if (loading) {
    return <main className="min-h-screen bg-slate-50 flex items-center justify-center text-green-700">Carregando...</main>;
  }

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <IntroModal isOpen={showIntro} onClose={() => setShowIntro(false)} />

      <Header />

      <div className="flex-1 max-w-4xl w-full mx-auto p-4 flex flex-col gap-6">

        {/* Top Info Banner */}
        <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-100 relative">
          {errorIds.length > 0 && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-red-100 text-red-600 px-3 py-1 rounded-full text-xs font-bold border border-red-200 z-10 shadow-sm">
              Erros: {errorIds.length}
            </div>
          )}
          <div className="text-center w-1/3 mt-2">
            <span className="block text-xs uppercase tracking-wider text-blue-500 font-bold">Origem</span>
            <span className="block text-[15px] sm:text-lg font-bold text-blue-700 leading-tight">{origin?.name}</span>
          </div>
          <div className="w-1/3 px-2 flex flex-col items-center justify-center mt-2">
            <div className="h-[2px] bg-slate-200 w-full relative mb-1">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-[10px] sm:text-xs text-slate-400 whitespace-nowrap">
                {completed ? "Chegou!" : "para"}
              </div>
            </div>
            {minSteps > 0 && <span className="text-[9px] sm:text-[10px] text-slate-400 whitespace-nowrap">Par ideal: {minSteps}</span>}
          </div>
          <div className="text-center w-1/3 mt-2">
            <span className="block text-xs uppercase tracking-wider text-blue-500 font-bold">Destino</span>
            <span className="block text-[15px] sm:text-lg font-bold text-blue-700 leading-tight">{destination?.name}</span>
          </div>
        </div>

        {/* Input & Error */}
        <div className="flex flex-col gap-2 relative z-20">
          <InputAutocomplete onGuess={handleGuess} disabled={completed} />
          <div className="flex justify-center items-start w-full max-w-md mx-auto px-2">
            <p className="text-red-500 text-[13px] font-medium min-h-[20px] text-center">{errorText}</p>
          </div>
        </div>

        {/* Output Sequential list of guessed countries */}
        {guessedIds.length > 0 && (
          <div className="bg-white rounded-lg p-3 shadow-inner border border-slate-200 w-full max-w-md mx-auto relative group-container">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Seu Caminho:</h3>
              {!completed && (
                <button
                  onClick={() => undoGuess(guessedIds.length - 1)}
                  className="text-[10px] bg-red-50 text-red-500 hover:bg-red-100 px-2 py-1 rounded-md font-bold transition-colors flex items-center gap-1"
                  title="Desfazer último país"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7v6h6" /><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" /></svg>
                  Desfazer Último
                </button>
              )}
            </div>

            {!completed && (
              <p className="text-[10px] text-slate-400 mb-3 italic">Dica: Clique em qualquer país abaixo para desfazer a rota a partir dele.</p>
            )}

            <ul className="flex flex-wrap gap-2 justify-center">
              {guessedIds.map((iso, i) => (
                <li
                  key={`guess-${i}`}
                  onClick={() => !completed && undoGuess(i)}
                  title={!completed ? "Clique para remover este país e os seguintes" : ""}
                  className={`bg-green-100 text-green-800 text-sm py-1 px-3 rounded-full flex items-center gap-1 font-semibold group ${!completed ? 'cursor-pointer hover:bg-red-500 hover:text-white transition-colors' : ''}`}
                >
                  <span className={`font-normal text-[10px] ${!completed ? 'text-green-500 group-hover:text-red-200' : 'text-green-500'}`}>{i + 1}.</span>
                  <span className={!completed ? "group-hover:line-through" : ""}>{getCountryName(iso)}</span>
                  {i < guessedIds.length - 1 && <span className={`text-green-300 ml-1 ${!completed ? 'group-hover:text-red-300' : ''}`}>→</span>}
                </li>
              ))}
            </ul>

            {errorIds.length > 0 && (
              <div className="mt-4 pt-3 border-t border-slate-100">
                <h3 className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-2 text-center">Tentativas Erradas:</h3>
                <ul className="flex flex-wrap gap-1.5 justify-center">
                  {errorIds.map((iso, i) => (
                    <li key={`err-${i}`} className="bg-red-50 border border-red-200 text-red-600 text-[11px] py-0.5 px-2 rounded-md">
                      {getCountryName(iso)}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {completed && (
              <div className="mt-5 p-4 bg-green-600 text-white rounded-lg font-bold border border-green-700 text-center shadow-lg">
                {calculateScoreMessage()}
                <p className="text-sm font-normal mt-1 opacity-90">Passos usados: {guessedIds.length} / Ideal: {minSteps}</p>

                {idealPath && idealPath.length > 0 && (
                  <div className="mt-4 p-3 bg-green-800/40 rounded-md text-left">
                    <p className="text-[11px] uppercase tracking-wider text-green-200 mb-2">A Rota Ideal era:</p>
                    <p className="text-sm leading-relaxed text-green-50">
                      {idealPath.map(iso => getCountryName(iso)).join(' → ')}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Map Area */}
        <div className="flex-1 relative z-10 min-h-[350px]">
          <InteractiveMap
            originId={origin?.id || null}
            destId={destination?.id || null}
            guessedIds={guessedIds}
            errorIds={errorIds}
          />
        </div>

      </div>
    </main>
  );
}
