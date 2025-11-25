<script lang="ts">
	import * as m from '$lib/paraglide/messages';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Textarea } from '$lib/components/ui/textarea';
	import { useConvexClient } from 'convex-svelte';
	import { api } from '$convex/_generated/api';
	import type { Id } from '$convex/_generated/dataModel';
	import { page } from '$app/state';
	import { LoaderCircle, Send } from '@lucide/svelte';

	import { processTurnWithLocalAI } from '$lib/ai';
	import OllamaErrorDialog from './OllamaErrorDialog.svelte';

	type TurnData = {
		turnNumber: number;
		playerAction: string;
		narrative?: string;
		consequences?: string;
		events?: Array<{
			type: string;
			title: string;
			description: string;
		}>;
		resourceChanges?: Record<string, number>;
	} | null;

	interface Props {
		onturnsubmitted?: (event: { turnData: TurnData }) => void;
	}

	let { onturnsubmitted }: Props = $props();

	const convex = useConvexClient();

	let playerAction = $state('');
	let isSubmitting = $state(false);
	let submitError = $state<string | null>(null);
	let showOllamaErrorDialog = $state(false);
	let ollamaErrorMessage = $state('');

	const gameId = $derived(page.params.gameId as Id<'games'>);

	// Clear error when input changes
	$effect(() => {
		if (playerAction) {
			submitError = null;
		}
	});

	async function handleSubmit() {
		if (!playerAction.trim() || !gameId) return;

		isSubmitting = true;
		submitError = null; // Clear any previous errors
		try {
			// 1. Fetch game context
			const gameContext = await convex.query(api.games.getGameContext, { gameId });
			if (!gameContext) throw new Error(m.failed_load_game_context());

			// 2. Process with local AI
			const aiResponse = await processTurnWithLocalAI(playerAction, gameContext);

			// 3. Sanitize AI response to ensure event types are valid
			const validEventTypes = ['political', 'military', 'diplomatic', 'economic', 'other'] as const;
			const sanitizedEvents = aiResponse.events.map((event) => {
				const isValidType = validEventTypes.includes(
					event.type as (typeof validEventTypes)[number]
				);
				if (!isValidType) {
					console.warn(
						`Invalid event type "${event.type}" sanitized to "other" for event: ${event.title}`
					);
				}
				return {
					...event,
					type: isValidType ? event.type : 'other'
				};
			});

			// 4. Persist results
			// Extract historySummary from aiResponse since it's a separate argument in the mutation
			// Note: We use sanitizedEvents instead of the original events from aiResponse
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const { historySummary, events: _, ...restOfResponse } = aiResponse;
			const result = await convex.mutation(api.turns.persistTurnWithAIResponse, {
				gameId,
				playerAction,
				aiResponse: {
					...restOfResponse,
					events: sanitizedEvents
				},
				historySummary
			});

			if (result.success) {
				const currentAction = playerAction;
				playerAction = '';
				submitError = null; // Clear error on successful submission

				const turnData: TurnData = {
					turnNumber: result.turnNumber,
					playerAction: currentAction,
					narrative: result.narrative,
					consequences: result.consequences,
					events:
						result.events?.map((e: { type: string; title: string; description: string }) => ({
							type: e.type,
							title: e.title,
							description: e.description
						})) ?? [],
					resourceChanges: result.resourceChanges
				};

				onturnsubmitted?.({ turnData });
			} else {
				throw new Error(m.turn_submission_failed());
			}
		} catch (error) {
			console.error('Failed to submit turn:', error);

			// Check if this is an Ollama connection error
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			if (errorMessage.includes('Could not connect to Ollama')) {
				// Show the friendly Ollama error dialog
				ollamaErrorMessage = errorMessage;
				showOllamaErrorDialog = true;
			} else {
				// Set user-friendly error message for other errors
				submitError =
					error instanceof Error
						? m.failed_submit_turn({ error: error.message })
						: m.unexpected_error_submit();
			}
		} finally {
			isSubmitting = false;
		}
	}
</script>

<Card.Root class="flex h-full flex-col">
	<Card.Header class="pb-3">
		<Card.Title class="flex items-center gap-2">
			<Send class="h-5 w-5" />
			{m.take_action()}
		</Card.Title>
	</Card.Header>
	<Card.Content class="flex-1 pb-3">
		<Textarea
			placeholder={m.action_placeholder()}
			class="h-full min-h-[100px] resize-none"
			bind:value={playerAction}
			disabled={isSubmitting}
		/>
		{#if submitError}
			<div class="mt-2 text-sm text-red-600 dark:text-red-400" role="alert" aria-live="polite">
				{submitError}
			</div>
		{/if}
	</Card.Content>
	<Card.Footer>
		<Button onclick={handleSubmit} disabled={isSubmitting || !playerAction.trim()} class="w-full">
			{#if isSubmitting}
				<LoaderCircle class="mr-2 h-4 w-4 animate-spin" />
				{m.processing_turn()}
			{:else}
				{m.submit_turn()}
			{/if}
		</Button>
	</Card.Footer>
</Card.Root>

<!-- Ollama Error Dialog -->
<OllamaErrorDialog bind:open={showOllamaErrorDialog} errorMessage={ollamaErrorMessage} />
