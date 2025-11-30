/**
 * Utility functions for classifying errors
 */

/**
 * Determines if an error message indicates an AI provider issue (Ollama or OpenRouter)
 * @param errorMessage The error message to check
 * @returns true if the error is related to AI provider connectivity or configuration
 */
export function isAIProviderError(errorMessage: string): boolean {
	return (
		errorMessage.includes('Could not connect') ||
		errorMessage.includes('OpenRouter') ||
		errorMessage.includes('API key') ||
		errorMessage.includes('Rate limit') ||
		errorMessage.includes('credits')
	);
}

/**
 * Determines if an error is specifically from OpenRouter
 * @param errorMessage The error message to check
 * @returns true if the error is related to OpenRouter
 */
export function isOpenRouterError(errorMessage: string): boolean {
	return (
		errorMessage.includes('OpenRouter') ||
		errorMessage.includes('API key') ||
		errorMessage.includes('Rate limit') ||
		errorMessage.includes('credits')
	);
}
