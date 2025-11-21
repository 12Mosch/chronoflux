<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Textarea } from '$lib/components/ui/textarea';
	import { useConvexClient } from 'convex-svelte';
	import { api } from '$convex/_generated/api';
	import type { Id } from '$convex/_generated/dataModel';
	import { page } from '$app/state';
	import { Loader2, Send } from '@lucide/svelte';

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
			// Use the AI action instead of the basic mutation
			const result = await convex.action(api.turns.submitTurnWithAI, {
				gameId,
				playerAction
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
				throw new Error('Turn submission failed');
			}
		} catch (error) {
			console.error('Failed to submit turn:', error);
			// Set user-friendly error message
			submitError =
				error instanceof Error
					? `Failed to submit turn: ${error.message}`
					: 'An unexpected error occurred while submitting your turn. Please try again.';
		} finally {
			isSubmitting = false;
		}
	}
</script>

<Card.Root class="flex h-full flex-col">
	<Card.Header class="pb-3">
		<Card.Title class="flex items-center gap-2">
			<Send class="h-5 w-5" />
			Take Action
		</Card.Title>
	</Card.Header>
	<Card.Content class="flex-1 pb-3">
		<Textarea
			placeholder="Describe your action (e.g., 'Invest in military infrastructure', 'Propose a trade alliance with France')..."
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
				<Loader2 class="mr-2 h-4 w-4 animate-spin" />
				Processing Turn...
			{:else}
				Submit Turn
			{/if}
		</Button>
	</Card.Footer>
</Card.Root>
