import { generateWithOllama, testOllamaConnection, parseAIResponse } from './ollama';

/**
 * Test script for Ollama integration
 * Run this to verify Ollama is properly configured
 */
async function testOllama() {
	console.log('Testing Ollama connection...');

	// Test connection
	const isConnected = await testOllamaConnection('qwen3:8b');
	if (!isConnected) {
		console.error('❌ Ollama is not running or qwen3:8b model is not available');
		console.log('Please ensure:');
		console.log('1. Ollama is running: ollama serve');
		console.log('2. Qwen3 model is installed: ollama pull qwen3:8b');
		return;
	}

	console.log('✅ Ollama connection successful');

	// Test generation
	console.log('\nTesting AI generation...');
	try {
		const response = await generateWithOllama(
			'You are a test AI. Respond with a JSON object: {"status": "working", "message": "Hello from Qwen3!"}',
			{ model: 'qwen3:8b', temperature: 0.1 }
		);

		console.log('Raw response:', response);

		// Test JSON parsing
		const parsed = parseAIResponse<{ status: string; message: string }>(response);
		console.log('Parsed JSON:', parsed);

		if (parsed.status === 'working') {
			console.log('✅ AI generation and parsing successful');
		} else {
			console.warn('⚠️ AI responded but with unexpected content');
		}
	} catch (error) {
		console.error('❌ AI generation failed:', error);
	}
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
	testOllama().catch(console.error);
}

export { testOllama };
