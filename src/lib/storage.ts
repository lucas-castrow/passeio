// src/lib/storage.ts
import CryptoJS from 'crypto-js';

const SECRET_SALT = 'passeios.io-super-secret-key-123!';
const STORAGE_KEY = 'passeios_daily_progress_v2';

export interface GameState {
    date: string;
    guesses: string[];
    errors: string[];
    completed: boolean;
}

export function saveGameState(state: GameState): void {
    try {
        const stringified = JSON.stringify(state);
        const encrypted = CryptoJS.AES.encrypt(stringified, SECRET_SALT).toString();
        localStorage.setItem(STORAGE_KEY, encrypted);
    } catch (error) {
        console.error('Failed to save game state', error);
    }
}

export function loadGameState(): GameState | null {
    try {
        const encrypted = localStorage.getItem(STORAGE_KEY);
        if (!encrypted) return null;

        const decrypted = CryptoJS.AES.decrypt(encrypted, SECRET_SALT).toString(CryptoJS.enc.Utf8);
        if (!decrypted) return null;

        return JSON.parse(decrypted) as GameState;
    } catch (error) {
        console.error('Failed to load game state', error);
        return null;
    }
}

export function clearGameState(): void {
    localStorage.removeItem(STORAGE_KEY);
}
