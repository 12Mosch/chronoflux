/**
 * Client-side AI Integration for ChronoFlux
 * Handles AI-powered turn processing using configurable AI providers (Ollama, OpenRouter)
 */

/**
 * Retry configuration
 */
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

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
	new_nations?: Record<
		string,
		{
			government: string;
			territories: string[];
			resources: {
				military: number;
				economy: number;
				stability: number;
				influence: number;
			};
		}
	>;
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
	historySummary?: string;
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
		turnHistory: Array<{
			turnNumber: number;
			playerAction: string;
			narrative: string;
			consequences: string;
			events: Array<{ title: string; description: string; type: string }>;
			worldStateChanges: Record<string, unknown>;
		}>;
		historySummary?: string;
		otherNations?: Array<{ name: string; government: string }>;
	}
): string {
	const { playerResources, relationships, turnHistory, historySummary, otherNations } = worldState;

	// Format turn history for the prompt
	const historyText =
		turnHistory.length > 0
			? turnHistory
					.map(
						(turn) => `
Turn ${turn.turnNumber}:
  Action: ${turn.playerAction}
  Outcome: ${turn.narrative}
  Consequences: ${turn.consequences}
  Events: ${turn.events.map((e) => `\n    - ${e.title}: ${e.description}`).join('')}
  Resource Changes: ${JSON.stringify(turn.worldStateChanges || {})}`
					)
					.join('\n')
			: '  No previous turns';

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

- Other Known Nations:
${otherNations?.map((n) => `  - ${n.name} (${n.government})`).join('\n') || '  None'}

- Recent Turn History (Last 5 Turns):
${historyText}

- Historical Summary (Previous Eras):
${historySummary || 'No historical summary available yet.'}


Analyze this action IN THE CONTEXT OF THE RECENT HISTORY and determine:
1. Is it feasible given the nation's current state?
2. What are the immediate consequences?
3. How will other nations react?
4. What resources are required/affected?
5. How does this build upon or contradict recent actions?
6. If you introduce a NEW nation (one not listed in 'Relationships' or 'Other Known Nations'), you MUST provide its details (government, territories, resources) in the 'new_nations' field.

Respond in JSON format:
{
  "feasibility": "high|medium|low",
  "immediate_consequences": ["consequence1", "consequence2"],
  "nation_reactions": {"nationName": "reaction description"},
  "resource_changes": {"military": -10, "economy": 5, "stability": -2, "influence": 3},
  "relationship_changes": [{"nation1": "nation1Name", "nation2": "nation2Name", "scoreChange": -15}],
  "new_nations": {
    "NationName": {
      "government": "Republic",
      "territories": ["Region1", "Region2"],
      "resources": {"military": 50, "economy": 50, "stability": 50, "influence": 50}
    }
  },
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
 * Build Summarization prompt
 */
function buildSummarizationPrompt(
	currentSummary: string,
	recentTurns: Array<{
		turnNumber: number;
		playerAction: string;
		narrative: string;
		consequences: string;
		events: Array<{ title: string; description: string }>;
	}>
): string {
	const recentHistoryText = recentTurns
		.map(
			(turn) => `
Turn ${turn.turnNumber}:
  Action: ${turn.playerAction}
  Outcome: ${turn.narrative}
  Events: ${turn.events.map((e) => e.title).join(', ')}`
		)
		.join('\n');

	return `You are the official historian of this nation. Update the historical summary to include the events of the last few turns.

Current Summary:
${currentSummary || 'The nation has just begun its journey.'}

Recent Events to Add:
${recentHistoryText}

Task:
Write a concise, updated summary (max 2 paragraphs) that integrates the recent events into the overall history. Focus on major trends, eras, and pivotal moments. Do not list every minor detail.

Response Format:
Just the updated summary text.`;
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
			let jsonStr = objectMatch[0];
			// Sanitize common JSON errors:
			// 1. Remove leading '+' from numbers (e.g. "+5" -> "5")
			jsonStr = jsonStr.replace(/:\s*\+(\d+)/g, ': $1');
			// 2. Remove trailing commas before closing braces/brackets
			jsonStr = jsonStr.replace(/,\s*([}\]])/g, '$1');
			// 3. Remove comments
			jsonStr = jsonStr.replace(/\/\/.*$/gm, '');
			jsonStr = jsonStr.replace(/\/\*[\s\S]*?\*\//g, '');
			return JSON.parse(jsonStr);
		}

		throw new Error('No valid JSON found in AI response');
	}
}

