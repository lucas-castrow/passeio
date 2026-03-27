"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { dict } from '@/lib/dict';
import Header from '@/components/Header';
import IntroModal from '@/components/IntroModal';
import SuccessModal from '@/components/SuccessModal';
import InputAutocomplete from '@/components/InputAutocomplete';
import InteractiveMap from '@/components/MapWrapper';
import { loadGameState, saveGameState, GameState } from '@/lib/storage';
import { countries, countryGraph, getCountriesByLang, getCountryName } from '@/lib/countries';

export default function Home() {
  const params = useParams();
  const lang = (params?.lang as 'pt' | 'en') || 'pt';
  const t = dict[lang] || dict.pt;

  const [showIntro, setShowIntro] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState('');

  const [origin, setOrigin] = useState<{ id: string, name: string } | null>(null);
  const currentCountries = getCountriesByLang(lang);
  const [destination, setDestination] = useState<{ id: string, name: string } | null>(null);
  const [minSteps, setMinSteps] = useState(0);
  const [idealPath, setIdealPath] = useState<string[]>([]);

  const [pathHistory, setPathHistory] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [errorIds, setErrorIds] = useState<string[]>([]);
  const [completed, setCompleted] = useState(false);
  const [showSuccessModal, setShowSuccess] = useState(false);
  const [currentDateString, setCurrentDateString] = useState('');
  const [isMobilePanelOpen, setIsMobilePanelOpen] = useState(false);
  const [focusErrorIso, setFocusErrorIso] = useState<string | null>(null);

  useEffect(() => {
    async function initialize() {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const urlDate = urlParams.get('date') || '';
        const fetchUrl = urlDate ? `/api/daily-puzzle?date=${urlDate}` : '/api/daily-puzzle';

        const res = await fetch(fetchUrl);
        const data = await res.json();

        setCurrentDateString(data.date);
        setOrigin(data.origin);
        setDestination(data.destination);
        setMinSteps(data.minSteps || 0);
        setIdealPath(data.idealPath || []);

        const savedState = loadGameState(data.date);

        if (!savedState || savedState.date !== data.date) {
          setShowIntro(true);
          const newState: GameState = { date: data.date, guesses: [], errors: [], completed: false };
          saveGameState(newState);
          setPathHistory([]);
          setCurrentIndex(-1);
        } else {
          const loadedGuesses = savedState.guesses || [];
          setPathHistory(loadedGuesses);
          setCurrentIndex(loadedGuesses.length - 1);
          setErrorIds(savedState.errors || []);
          setCompleted(savedState.completed);
        }

        // Foco inicial: o mapa deve centralizar na origem ao iniciar a partida.
        if (data.origin?.id) {
          setTimeout(() => {
            setFocusErrorIso(data.origin.id);
          }, 500);
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
      const currentPath = pathHistory;

      // Do not allow guessing the same country where the player is currently located.
      if (isoCode === currentFrontier) {
        setErrorText(t.invalidAttempt || 'Tentativa inválida: país atual.');
        // Force refresh of map colors to keep the current state visible.
        setPathHistory(prev => [...prev]);
        setFocusErrorIso(currentFrontier);
        return;
      }

      const res = await fetch('/api/validate-guess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isoCode,
          originId: origin.id,
          destId: destination.id,
          currentGuesses: currentPath
        })
      });

      const data = await res.json();

      const currentState = loadGameState(currentDateString) || { date: currentDateString, guesses: [], errors: [], completed: false };

      if (isoCode === currentFrontier) {
        setErrorText(t.invalidAttempt);
        return;
      }

      if (!res.ok || !data.valid) {
        setErrorText(data.message || data.error || t.invalidAttempt);

        // Track the error if it hasn't been tracked yet
        const newErrorIds = [...errorIds];
        if (!newErrorIds.includes(isoCode)) {
          newErrorIds.push(isoCode);
          setErrorIds(newErrorIds);
          saveGameState({ ...currentState, errors: newErrorIds });
        }
        return;
      }

      // Direct valid guess — append even if it was visited before (allow revisit)
      if (data.countryId === currentFrontier) {
        return;
      }

      const nextPath = [...pathHistory, data.countryId];
      setPathHistory(nextPath);
      setCurrentIndex(nextPath.length - 1);

      const isComplete = data.reachedDestination;
      if (isComplete) {
        setCompleted(true);
        setShowSuccess(true);
      }

      // persist the full pathHistory and currentIndex
      saveGameState({
        ...currentState,
        guesses: nextPath,
        errors: errorIds,
        completed: isComplete,
        currentIndex: nextPath.length - 1
      });

    } catch (err) {
      console.error('Erro na validação', err);
      setErrorText(t.errorValidating);
    }
  };

  const undoGuess = (index: number) => {
    // Only allow direct backward move to an adjacent country (fronteira direta).
    if (index < 0 || index >= pathHistory.length) return;

    const targetIso = pathHistory[index];
    const fromIso = pathHistory.length > 0 ? pathHistory[pathHistory.length - 1] : (origin?.id || null);
    if (!fromIso || fromIso === targetIso) return;

    if (!countryGraph[fromIso]?.includes(targetIso)) {
      setErrorText(t.invalidAttempt);
      return;
    }

    const nextFullPath = [...pathHistory, targetIso];
    const newErrorIds = [...errorIds];
    const isComplete = targetIso === destination?.id;

    if (isComplete) {
      setCompleted(true);
      setShowSuccess(true);
    }

    setPathHistory(nextFullPath);
    setCurrentIndex(nextFullPath.length - 1);
    setErrorIds(newErrorIds);

    const currentState = loadGameState(currentDateString) || { date: currentDateString, guesses: [], errors: [], completed: false };
    saveGameState({
      ...currentState,
      guesses: nextFullPath,
      errors: newErrorIds,
      completed: isComplete,
      currentIndex: nextFullPath.length - 1
    });
  };



  const getCountryName = (iso: string) => {
    const c = countries.find(x => x.id === iso);
    return c ? c.name : iso;
  };

  const currentPath = pathHistory;
  const currentFrontier = currentPath.length > 0 ? currentPath[currentPath.length - 1] : (origin?.id || null);
  const currentlyBordering = currentFrontier ? (countryGraph[currentFrontier] || []) : [];

  if (loading) {
    return <main className="min-h-screen bg-slate-50 flex items-center justify-center text-green-700">Carregando...</main>;
  }

  return (
    <main className="h-[100dvh] w-[100dvw] overflow-hidden bg-slate-50 flex flex-col font-sans relative">
      <IntroModal isOpen={showIntro} onClose={() => setShowIntro(false)} origin={origin?.name || ''} destination={destination?.name || ''} t={t} />

      <SuccessModal isOpen={showSuccessModal} onClose={() => setShowSuccess(false)} t={t}
        guessedIds={currentPath}
        idealPath={idealPath}
        minSteps={minSteps}
      />

      <div className="z-20 relative pointer-events-auto">
        <Header dailyChallenge={t.dailyChallenge} lang={lang} />
      </div>

      {/* Floating indicator: Você está em... */}
      {!completed && currentFrontier && (
        <div className="absolute top-48 sm:top-24 lg:top-8 left-1/2 -translate-x-1/2 z-30 pointer-events-none fade-in">
          <div className="bg-blue-900/90 backdrop-blur-md text-white px-5 sm:px-8 py-2 sm:py-3 rounded-full shadow-lg border-2 border-blue-400 text-center flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-300"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
            <span className="text-sm sm:text-lg font-medium opacity-90 uppercase tracking-wide">{t.youAreIn}</span>
            <span className="text-lg sm:text-2xl font-black tracking-tight">{getCountryName(currentFrontier)}</span>
          </div>
        </div>
      )}

      <div className="flex-1 w-full flex flex-col relative pointer-events-none overflow-hidden">
        {/* Map Area Background */}
        <div className="pointer-events-auto w-full h-full">
          <InteractiveMap
            originId={origin?.id || null}
            destId={destination?.id || null}
            guessedIds={currentPath}
            errorIds={errorIds}
            focusErrorIso={focusErrorIso}
            setFocusErrorIso={setFocusErrorIso}
          />
        </div>

        {/* Floating UI Container */}
        <div className="absolute top-4 left-4 z-30 pointer-events-auto w-auto lg:max-w-[360px] max-w-[95%] flex flex-col justify-between p-3 sm:p-4 lg:p-6 lg:pt-6">

          {/* Top Info Banner */}
          <div className="flex flex-col bg-white/90 backdrop-blur-md p-4 rounded-xl shadow-md border border-slate-200 relative mb-4 pointer-events-auto">
            {errorIds.length > 0 && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-red-100 text-red-600 px-3 py-1 rounded-full text-xs font-bold border border-red-200 z-10 shadow-sm">
                {t.errors} {errorIds.length}
              </div>
            )}

            {/* Date Picker Header */}
            <div className="flex justify-between items-center w-full mb-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                <span className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wide">Desafio do dia:</span>
              </div>
              <input
                type="date"
                value={currentDateString}
                onChange={(e) => {
                  if (e.target.value) {
                    window.location.href = `/${lang}?date=${e.target.value}`;
                  }
                }}
                className="text-xs px-2 py-1 rounded-md bg-slate-50 text-slate-700 border border-slate-200 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-all cursor-pointer font-medium"
              />
            </div>

            <div className="flex justify-between items-center relative w-full">
              <div className="text-center w-1/3">
                <span className="block text-[10px] uppercase tracking-wider text-blue-500 font-bold mb-0.5">Origem</span>
                <span className="block text-[15px] sm:text-lg font-bold text-blue-800 leading-tight">{origin?.name}</span>
              </div>
              <div className="w-1/3 px-2 flex flex-col items-center justify-center">
                <div className="h-[2px] bg-slate-200 w-full relative mb-1.5">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] text-slate-500 font-bold whitespace-nowrap border border-slate-100">
                    {completed ? t.arrived : "PARA"}
                  </div>
                </div>
                {minSteps > 0 && <span className="text-[9px] sm:text-[10px] font-semibold text-slate-400 whitespace-nowrap bg-slate-50 px-1.5 py-0.5 rounded">Par ideal: {minSteps}</span>}
              </div>
              <div className="text-center w-1/3">
                <span className="block text-[10px] uppercase tracking-wider text-blue-500 font-bold mb-0.5">Destino</span>
                <span className="block text-[15px] sm:text-lg font-bold text-blue-800 leading-tight">{destination?.name}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col w-full pointer-events-auto items-end lg:items-stretch justify-end lg:justify-start mt-auto lg:mt-0">
            <button onClick={() => setIsMobilePanelOpen(!isMobilePanelOpen)} className="lg:hidden mb-2 bg-blue-600/90 backdrop-blur text-white px-4 py-1.5 rounded-full shadow-md font-bold text-xs pointer-events-auto self-center">
              {isMobilePanelOpen ? "Ocultar painel 👇" : "Expandir histórico ↑"}
            </button>
            {/* Input & Error */}
            <div className="flex flex-col gap-2 relative z-20 pointer-events-auto p-1 lg:p-0 mb-4 lg:mb-3">
              <InputAutocomplete
                countries={currentCountries}
                placeholderText={t.typeCountry}
                disabledText={t.alreadyArrived}
                onGuess={handleGuess}
                disabled={completed}
                ignoredIsos={[...errorIds.filter(e => !currentlyBordering.includes(e))]}
              />
              <div className="flex justify-center items-start w-full px-1">
                <p className="text-red-600 bg-red-50/90 px-2 rounded-md backdrop-blur inline-block text-[13px] font-bold min-h-[20px] text-center leading-tight mx-auto">{errorText}</p>
              </div>
            </div>

            {/* Output Sequential list of guessed countries */}
            {(currentPath.length > 0 || errorIds.length > 0) && (
              <div className={`w-full transition-all duration-300 ease-in-out ${isMobilePanelOpen ? "max-h-[40vh] opacity-100" : "max-h-0 opacity-0 lg:max-h-[45vh] lg:opacity-100"} overflow-hidden lg:overflow-visible`}>
                <div className="bg-white/90 backdrop-blur-md rounded-xl p-3 shadow-md border border-slate-200 w-full pointer-events-auto h-full max-h-[40vh] lg:max-h-[45vh] overflow-y-auto custom-scrollbar">

                  {currentPath.length > 0 && (
                    <>
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Seu Caminho:</h3>
                      </div>

                      {!completed && (
                        <p className="text-[10px] text-slate-400 mb-3 italic">Dica: este histórico mostra o caminho percorrido.</p>
                      )}

                      <ul className="flex flex-wrap gap-2 justify-center">
                        {currentPath.map((iso, i) => (
                          <li
                            key={`guess-${i}`}
                            className="bg-green-100 text-green-800 text-sm py-1 px-3 rounded-full flex items-center gap-1 font-semibold"
                          >
                            <span className={`font-normal text-[10px] text-green-500`}>{i + 1}.</span>
                            <span className="ml-1">{getCountryName(iso)}</span>
                            {i < currentPath.length - 1 && <span className={`text-green-300 ml-1`}>→</span>}
                          </li>
                        ))}
                      </ul>
                    </>
                  )}

                  {errorIds.length > 0 && (
                    <div className={`pt-3 ${currentPath.length > 0 ? 'mt-4 border-t border-slate-200' : ''}`}>
                      <h3 className="text-[10px] font-bold text-red-500 uppercase tracking-widest mb-2 text-center">{t.wrongAttempts}</h3>
                      <ul className="flex flex-wrap gap-1.5 justify-center">
                        {errorIds.map((iso, i) => {
                          const isYellow = currentlyBordering.includes(iso);
                          return (
                            <li key={`err-${i}`} onClick={() => setFocusErrorIso(iso)} className={`cursor-pointer hover:opacity-75 hover:underline transition-all border text-[11px] py-0.5 px-2 rounded-md ${isYellow ? 'bg-yellow-100 border-yellow-400 text-yellow-800' : 'bg-red-100 border-red-300 text-red-700'}`}>
                              {getCountryName(iso)}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}

                  {completed && (
                    <div className="mt-5 p-4 bg-green-600 text-white rounded-xl font-bold border border-green-700 text-center shadow-lg relative overflow-hidden group hover:bg-green-700 transition cursor-pointer" onClick={() => setShowSuccess(true)}>
                      <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22v-7l-2-2" /><path d="M22 8.5C22 5.5 19.5 3 16.5 3A5.5 5.5 0 0 0 12 5.5a5.5 5.5 0 0 0-4.5-2.5C4.5 3 2 5.5 2 8.5c0 3.78 3.4 6.86 8.55 11.53L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5Z" /></svg>
                        <span className="text-lg">Viagem Concluída!</span>
                      </div>
                      <p className="text-sm font-normal mt-1 opacity-90">Clique para ver o resumo da sua rota.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
