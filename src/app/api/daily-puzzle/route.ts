import { NextResponse } from 'next/server';
import { countries } from '@/lib/countries';
import { getDailyPuzzle } from '@/lib/graph';

export async function GET() {
  const dateStr = new Date().toISOString().slice(0, 10);
  const { originId, destId, minSteps, idealPath } = getDailyPuzzle(dateStr);

  const origin = countries.find(c => c.id === originId) || { id: originId, name: originId };
  const destination = countries.find(c => c.id === destId) || { id: destId, name: destId };

  return NextResponse.json({
    date: dateStr,
    origin,
    destination,
    minSteps,
    idealPath
  });
}
