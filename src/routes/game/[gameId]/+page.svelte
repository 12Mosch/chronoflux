<script lang="ts">
	import NationPanel from '$lib/components/game/NationPanel.svelte';
	import WorldMap from '$lib/components/game/WorldMap.svelte';
	import EventLog from '$lib/components/game/EventLog.svelte';
	import ActionInput from '$lib/components/game/ActionInput.svelte';
	import TurnSummary from '$lib/components/game/TurnSummary.svelte';
	import { useQuery } from 'convex-svelte';
	import { api } from '$convex/_generated/api';
	import type { Id } from '$convex/_generated/dataModel';
	import { page } from '$app/state';
	import { gameState } from '$lib/stores/gameState';

	const gameId = $derived(page.params.gameId as Id<'games'>);
	const worldState = $derived(useQuery(api.world.getWorldState, gameId ? { gameId } : 'skip'));

	let showTurnSummary = $state(false);

	// Update game state store when world state loads
	$effect(() => {
		if (worldState.data) {
			const { game, scenario, playerNation } = worldState.data;
			gameState.set({
				nationName: playerNation?.name || 'Unknown',
				nationFlag: '', // Can be added later
				turn: game.currentTurn,
				year: scenario.startYear + game.currentTurn - 1
			});
		}
	});
</script>

{#if worldState.isLoading}
	<div class="flex h-full items-center justify-center">
		<p class="text-muted-foreground">Loading game state...</p>
	</div>
{:else if worldState.error}
	<div class="flex h-full items-center justify-center">
		<p class="text-destructive">Error loading game: {worldState.error.toString()}</p>
	</div>
{:else if worldState.data === null}
	<div class="flex h-full items-center justify-center">
		<p class="text-muted-foreground">Game not found.</p>
	</div>
{:else if worldState.data}
	<div class="grid h-full grid-cols-1 gap-4 lg:grid-cols-3">
		<!-- Left Column: Nation Panel & Event Log -->
		<div class="flex flex-col gap-4 lg:col-span-1">
			<div class="flex-none">
				<NationPanel
					playerNation={worldState.data.playerNation}
					allNations={worldState.data.nations}
				/>
			</div>
			<div class="min-h-[300px] grow">
				<EventLog />
			</div>
		</div>

		<!-- Right Column: World Map & Action Input -->
		<div class="flex flex-col gap-4 lg:col-span-2">
			<div class="grow">
				<WorldMap
					nations={worldState.data.nations}
					relationships={worldState.data.relationships}
					playerNation={worldState.data.playerNation}
				/>
			</div>
			<div class="flex-none">
				<ActionInput onturnsubmitted={() => (showTurnSummary = true)} />
			</div>
		</div>
	</div>

	<TurnSummary bind:open={showTurnSummary} />
{/if}
