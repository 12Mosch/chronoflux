/**
 * Utility functions for classifying errors
 */

/**
 * Determines if an error message indicates an AI provider issue (Ollama or OpenRouter)
 * @param errorMessage The error message to check
 * @returns true if the error is related to AI provider connectivity or configuration
 */
export function isAIProviderError(errorMessage: string): boolean {
	if (!errorMessage) return false;
	const lowerMessage = errorMessage.toLowerCase();
	return (
		lowerMessage.includes('could not connect') ||
		lowerMessage.includes('openrouter') ||
		lowerMessage.includes('api key') ||
		lowerMessage.includes('rate limit') ||
		lowerMessage.includes('credits')
	);
}

/**
 * Determines if an error is specifically from OpenRouter
 * @param errorMessage The error message to check
 * @returns true if the error is related to OpenRouter
 */
export function isOpenRouterError(errorMessage: string): boolean {
	if (!errorMessage) return false;
	const lowerMessage = errorMessage.toLowerCase();
	return (
		lowerMessage.includes('openrouter') ||
		lowerMessage.includes('api key') ||
		lowerMessage.includes('rate limit') ||
		lowerMessage.includes('credits')
	);
}
