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
export async function fetchAvailableModels(apiKey: string): Promise<string[]> {
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

		// Extract model IDs from the response
		return data.data?.map((model: { id: string }) => model.id) || [];
	} catch (error) {
		console.error('Failed to fetch OpenRouter models:', error);
		// Return a fallback list of popular models
		return [
			'x-ai/grok-4.1-fast:free',
			'openai/gpt-5-mini',
			'openai/gpt-5.1',
			'anthropic/claude-haiku-4.5',
			'google/gemini-3-pro-preview'
		];
	}
}
