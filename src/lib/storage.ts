// src/lib/storage.ts
import CryptoJS from 'crypto-js';

const SECRET_SALT = 'passeios.io-super-secret-key-123!';
const STORAGE_KEY = 'passeios_daily_progress_v3'; // incremented to support multi-day dictionary

export interface DailyState {
    guesses: string[];
    errors: string[];
    completed: boolean;
}

export interface GameState {
    date: string;
    guesses: string[];
    errors: string[];
    completed: boolean;
}

// Internal format stored in localStorage
interface GlobalStorageState {
    lastDate: string;
    days: {
        [dateString: string]: DailyState;
    };
}

export function saveGameState(state: GameState): void {
    try {
        let globalState: GlobalStorageState = { lastDate: state.date, days: {} };
        const encrypted = localStorage.getItem(STORAGE_KEY);

        // Load existing memory or create new
        if (encrypted) {
            const decrypted = CryptoJS.AES.decrypt(encrypted, SECRET_SALT).toString(CryptoJS.enc.Utf8);
            if (decrypted) {
                globalState = JSON.parse(decrypted);
            }
        }

        // Update the specific date
        globalState.lastDate = state.date;
        globalState.days[state.date] = {
            guesses: state.guesses,
            errors: state.errors,
            completed: state.completed
        };

        const stringified = JSON.stringify(globalState);
        const newEncrypted = CryptoJS.AES.encrypt(stringified, SECRET_SALT).toString();
        localStorage.setItem(STORAGE_KEY, newEncrypted);
    } catch (error) {
        console.error('Failed to save game state', error);
    }
}

export function loadGameState(specificDate?: string): GameState | null {
    try {
        const encrypted = localStorage.getItem(STORAGE_KEY);
        if (!encrypted) return null;

        const decrypted = CryptoJS.AES.decrypt(encrypted, SECRET_SALT).toString(CryptoJS.enc.Utf8);
        if (!decrypted) return null;

        const globalState = JSON.parse(decrypted) as GlobalStorageState;

        // If a specific date is requested, get it. Otherwise get the last played date.
        const targetDate = specificDate || globalState.lastDate;

        if (!globalState.days || !globalState.days[targetDate]) {
            return null;
        }

        const dayState = globalState.days[targetDate];
        return {
            date: targetDate,
            guesses: dayState.guesses,
            errors: dayState.errors,
            completed: dayState.completed
        };
    } catch (error) {
        console.error('Failed to load game state', error);
        return null;
    }
}

export function clearGameState(): void {
    localStorage.removeItem(STORAGE_KEY);
}
