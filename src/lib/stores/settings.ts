/**
 * Centralized Settings Store for ChronoFlux
 * Manages AI provider configuration and persistence
 */

export type AIProvider = 'ollama' | 'openrouter';

export interface AISettings {
	provider: AIProvider;
	// Ollama
	ollamaUrl: string;
	ollamaModel: string;
	// OpenRouter
	openrouterApiKey: string;
	openrouterModel: string;
}

export const defaultSettings: AISettings = {
	provider: 'ollama',
	ollamaUrl: 'http://localhost:11434',
	ollamaModel: 'qwen3:8b',
	openrouterApiKey: '',
	openrouterModel: 'openai/gpt-5-mini'
};

/**
 * Load settings from localStorage
 */
export function loadSettings(): AISettings {
	if (typeof window === 'undefined') {
		return defaultSettings;
	}

	return {
		provider: (localStorage.getItem('AI_PROVIDER') as AIProvider) || defaultSettings.provider,
		ollamaUrl: localStorage.getItem('OLLAMA_URL') || defaultSettings.ollamaUrl,
		ollamaModel: localStorage.getItem('OLLAMA_MODEL') || defaultSettings.ollamaModel,
		openrouterApiKey:
			localStorage.getItem('OPENROUTER_API_KEY') || defaultSettings.openrouterApiKey,
		openrouterModel: localStorage.getItem('OPENROUTER_MODEL') || defaultSettings.openrouterModel
	};
}

/**
 * Save settings to localStorage
 */
export function saveSettings(settings: AISettings): void {
	if (typeof window === 'undefined') {
		return;
	}

	localStorage.setItem('AI_PROVIDER', settings.provider);
	localStorage.setItem('OLLAMA_URL', settings.ollamaUrl);
	localStorage.setItem('OLLAMA_MODEL', settings.ollamaModel);
	localStorage.setItem('OPENROUTER_API_KEY', settings.openrouterApiKey);
	localStorage.setItem('OPENROUTER_MODEL', settings.openrouterModel);
}

/**
 * Reset settings to defaults
 */
export function resetSettings(): void {
	saveSettings(defaultSettings);
}

/**
 * Get the current provider
 */
export function getCurrentProvider(): AIProvider {
	if (typeof window === 'undefined') {
		return defaultSettings.provider;
	}
	return (localStorage.getItem('AI_PROVIDER') as AIProvider) || defaultSettings.provider;
}

/**
 * Popular OpenRouter models for the selector
 */
export const popularOpenRouterModels = [
	{ id: 'openai/gpt-5-mini', name: 'GPT-5 Mini', description: 'Fast and affordable' },
	{ id: 'openai/gpt-5.1', name: 'GPT-5.1', description: 'High quality' },
	{
		id: 'anthropic/claude-haiku-4.5',
		name: 'Claude Haiku 4.5',
		description: 'Excellent reasoning'
	},
	{
		id: 'x-ai/grok-4.1-fast:free',
		name: 'Grok 4.1 Fast',
		description: 'Large context window & free'
	},
	{
		id: 'google/gemini-3-pro-preview',
		name: 'Gemini 3 Pro Preview',
		description: 'Best Google model'
	}
] as const;
