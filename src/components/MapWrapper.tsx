import dynamic from 'next/dynamic';

const Map = dynamic(() => import('./Map'), { ssr: false, loading: () => <div className="h-64 sm:h-96 w-full bg-slate-200 animate-pulse rounded-lg flex items-center justify-center">Carregando mapa...</div> });

export default Map;
