import { writable } from 'svelte/store';

export interface GameState {
	nationName: string;
	nationFlag: string; // URL or placeholder
	turn: number;
	year: number;
	military: number;
	economy: number;
	stability: number;
	influence: number;
}

export const gameState = writable<GameState>({
	nationName: 'Loading...',
	nationFlag: '',
	turn: 0,
	year: 0,
	military: 0,
	economy: 0,
	stability: 0,
	influence: 0
});
