import { countryGraph, countries } from './countries';

// Returns the full shortest path array (including origin and destination)
export function findShortestPath(originId: string, destId: string): string[] | null {
    if (originId === destId) return [originId];

    let queueOrigin = [originId];
    let queueDest = [destId];

    const visitedOrigin = new Map<string, string | null>();
    const visitedDest = new Map<string, string | null>();
    
    visitedOrigin.set(originId, null);
    visitedDest.set(destId, null);

    while (queueOrigin.length > 0 && queueDest.length > 0) {
        // Expand Origin
        const nextQueueOrigin: string[] = [];
        for (const currentO of queueOrigin) {
            const neighborsO = countryGraph[currentO] || [];
            
            for (const neighbor of neighborsO) {
                if (!visitedOrigin.has(neighbor)) {
                    visitedOrigin.set(neighbor, currentO);
                    nextQueueOrigin.push(neighbor);
                }
                
                if (visitedDest.has(neighbor)) {
                    return buildBidirectionalPath(visitedOrigin, visitedDest, neighbor);
                }
            }
        }
        queueOrigin = nextQueueOrigin;

        // Expand Dest
        const nextQueueDest: string[] = [];
        for (const currentD of queueDest) {
            const neighborsD = countryGraph[currentD] || [];
            
            for (const neighbor of neighborsD) {
                if (!visitedDest.has(neighbor)) {
                    visitedDest.set(neighbor, currentD);
                    nextQueueDest.push(neighbor);
                }
                
                if (visitedOrigin.has(neighbor)) {
                    return buildBidirectionalPath(visitedOrigin, visitedDest, neighbor);
                }
            }
        }
        queueDest = nextQueueDest;
    }

    return null;
}

function buildBidirectionalPath(visitedOrigin: Map<string, string | null>, visitedDest: Map<string, string | null>, meetingNode: string): string[] {
    const pathOrigin: string[] = [];
    let currOrigin: string | null = meetingNode;
    while (currOrigin !== null) {
        pathOrigin.push(currOrigin);
        currOrigin = visitedOrigin.get(currOrigin) || null;
    }
    pathOrigin.reverse();
    
    const pathDest: string[] = [];
    let currDest: string | null = visitedDest.get(meetingNode) || null;
    while (currDest !== null) {
        pathDest.push(currDest);
        currDest = visitedDest.get(currDest) || null;
    }
    
    return [...pathOrigin, ...pathDest];
}

// Basic BFS implementation to find the shortest path length
export function findShortestPathLength(originId: string, destId: string): number {
    const path = findShortestPath(originId, destId);
    return path ? path.length - 1 : -1;
}

// Check if two countries are legally connected via the graph
export function isPathPossible(originId: string, destId: string): boolean {
    return findShortestPathLength(originId, destId) !== -1;
}

// Generate deterministic pair based on current date, guaranteeing a valid land path exists
export function getDailyPuzzle(dateString: string): { originId: string; destId: string, minSteps: number, idealPath: string[] } {
    const validIsos = Object.keys(countryGraph).filter(iso => countryGraph[iso].length > 0);

    if (validIsos.length < 2) {
        return { originId: 'BRA', destId: 'ARG', minSteps: 1, idealPath: ['BRA', 'ARG'] };
    }

    let index1 = 0;
    let index2 = 1;

    let seed = 0;
    for (let i = 0; i < dateString.length; i++) {
        seed = (seed << 5) - seed + dateString.charCodeAt(i);
        seed |= 0;
    }

    seed = Math.abs(seed);
    const total = validIsos.length;

    // Try combinations until we find a pair that actually has a land connection
    let attempt = 0;
    while (attempt < 100) {
        index1 = (seed + attempt) % total;
        index2 = Math.floor(((seed * 1.3) + (attempt * 2.7)) % total);

        if (index1 !== index2) {
            const originId = validIsos[index1];
            const destId = validIsos[index2];
            const path = findShortestPath(originId, destId);

            // Ensure there's a path and it takes more than 1 step ideally to make a game
            if (path && path.length - 1 >= 2) {
                return { originId, destId, minSteps: path.length - 1, idealPath: path };
            }
        }
        attempt++;
    }

    // Fallback to a known good pair if algorithm fails to find one
    const originId = validIsos[index1 % total] || 'BRA';
    const destId = validIsos[index2 % total] || 'PER';
    const fallbackPath = findShortestPath(originId, destId) || findShortestPath('BRA', 'PER');
    return { originId: originId || 'BRA', destId: destId || 'PER', minSteps: fallbackPath ? fallbackPath.length - 1 : 2, idealPath: fallbackPath || ['BRA', 'PER'] };
}
