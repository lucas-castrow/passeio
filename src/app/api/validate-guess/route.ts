import { NextResponse } from 'next/server';
import { countryGraph } from '@/lib/countries';

export async function POST(request: Request) {
    const { isoCode, originId, destId, currentGuesses } = await request.json();

    if (!isoCode || !originId || !destId) {
        return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    if (currentGuesses.includes(isoCode)) {
        return NextResponse.json({
            valid: false,
            message: 'Você já digitou este país.',
            mapUpdate: []
        });
    }

    const borders = countryGraph[isoCode] || [];

    if (!countryGraph[isoCode]) {
        return NextResponse.json({ error: 'Código ISO inválido ou país fora da nossa base terrestre.' }, { status: 404 });
    }

    // The logic MUST be sequential:
    // The first guess MUST border the 'originId'.
    // Every subsequent guess MUST border the LAST guessed country.

    const expectedNeighbor = currentGuesses.length === 0
        ? originId
        : currentGuesses[currentGuesses.length - 1];

    const connectsToSequence = expectedNeighbor === isoCode || countryGraph[expectedNeighbor]?.includes(isoCode);

    if (!connectsToSequence) {
        return NextResponse.json({
            valid: false,
            message: currentGuesses.length === 0
                ? `Este país não faz fronteira com a Origem.`
                : `A rota foi quebrada. O país deve fazer fronteira com sua última escolha.`,
            mapUpdate: []
        });
    }

    const reachedDestination = borders.includes(destId) || isoCode === destId;

    return NextResponse.json({
        valid: true,
        countryId: isoCode,
        reachedDestination,
        mapUpdate: [isoCode]
    });
}
