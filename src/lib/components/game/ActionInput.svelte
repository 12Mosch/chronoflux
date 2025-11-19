<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Textarea } from '$lib/components/ui/textarea';
	import { useConvexClient } from 'convex-svelte';
	import { api } from '$convex/_generated/api';
	import type { Id } from '$convex/_generated/dataModel';
	import { page } from '$app/state';

	interface Props {
		onturnsubmitted?: (event: { turnNumber: number }) => void;
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
			const result = await convex.mutation(api.turns.submitTurn, {
				gameId,
				playerAction
			});

			playerAction = '';
			submitError = null; // Clear error on successful submission
			onturnsubmitted?.({ turnNumber: result.turnNumber });
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

<Card.Root>
	<Card.Header>
		<Card.Title>Take Action</Card.Title>
	</Card.Header>
	<Card.Content>
		<Textarea
			placeholder="Describe your action..."
			class="min-h-[100px]"
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
		<Button onclick={handleSubmit} disabled={isSubmitting || !playerAction.trim()}>
			{isSubmitting ? 'Submitting...' : 'Submit Turn'}
		</Button>
	</Card.Footer>
</Card.Root>
