import bordersData from '@/data/borders.json';
import ptNamesData from '@/data/countries-pt-br.json';
import aliasesData from '@/data/aliases.json';

export const countryGraph: Record<string, string[]> = bordersData;
export const countryNamesPtBr: Record<string, string> = ptNamesData;
export const countryAliases: Record<string, string> = aliasesData;

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
