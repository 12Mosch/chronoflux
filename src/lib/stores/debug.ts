/**
 * Debug Store
 * Manages AI interaction logs for debugging purposes
 */

import { writable } from 'svelte/store';

export interface LogEntry {
	id: string;
	timestamp: number;
	provider: string;
	prompt: string;
	response: string;
	duration: number; // in milliseconds
	error?: string;
}

export const aiLogs = writable<LogEntry[]>([]);

/**
 * Add a log entry
 */
export function addLogEntry(entry: Omit<LogEntry, 'id' | 'timestamp'>): void {
	const logEntry: LogEntry = {
		...entry,
		id: crypto.randomUUID(),
		timestamp: Date.now()
	};

	aiLogs.update((logs) => {
		// Keep only the last 50 entries to prevent memory issues
		const newLogs = [logEntry, ...logs];
		return newLogs.slice(0, 50);
	});
}

/**
 * Clear all logs
 */
export function clearLogs(): void {
	aiLogs.set([]);
}
