// src/components/Header.tsx
import { MapIcon } from 'lucide-react';

export default function Header() {
  return (
    <header className="bg-green-700 text-white p-4 shadow-md sticky top-0 z-40">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapIcon className="w-8 h-8 text-green-300" />
          <h1 className="text-2xl font-black tracking-tight"><span className="text-green-300">passeios</span>.io</h1>
        </div>
        <div className="text-sm font-medium text-green-200">
          O Desafio Diário de Fronteiras
        </div>
      </div>
    </header>
  );
}