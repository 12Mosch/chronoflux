/**
 * AI Provider Abstraction Layer
 * Unified interface for AI text generation across different providers
 */

import { loadSettings, type AISettings } from '$lib/stores/settings';
import { generateWithOpenRouter } from './openrouter';

export type AIProvider = 'ollama' | 'openrouter';

export interface AIGenerateOptions {
	temperature?: number;
	maxTokens?: number;
}

/**
 * Generate text using Ollama
 */
async function generateWithOllama(
	prompt: string,
	settings: AISettings,
	options: AIGenerateOptions = {}
): Promise<string> {
	const { temperature = 0.7, maxTokens = 2000 } = options;

	try {
		const response = await fetch(`${settings.ollamaUrl}/api/generate`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				model: settings.ollamaModel,
				prompt,
				stream: false,
				options: {
					temperature,
					num_predict: maxTokens
				}
			})
		});

		if (!response.ok) {
			throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
		}

		const data = await response.json();
		return data.response;
	} catch (error: unknown) {
		if (error instanceof Error && error.message.includes('Failed to fetch')) {
			throw new Error(
				'Could not connect to Ollama. Please ensure:\n1. Ollama is running (`ollama serve`)\n2. CORS is enabled (`OLLAMA_ORIGINS="*"`)\n3. The model is pulled (`ollama pull ' +
					settings.ollamaModel +
					'`)'
			);
		}
		throw error;
	}
}

/**
 * Generate text using the configured AI provider
 */
export async function generateText(
	prompt: string,
	options: AIGenerateOptions = {}
): Promise<string> {
	const settings = loadSettings();

	if (settings.provider === 'openrouter') {
		if (!settings.openrouterApiKey) {
			throw new Error('OpenRouter API key not configured. Please set it in Settings.');
		}

		return generateWithOpenRouter(
			prompt,
			{
				apiKey: settings.openrouterApiKey,
				model: settings.openrouterModel
			},
			options
		);
	}

	// Default to Ollama
	return generateWithOllama(prompt, settings, options);
}

/**
 * Test connection to the currently configured provider
 */
export async function testConnection(): Promise<{ success: boolean; error?: string }> {
	const settings = loadSettings();

	try {
		if (settings.provider === 'openrouter') {
			if (!settings.openrouterApiKey) {
				return { success: false, error: 'OpenRouter API key is required' };
			}

			const response = await fetch('https://openrouter.ai/api/v1/models', {
				method: 'GET',
				headers: {
					Authorization: `Bearer ${settings.openrouterApiKey}`
				}
			});

			if (!response.ok) {
				if (response.status === 401) {
					return { success: false, error: 'Invalid API key' };
				}
				return { success: false, error: `API error: ${response.status}` };
			}

			return { success: true };
		}

		// Test Ollama connection
		const response = await fetch(`${settings.ollamaUrl}/api/tags`);

		if (!response.ok) {
			return { success: false, error: `Failed to connect: ${response.statusText}` };
		}

		const data = await response.json();
		const models = data.models || [];

		// Check if model exists
		const modelExists = models.some((m: { name: string }) => {
			const name = m.name;
			const input = settings.ollamaModel;
			if (name === input) return true;
			if (!input.includes(':') && name === `${input}:latest`) return true;
			return false;
		});

		if (!modelExists) {
			return {
				success: false,
				error: `Model '${settings.ollamaModel}' not found. Available: ${models.map((m: { name: string }) => m.name).join(', ')}`
			};
		}

		return { success: true };
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		if (message.includes('Failed to fetch')) {
			return { success: false, error: 'Could not connect. Check URL and ensure CORS is enabled.' };
		}
		return { success: false, error: message };
	}
}

/**
 * Get a user-friendly name for the current provider
 */
export function getProviderDisplayName(provider: AIProvider): string {
	return provider === 'openrouter' ? 'OpenRouter' : 'Ollama';
}
