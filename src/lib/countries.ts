import bordersData from '@/data/borders.json';
import ptNamesData from '@/data/countries-pt-br.json';
import enNamesData from '@/data/countries-en.json';
import aliasesData from '@/data/aliases.json';

export type BorderGraph = Record<string, string[]>;

export interface BorderSanitizationRule {
    source: string;
    excludedNeighbors: string[];
    bidirectional?: boolean; // true by default, false = only source loses these neighbors
}

export const borderSanitizationRules: BorderSanitizationRule[] = [
    { source: 'FRA', excludedNeighbors: ['BRA', 'SUR', 'GUF'], bidirectional: true },
    { source: 'ESP', excludedNeighbors: ['MAR'], bidirectional: false },
    { source: 'GBR', excludedNeighbors: ['ESP', 'CYP'], bidirectional: true },
    { source: 'NLD', excludedNeighbors: ['FRA', 'MAF', 'SXM'], bidirectional: true },
    { source: 'RUS', excludedNeighbors: ['POL', 'LTU'], bidirectional: true },
    { source: 'SHN', excludedNeighbors: ['BRA', 'AGO'], bidirectional: true },
    // Isola a Antártida (remove atalho pelo Polo Sul entre Argentina e Chile)
    { source: 'ATA', excludedNeighbors: ['ARG', 'CHL', 'HMD', 'SGS'], bidirectional: true },
    // Isola as Ilhas Malvinas/Falklands (remove fronteira política com a Argentina)
    { source: 'FLK', excludedNeighbors: ['ARG', 'SGS'], bidirectional: true },
    // Isola a Geórgia do Sul (que estava ligando Antártida e Malvinas)
    { source: 'SGS', excludedNeighbors: ['FLK', 'ATA'], bidirectional: true }
];

function cloneGraph(graph: BorderGraph): BorderGraph {
    return Object.fromEntries(
        Object.entries(graph).map(([iso, neighbors]) => [iso, [...neighbors]])
    );
}

export function sanitizeBorderGraph(rawGraph: BorderGraph,
    rules: BorderSanitizationRule[] = borderSanitizationRules): BorderGraph {
    const sanitized = cloneGraph(rawGraph);

    for (const rule of rules) {
        const { source, excludedNeighbors, bidirectional = true } = rule;
        if (!sanitized[source]) continue;

        // Remove edges from source
        sanitized[source] = sanitized[source].filter((adj) => !excludedNeighbors.includes(adj));

        // If bidirectional, also remove the reverse edge
        if (bidirectional) {
            for (const neighbor of excludedNeighbors) {
                if (!sanitized[neighbor]) continue;
                sanitized[neighbor] = sanitized[neighbor].filter((adj) => adj !== source);
            }
        }
    }

    return sanitized;
}
export function makeGraphBidirectional(graph: BorderGraph): BorderGraph {
    const bidiGraph = cloneGraph(graph);

    for (const [country, neighbors] of Object.entries(bidiGraph)) {
        for (const neighbor of neighbors) {
            if (bidiGraph[neighbor] && !bidiGraph[neighbor].includes(country)) {
                bidiGraph[neighbor].push(country);
            }
        }
    }
    return bidiGraph;
}

export const countryGraph: BorderGraph = makeGraphBidirectional(sanitizeBorderGraph(bordersData));
// export const countryGraph: BorderGraph = sanitizeBorderGraph(bordersData);
export const countryNamesPtBr: Record<string, string> = ptNamesData;
export const countryNamesEn: Record<string, string> = enNamesData;
export const countryAliases: Record<string, string> = aliasesData;

export const getCountryName = (id: string, lang = 'pt'): string => {
    if (lang === 'en') return countryNamesEn[id] || countryNamesPtBr[id] || id;
    return countryNamesPtBr[id] || id;
};

export const getCountriesByLang = (lang = 'pt'): Country[] => {
    const dictToUse = lang === 'en' ? countryNamesEn : countryNamesPtBr;
    return Object.entries(dictToUse).map(([id, name]) => ({
        id,
        name: name || countryNamesPtBr[id] || id
    }));
};

export interface Country {
    id: string; // ISO 3166-1 alpha-3
    name: string; // Portuguese Name
}

// Convert JSON dictionary into array for easy iteration
export const countries: Country[] = Object.entries(countryNamesPtBr).map(([id, name]) => ({
    id,
    name
}));

// Utility to normalize string (remove accents and lower case)
export const normalizeStr = (str: string) =>
    str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
