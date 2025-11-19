import { writable } from 'svelte/store';

export interface GameState {
	nationName: string;
	nationFlag: string; // URL or placeholder
	turn: number;
	year: number;
}

export const gameState = writable<GameState>({
	nationName: 'Loading...',
	nationFlag: '',
	turn: 0,
	year: 0
});
