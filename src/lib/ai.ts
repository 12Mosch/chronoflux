/**
 * Client-side AI Integration for ChronoFlux
 * Handles AI-powered turn processing using local Ollama instance
 */

/**
 * AI Response structure from Ollama
 */
export interface AIActionResponse {
	feasibility: 'high' | 'medium' | 'low';
	immediate_consequences: string[];
	nation_reactions: Record<string, string>;
	resource_changes: Record<string, number>;
	relationship_changes?: Array<{
		nation1: string;
		nation2: string;
		scoreChange: number;
		statusChange?: 'allied' | 'neutral' | 'hostile' | 'at_war';
	}>;
	narrative: string;
}

export interface AIEventResponse {
	type: 'political' | 'military' | 'diplomatic' | 'economic' | 'other';
	title: string;
	description: string;
	affected_nations: string[];
	impact: Record<string, number>;
}

export interface AIProcessingResult {
	events: AIEventResponse[];
	consequences: string;
	narrative: string;
	resourceChanges: Record<string, number>;
	relationshipChanges: Array<{
		nation1: string;
		nation2: string;
		scoreChange: number;
		statusChange?: 'allied' | 'neutral' | 'hostile' | 'at_war';
	}>;
	feasibility: 'high' | 'medium' | 'low';
}

/**
 * Build Action Interpretation prompt
 */
function buildActionInterpretationPrompt(
	playerNationName: string,
	currentYear: number,
	playerAction: string,
	worldState: {
		playerResources: Record<string, number>;
		relationships: Array<{ name: string; status: string; score: number }>;
		recentEvents: string[];
	}
): string {
	const { playerResources, relationships, recentEvents } = worldState;

	return `You are a historical simulation AI. A player controlling ${playerNationName} in ${currentYear} has taken the following action:

Action: ${playerAction}

Current World State:
- Nation Resources:
  - Military: ${playerResources.military || 0}
  - Economy: ${playerResources.economy || 0}
  - Stability: ${playerResources.stability || 0}
  - Influence: ${playerResources.influence || 0}

- Relationships:
${relationships.map((r) => `  - ${r.name}: ${r.status} (score: ${r.score})`).join('\n')}

- Recent Events:
${recentEvents.length > 0 ? recentEvents.map((e) => `  - ${e}`).join('\n') : '  - None'}

Analyze this action and determine:
1. Is it feasible given the nation's current state?
2. What are the immediate consequences?
3. How will other nations react?
4. What resources are required/affected?

Respond in JSON format:
{
  "feasibility": "high|medium|low",
  "immediate_consequences": ["consequence1", "consequence2"],
  "nation_reactions": {"nationName": "reaction description"},
  "resource_changes": {"military": -10, "economy": 5, "stability": -2, "influence": 3},
  "relationship_changes": [{"nation1": "nation1Name", "nation2": "nation2Name", "scoreChange": -15}],
  "narrative": "A detailed description of what happens as a result of this action"
}`;
}

/**
 * Build Event Generation prompt
 */
function buildEventGenerationPrompt(
	turnNumber: number,
	currentYear: number,
	playerAction: string,
	actionResponse: AIActionResponse
): string {
	return `Based on the player's action and its consequences, generate 1-3 significant events that occur this turn.

Context:
- Turn: ${turnNumber}
- Year: ${currentYear}
- Player Action: ${playerAction}
- Feasibility: ${actionResponse.feasibility}
- Consequences: ${actionResponse.immediate_consequences.join(', ')}

Generate events in JSON format (array):
[
  {
    "type": "political|military|diplomatic|economic|other",
    "title": "Brief event title",
    "description": "Detailed event description",
    "affected_nations": ["nation1", "nation2"],
    "impact": {"resourceType": changeAmount}
  }
]`;
}

/**
 * Parse JSON from AI response, handling various formats
 */
function parseAIJSON<T>(response: string): T {
	try {
		// Try direct parse
		return JSON.parse(response);
	} catch {
		// Extract from markdown code block
		const jsonMatch = response.match(/```(?:json)?\s*(\{[\s\S]*?\}|\[[\s\S]*?\])\s*```/);
		if (jsonMatch) {
			return JSON.parse(jsonMatch[1]);
		}

		// Try to find JSON in response
		const objectMatch = response.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
		if (objectMatch) {
			return JSON.parse(objectMatch[0]);
		}

		throw new Error('No valid JSON found in AI response');
	}
}

/**
 * Call Ollama API from client-side
 */
async function callOllama(prompt: string, temperature = 0.7): Promise<string> {
	// Default to localhost, but allow override via localStorage for advanced users if needed
	const OLLAMA_URL = localStorage.getItem('OLLAMA_URL') || 'http://localhost:11434';
	const MODEL = localStorage.getItem('OLLAMA_MODEL') || 'qwen3:8b';

	try {
		const response = await fetch(`${OLLAMA_URL}/api/generate`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				model: MODEL,
				prompt,
				stream: false,
				options: {
					temperature,
					num_predict: 2000
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
				'Could not connect to Ollama. Please ensure:\n1. Ollama is running (`ollama serve`)\n2. CORS is enabled (`OLLAMA_ORIGINS="*"`)\n3. The model is pulled (`ollama pull qwen3:8b`)'
			);
		}
		throw error;
	}
}

/**
 * Process turn with AI - Client-side orchestration
 */
export async function processTurnWithLocalAI(
	playerAction: string,
	gameContext: {
		playerNationName: string;
		currentYear: number;
		turnNumber: number;
		worldState: {
			playerResources: Record<string, number>;
			relationships: Array<{ name: string; status: string; score: number }>;
			recentEvents: string[];
		};
	}
): Promise<AIProcessingResult> {
	// Build and execute Action Interpretation prompt
	const actionPrompt = buildActionInterpretationPrompt(
		gameContext.playerNationName,
		gameContext.currentYear,
		playerAction,
		gameContext.worldState
	);

	let actionResponse: AIActionResponse;
	try {
		const rawActionResponse = await callOllama(actionPrompt);
		actionResponse = parseAIJSON<AIActionResponse>(rawActionResponse);
	} catch (error) {
		console.error('Failed to parse AI action response:', error);
		// Fallback response
		actionResponse = {
			feasibility: 'medium',
			immediate_consequences: ['Action being evaluated...'],
			nation_reactions: {},
			resource_changes: {},
			narrative: `${gameContext.playerNationName} attempts to ${playerAction}. The consequences are still unfolding.`
		};
	}

	// Build and execute Event Generation prompt
	const eventPrompt = buildEventGenerationPrompt(
		gameContext.turnNumber,
		gameContext.currentYear,
		playerAction,
		actionResponse
	);

	let events: AIEventResponse[] = [];
	try {
		const rawEventResponse = await callOllama(eventPrompt, 0.8);
		events = parseAIJSON<AIEventResponse[]>(rawEventResponse);
	} catch (error) {
		console.error('Failed to parse AI event response:', error);
		// Generate a basic event as fallback
		events = [
			{
				type: 'other',
				title: `${gameContext.playerNationName}'s Action`,
				description: actionResponse.narrative,
				affected_nations: [gameContext.playerNationName],
				impact: actionResponse.resource_changes
			}
		];
	}

	// Return structured AI response
	return {
		events,
		consequences: actionResponse.immediate_consequences.join('. '),
		narrative: actionResponse.narrative,
		resourceChanges: actionResponse.resource_changes || {},
		relationshipChanges: actionResponse.relationship_changes || [],
		feasibility: actionResponse.feasibility
	};
}