/**
 * Retry wrapper with exponential backoff for AI calls
 */
async function callAIWithRetry<T>(
	prompt: string,
	temperature: number,
	parser: (response: string) => T,
	onRetry?: (attempt: number, error: Error) => void
): Promise<T> {
	let lastError: Error | null = null;

	for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
		try {
			const rawResponse = await callAI(prompt, temperature);
			return parser(rawResponse);
		} catch (error) {
			lastError = error instanceof Error ? error : new Error(String(error));

			// Don't retry connection errors - user needs to fix their setup
			if (lastError.message.includes('Could not connect')) {
				throw lastError;
			}

			// If this was the last attempt, throw the error
			if (attempt === MAX_RETRIES) {
				break;
			}

			// Notify about retry and wait with exponential backoff
			onRetry?.(attempt, lastError);
			const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1);
			await new Promise((resolve) => setTimeout(resolve, delay));
		}
	}

	// All retries failed
	throw lastError;
}

/**
 * Call AI provider (Ollama or OpenRouter) from client-side
 */
async function callAI(prompt: string, temperature = 0.7): Promise<string> {
	const { generateText } = await import('$lib/utils/aiProvider');
	return generateText(prompt, { temperature, maxTokens: 2000 });
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
			turnHistory: Array<{
				turnNumber: number;
				playerAction: string;
				narrative: string;
				consequences: string;
				events: Array<{ title: string; description: string; type: string }>;
				worldStateChanges: Record<string, unknown>;
			}>;
			historySummary?: string;
			otherNations?: Array<{ name: string; government: string }>;
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
	let actionRetryCount = 0;
	try {
		actionResponse = await callAIWithRetry(
			actionPrompt,
			0.7,
			(response) => parseAIJSON<AIActionResponse>(response),
			(attempt, error) => {
				actionRetryCount = attempt;
				console.warn(
					`AI action response parsing failed (attempt ${attempt}/${MAX_RETRIES}):`,
					error.message
				);
			}
		);

		// Log warning if retries were needed
		if (actionRetryCount > 0) {
			console.warn(
				`AI action response required ${actionRetryCount} ${actionRetryCount === 1 ? 'retry' : 'retries'}`
			);
		}
	} catch (error) {
		console.error('Failed to get AI action response after all retries:', error);
		// Re-throw connection errors - user needs to fix their AI provider setup
		if (error instanceof Error && error.message.includes('Could not connect')) {
			throw error;
		}
		// For other errors (like JSON parsing), use fallback response
		console.warn('Using fallback action response');
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
	let eventRetryCount = 0;
	try {
		events = await callAIWithRetry(
			eventPrompt,
			0.8,
			(response) => parseAIJSON<AIEventResponse[]>(response),
			(attempt, error) => {
				eventRetryCount = attempt;
				console.warn(
					`AI event response parsing failed (attempt ${attempt}/${MAX_RETRIES}):`,
					error.message
				);
			}
		);

		// Log warning if retries were needed
		if (eventRetryCount > 0) {
			console.warn(
				`AI event response required ${eventRetryCount} ${eventRetryCount === 1 ? 'retry' : 'retries'}`
			);
		}
	} catch (error) {
		console.error('Failed to get AI event response after all retries:', error);
		// Re-throw connection errors
		if (error instanceof Error && error.message.includes('Could not connect')) {
			throw error;
		}
		// For other errors (like JSON parsing), generate a basic event as fallback
		console.warn('Using fallback event response');
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

	// 3. Check if summarization is needed (every 5 turns)
	let newHistorySummary: string | undefined;
	if (gameContext.turnNumber % 5 === 0) {
		const summarizationPrompt = buildSummarizationPrompt(
			gameContext.worldState.historySummary || '',
			gameContext.worldState.turnHistory.map((t) => ({
				turnNumber: t.turnNumber,
				playerAction: t.playerAction,
				narrative: t.narrative,
				consequences: t.consequences,
				events: t.events
			}))
		);

		try {
			newHistorySummary = await callAI(summarizationPrompt, 0.6);
		} catch (error) {
			console.error('Failed to generate history summary:', error);
			// Fail silently for summarization, don't block the turn
		}
	}
	return {
		events,
		consequences: actionResponse.immediate_consequences.join('. '),
		narrative: actionResponse.narrative,
		resourceChanges: actionResponse.resource_changes || {},
		relationshipChanges: actionResponse.relationship_changes || [],
		feasibility: actionResponse.feasibility,
		historySummary: newHistorySummary
	};
}

/**
 * Build Advisor prompt
 */
function buildAdvisorPrompt(
	question: string,
	gameContext: {
		playerNationName: string;
		currentYear: number;
		worldState: {
			playerResources: Record<string, number>;
			relationships: Array<{ name: string; status: string; score: number }>;
			turnHistory: Array<{
				turnNumber: number;
				playerAction: string;
				narrative: string;
				consequences: string;
				events: Array<{ title: string; description: string; type: string }>;
			}>;
			historySummary?: string;
			otherNations?: Array<{ name: string; government: string }>;
		};
	}
): string {
	const { playerResources, relationships, turnHistory, historySummary, otherNations } =
		gameContext.worldState;

	// Format recent history
	const recentHistoryText =
		turnHistory.length > 0
			? turnHistory
					.slice(0, 5) // Last 5 turns
					.map(
						(turn) => `
Turn ${turn.turnNumber}:
  Action: ${turn.playerAction}
  Outcome: ${turn.narrative}
  Events: ${turn.events.map((e) => e.title).join(', ')}`
					)
					.join('\n')
			: '  No previous turns';

	return `You are the Royal Advisor to the leader of ${gameContext.playerNationName}. The year is ${gameContext.currentYear}.
Your duty is to provide strategic counsel, analyze threats, and summarize the state of the realm.
Speak in character: wise, loyal, and slightly formal, but clear and concise.

Current State of the Realm:
- Resources:
  - Military: ${playerResources.military || 0}
  - Economy: ${playerResources.economy || 0}
  - Stability: ${playerResources.stability || 0}
  - Influence: ${playerResources.influence || 0}

- Relationships:
${relationships.map((r) => `  - ${r.name}: ${r.status} (score: ${r.score})`).join('\n')}

- Other Known Nations:
${otherNations?.map((n) => `  - ${n.name} (${n.government})`).join('\n') || '  None'}

- Recent History:
${recentHistoryText}

- Historical Context:
${historySummary || 'The nation is in its early days.'}

The leader asks: "${question}"

Provide your counsel. Keep it under 200 words. Focus on actionable advice or relevant analysis.
Format your response using Markdown for better readability (use **bold** for emphasis, bullet points for lists, etc.).`;
}

/**
 * Ask the Advisor
 */
export async function askAdvisor(
	question: string,
	gameContext: {
		playerNationName: string;
		currentYear: number;
		worldState: {
			playerResources: Record<string, number>;
			relationships: Array<{ name: string; status: string; score: number }>;
			turnHistory: Array<{
				turnNumber: number;
				playerAction: string;
				narrative: string;
				consequences: string;
				events: Array<{ title: string; description: string; type: string }>;
				worldStateChanges: Record<string, unknown>;
			}>;
			historySummary?: string;
			otherNations?: Array<{ name: string; government: string }>;
		};
	}
): Promise<string> {
	const prompt = buildAdvisorPrompt(question, gameContext);

	try {
		return await callAI(prompt, 0.7);
	} catch (error) {
		console.error('Failed to get advisor response:', error);
		if (error instanceof Error && error.message.includes('Could not connect')) {
			throw error;
		}
		return 'My apologies, my liege. My mind is clouded (AI Error). Please try again later.';
	}
}
