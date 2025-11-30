/**
 * Ollama API client for ChronoFlux
 * Handles communication with local Ollama instance running Qwen model
 */

// Support environment variable for Ollama URL (useful for WSL/Docker setups)
const OLLAMA_BASE_URL =
	typeof process !== 'undefined' && process.env?.OLLAMA_URL
		? process.env.OLLAMA_URL
		: 'http://localhost:11434';

const DEFAULT_TIMEOUT = 60000; // 60 seconds
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

export interface OllamaGenerateRequest {
	model: string;
	prompt: string;
	stream?: boolean;
	options?: {
		temperature?: number;
		top_p?: number;
		top_k?: number;
		num_predict?: number;
	};
}

export interface OllamaGenerateResponse {
	model: string;
	created_at: string;
	response: string;
	done: boolean;
	context?: number[];
	total_duration?: number;
	load_duration?: number;
	prompt_eval_duration?: number;
	eval_duration?: number;
}

export interface OllamaError extends Error {
	statusCode?: number;
	retries?: number;
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Call Ollama generate API with timeout and retry logic
 */
export async function generateWithOllama(
	prompt: string,
	options?: {
		model?: string;
		temperature?: number;
		maxTokens?: number;
		timeout?: number;
		baseUrl?: string; // Allow overriding the default base URL
	}
): Promise<string> {
	const model = options?.model || 'qwen3:8b';
	const timeout = options?.timeout || DEFAULT_TIMEOUT;
	const baseUrl = options?.baseUrl || OLLAMA_BASE_URL;

	const request: OllamaGenerateRequest = {
		model,
		prompt,
		stream: false,
		options: {
			temperature: options?.temperature ?? 0.7,
			num_predict: options?.maxTokens ?? 2000
		}
	};

	let lastError: OllamaError | null = null;

	// Retry logic
	for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
		try {
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), timeout);

			const response = await fetch(`${baseUrl}/api/generate`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(request),
				signal: controller.signal
			});

			clearTimeout(timeoutId);

			if (!response.ok) {
				const error: OllamaError = new Error(
					`Ollama API returned status ${response.status}: ${response.statusText}`
				);
				error.statusCode = response.status;
				throw error;
			}

			const data: OllamaGenerateResponse = await response.json();

			if (!data.response) {
				throw new Error('Ollama API returned empty response');
			}

			return data.response;
		} catch (error) {
			const ollamaError = error as OllamaError;

			// Handle abort/timeout
			if (error instanceof Error && error.name === 'AbortError') {
				ollamaError.message = `Request timed out after ${timeout}ms`;
			}

			ollamaError.retries = attempt + 1;
			lastError = ollamaError;

			// Don't retry on client errors (4xx)
			if (ollamaError.statusCode && ollamaError.statusCode >= 400 && ollamaError.statusCode < 500) {
				break;
			}

			// Wait before retrying (exponential backoff)
			if (attempt < MAX_RETRIES - 1) {
				await sleep(RETRY_DELAY * Math.pow(2, attempt));
			}
		}
	}

	// All retries failed
	throw new Error(
		`Failed to generate response from Ollama after ${MAX_RETRIES} attempts: ${lastError?.message || 'Unknown error'}`
	);
}

/**
 * Parse JSON response from AI, with fallback to extracting JSON from markdown code blocks
 */
export function parseAIResponse<T>(response: string): T {
	try {
		// Try direct JSON parse first
		return JSON.parse(response);
	} catch {
		// Try to extract JSON from markdown code blocks
		const jsonMatch = response.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
		if (jsonMatch) {
			try {
				return JSON.parse(jsonMatch[1]);
			} catch {
				throw new Error('Failed to parse JSON from markdown code block');
			}
		}

		// Try to find JSON object in the response
		const objectMatch = response.match(/\{[\s\S]*\}/);
		if (objectMatch) {
			try {
				return JSON.parse(objectMatch[0]);
			} catch {
				throw new Error('Failed to parse JSON object from response');
			}
		}

		throw new Error('No valid JSON found in AI response');
	}
}

/**
 * Test Ollama connection and model availability
 */
export async function testOllamaConnection(model = 'qwen3:8b'): Promise<boolean> {
	try {
		const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json'
			}
		});

		if (!response.ok) {
			return false;
		}

		const data = await response.json();
		const models = data.models || [];

		// Check if the specified model is available
		return models.some((m: { name: string }) => m.name === model);
	} catch {
		return false;
	}
}
