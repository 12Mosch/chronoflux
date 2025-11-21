<script lang="ts">
	import { page } from '$app/state';
	import { useQuery } from 'convex-svelte';
	import { api } from '$convex/_generated/api';
	import type { Id } from '$convex/_generated/dataModel';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { ArrowLeft } from '@lucide/svelte';

	const gameId = $derived(page.params.gameId as Id<'games'>);
	const turns = $derived(useQuery(api.turns.getTurnsForGame, gameId ? { gameId } : 'skip'));
</script>

<div class="container mx-auto p-4">
	<Button variant="ghost" class="mb-4" onclick={() => history.back()}>
		<ArrowLeft class="mr-2 h-4 w-4" />
		Back to Game
	</Button>

	<Card.Root>
		<Card.Header>
			<Card.Title>Game History</Card.Title>
		</Card.Header>
		<Card.Content>
			{#if turns.isLoading}
				<p>Loading...</p>
			{:else if turns.error}
				<p class="text-destructive">Error loading history</p>
			{:else if turns.data}
				<div class="relative ml-4 space-y-8 border-l border-muted-foreground/20 py-4">
					{#each turns.data as turn (turn._id)}
						<div class="relative pl-8">
							<span class="absolute top-1.5 -left-1.5 h-3 w-3 rounded-full bg-primary"></span>
							<div class="flex flex-col gap-2">
								<div class="text-lg font-bold">Turn {turn.turnNumber}</div>
								<div class="rounded-lg bg-muted p-4">
									<div class="mb-1 font-semibold">Player Action</div>
									<p>{turn.playerAction}</p>
								</div>
								{#if turn.aiResponse}
									<div class="rounded-lg bg-secondary/20 p-4">
										<div class="mb-1 font-semibold">AI Response</div>
										{#if turn.aiResponse.narrative}
											<p class="mb-2 italic">{turn.aiResponse.narrative}</p>
										{/if}
										{#if turn.aiResponse.consequences}
											<p class="text-sm text-muted-foreground">{turn.aiResponse.consequences}</p>
										{/if}
										{#if turn.aiResponse.events?.length > 0}
											<div class="mt-3">
												<div class="mb-1 text-sm font-semibold">Events:</div>
												{#each turn.aiResponse.events as event (event.title)}
													<div class="ml-2 text-sm">
														<span class="font-medium">{event.title}:</span>
														{event.description}
													</div>
												{/each}
											</div>
										{/if}
									</div>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</Card.Content>
	</Card.Root>
</div>
