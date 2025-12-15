/**
 * OpenRouter API Client for ChronoFlux
 * Provides cloud-based AI text generation via OpenRouter
 */

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

export interface OpenRouterConfig {
	apiKey: string;
	model: string;
}

export interface OpenRouterGenerateOptions {
	temperature?: number;
	maxTokens?: number;
}

/**
 * Generate text using OpenRouter API
 */
export async function generateWithOpenRouter(
	prompt: string,
	config: OpenRouterConfig,
	options: OpenRouterGenerateOptions = {}
): Promise<string> {
	const { temperature = 0.7, maxTokens = 2000 } = options;
	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minutes timeout

	try {
		const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${config.apiKey}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				model: config.model,
				messages: [{ role: 'user', content: prompt }],
				temperature,
				max_tokens: maxTokens
			}),
			signal: controller.signal
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));

			// Handle specific error codes
			if (response.status === 401) {
				throw new Error('Invalid API key. Please check your OpenRouter API key.');
			}
			if (response.status === 429) {
				throw new Error('Rate limit exceeded. Please try again later.');
			}
			if (response.status === 402) {
				throw new Error('Insufficient credits. Please add credits to your OpenRouter account.');
			}

			throw new Error(
				`OpenRouter API error: ${response.status} ${errorData.error?.message || response.statusText}`
			);
		}

		const data = await response.json();

		// Extract the generated text from the response
		const generatedText = data.choices?.[0]?.message?.content;

		if (!generatedText) {
			throw new Error('No content in OpenRouter response');
		}

		return generatedText;
	} catch (error: unknown) {
		if (error instanceof Error) {
			throw error;
		}
		throw new Error('Unknown error occurred while calling OpenRouter');
	} finally {
		clearTimeout(timeoutId);
	}
}

/**
 * Test OpenRouter connection with a simple ping
 */
export async function testOpenRouterConnection(apiKey: string): Promise<boolean> {
	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minutes timeout
	try {
		const response = await fetch(`${OPENROUTER_BASE_URL}/models`, {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${apiKey}`
			},
			signal: controller.signal
		});

		return response.ok;
	} catch {
		return false;
	} finally {
		clearTimeout(timeoutId);
	}
}

/**
 * Fetch available models from OpenRouter
 */
export interface OpenRouterModel {
	id: string;
	name: string;
	description?: string;
	context_length?: number;
	pricing?: {
		prompt: string;
		completion: string;
	};
}

/**
 * Fetch available models from OpenRouter
 */
export async function fetchAvailableModels(apiKey: string): Promise<OpenRouterModel[]> {
	try {
		const response = await fetch(`${OPENROUTER_BASE_URL}/models`, {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${apiKey}`
			}
		});

		if (!response.ok) {
			throw new Error(`Failed to fetch models: ${response.statusText}`);
		}

		const data = await response.json();

		interface OpenRouterModelResponse {
			id: string;
			name?: string;
			description?: string;
			context_length?: number;
			pricing?: {
				prompt: string;
				completion: string;
			};
		}

		// Extract model details from the response
		return (
			data.data?.map((model: OpenRouterModelResponse) => ({
				id: model.id,
				name: model.name || model.id,
				description: model.description || '',
				context_length: model.context_length,
				pricing: model.pricing
			})) || []
		);
	} catch (error) {
		console.error('Failed to fetch OpenRouter models:', error);
		// Return a fallback list of popular models
		return [
			{
				id: 'x-ai/grok-4.1-fast:free',
				name: 'Grok 4.1 Fast',
				description: 'Large context window & free'
			},
			{ id: 'openai/gpt-5-mini', name: 'GPT-5 Mini', description: 'Fast and affordable' },
			{ id: 'openai/gpt-5.1', name: 'GPT-5.1', description: 'High quality' },
			{
				id: 'anthropic/claude-haiku-4.5',
				name: 'Claude Haiku 4.5',
				description: 'Excellent reasoning'
			},
			{
				id: 'google/gemini-3-pro-preview',
				name: 'Gemini 3 Pro Preview',
				description: 'Best Google model'
			}
		];
	}
}
