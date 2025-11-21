import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChild<T> = T extends { child?: any } ? Omit<T, 'child'> : T;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChildren<T> = T extends { children?: any } ? Omit<T, 'children'> : T;
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>;
export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & { ref?: U | null };

export function getOrCreateUserId(): string {
	if (typeof window === 'undefined') return '';

	let userId: string | null = null;
	try {
		userId = localStorage.getItem('chronoflux_user_id');
		if (!userId) {
			try {
				userId = crypto.randomUUID();
			} catch {
				userId = Math.random().toString(36).substring(2) + Date.now().toString(36);
			}
			localStorage.setItem('chronoflux_user_id', userId);
		}
		return userId;
	} catch {
		// If we have a generated userId (e.g. setItem failed), return it.
		if (userId) return userId;

		// Otherwise (e.g. getItem failed), generate a temporary one.
		try {
			return crypto.randomUUID();
		} catch {
			return Math.random().toString(36).substring(2) + Date.now().toString(36);
		}
	}
}
