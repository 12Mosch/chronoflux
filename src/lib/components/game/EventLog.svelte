<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import { useQuery } from 'convex-svelte';
	import { api } from '$convex/_generated/api';
	import type { Id } from '$convex/_generated/dataModel';
	import { page } from '$app/state';

	const gameId = $derived(page.params.gameId as Id<'games'>);
	const turns = $derived(useQuery(api.turns.getTurnsForGame, gameId ? { gameId } : 'skip'));
</script>

<Card.Root class="h-full">
	<Card.Header>
		<Card.Title>Event Log</Card.Title>
	</Card.Header>
	<Card.Content class="max-h-[500px] overflow-y-auto">
		{#if turns.isLoading}
			<p class="text-muted-foreground">Loading events...</p>
		{:else if turns.error}
			<p class="text-destructive">Error loading events.</p>
		{:else if turns.data}
			{#if turns.data.length === 0}
				<p class="text-muted-foreground">No events yet.</p>
			{:else}
				<div class="space-y-4">
					{#each turns.data as turn (turn._id)}
						<div class="border-b pb-2 last:border-0">
							<div class="mb-1 flex items-center justify-between">
								<span class="font-semibold">Turn {turn.turnNumber}</span>
							</div>
							<p class="text-sm">{turn.playerAction}</p>
							{#if turn.aiResponse?.narrative}
								<p class="mt-1 text-sm text-muted-foreground italic">{turn.aiResponse.narrative}</p>
							{/if}
							{#if turn.aiResponse?.consequences}
								<p class="mt-1 text-xs text-muted-foreground">{turn.aiResponse.consequences}</p>
							{/if}
						</div>
					{/each}
				</div>
			{/if}
		{/if}
	</Card.Content>
</Card.Root>
