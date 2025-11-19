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

	const gameId = $derived(page.params.gameId as Id<'games'>);

	async function handleSubmit() {
		if (!playerAction.trim() || !gameId) return;

		isSubmitting = true;
		try {
			const result = await convex.mutation(api.turns.submitTurn, {
				gameId,
				playerAction
			});

			playerAction = '';
			onturnsubmitted?.({ turnNumber: result.turnNumber });
		} catch (error) {
			console.error('Failed to submit turn:', error);
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
	</Card.Content>
	<Card.Footer>
		<Button onclick={handleSubmit} disabled={isSubmitting || !playerAction.trim()}>
			{isSubmitting ? 'Submitting...' : 'Submit Turn'}
		</Button>
	</Card.Footer>
</Card.Root>
