<script lang="ts">
	import { goto } from '$app/navigation';
	import { useConvexClient, useQuery } from 'convex-svelte';
	import { api } from '../../convex/_generated/api.js';
	import type { Doc } from '../../convex/_generated/dataModel';

	import ScenarioCard from '$lib/components/scenarios/ScenarioCard.svelte';
	import { Button } from '$lib/components/ui/button';
	import {
		Dialog,
		DialogContent,
		DialogDescription,
		DialogFooter,
		DialogHeader,
		DialogTitle
	} from '$lib/components/ui/dialog';

	type ScenarioDoc = Doc<'scenarios'>;
	type NationConfig = ScenarioDoc['initialWorldState']['nations'][number];

	const scenarios = useQuery(api.scenarios.listScenarios, {});
	const client = useConvexClient();

	let selectedScenario = $state<ScenarioDoc | null>(null);
	let selectedNationId = $state<string | null>(null);
	let isNationDialogOpen = $state(false);
	let createError = $state<string | null>(null);
	let isCreating = $state(false);

	const availableNations = $derived<NationConfig[]>(
		selectedScenario?.initialWorldState.nations ?? []
	);

	function handlePlay(scenario: ScenarioDoc) {
		selectedScenario = scenario;
		selectedNationId = null;
		createError = null;
		isNationDialogOpen = true;
	}

	async function startGame() {
		if (!selectedScenario || !selectedNationId) return;

		try {
			isCreating = true;
			createError = null;

			const gameId = await client.mutation(api.games.createGame, {
				scenarioId: selectedScenario._id,
				playerNationId: selectedNationId
			});

			await goto(`/game/${gameId}`);
		} catch (err) {
			console.error(err);
			createError = err instanceof Error ? err.message : 'Failed to create game';
		} finally {
			isCreating = false;
		}
	}
</script>

<div class="min-h-screen bg-linear-to-b from-slate-900 to-slate-800 text-white">
	<div class="container mx-auto px-4 py-10">
		<div class="mb-8">
			<h1 class="text-3xl font-bold md:text-4xl">Choose a Scenario</h1>
			<p class="mt-2 text-slate-300">
				Pick a historical starting point and nation to begin a new game.
			</p>
		</div>

		{#if scenarios.isLoading}
			<p class="text-slate-300">Loading scenarios...</p>
		{:else if scenarios.error}
			<p class="text-red-400">
				Failed to load scenarios: {scenarios.error.toString()}
			</p>
		{:else if !scenarios.data || scenarios.data.length === 0}
			<p class="text-slate-300">
				No scenarios are available yet. Seed scenarios in Convex or create one with the
				editor.
			</p>
		{:else}
			<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
				{#each scenarios.data as scenario (scenario._id)}
					<ScenarioCard
						{scenario}
						onPlay={handlePlay}
						isCreating={isCreating && selectedScenario?._id === scenario._id}
					/>
				{/each}
			</div>
		{/if}
	</div>

	<Dialog bind:open={isNationDialogOpen}>
		<DialogContent class="max-w-lg">
			<DialogHeader>
				<DialogTitle>Select Nation</DialogTitle>
				{#if selectedScenario}
					<DialogDescription>
						Choose a nation to play in "{selectedScenario.name}".
					</DialogDescription>
				{/if}
			</DialogHeader>

			{#if !selectedScenario}
				<p class="text-sm text-muted-foreground">No scenario selected.</p>
			{:else if availableNations.length === 0}
				<p class="text-sm text-muted-foreground">
					This scenario has no nations configured yet.
				</p>
			{:else}
				<div class="mt-4 space-y-2">
					{#each availableNations as nation}
						<button
							type="button"
							class="w-full rounded-md border border-input bg-background px-3 py-2 text-left text-sm shadow-xs hover:bg-accent/60 data-[active=true]:bg-primary data-[active=true]:text-primary-foreground"
							data-active={selectedNationId === nation.id}
							onclick={() => (selectedNationId = nation.id)}
						>
							<div class="flex items-center justify-between">
								<span class="font-medium">{nation.name}</span>
								<span class="text-xs text-slate-300">{nation.government}</span>
							</div>
						</button>
					{/each}
				</div>
			{/if}

			{#if createError}
				<p class="mt-3 text-sm text-red-400">{createError}</p>
			{/if}

			<DialogFooter class="mt-6 flex justify-end gap-2">
				<Button
					variant="ghost"
					onclick={() => (isNationDialogOpen = false)}
					disabled={isCreating}
				>
					Cancel
				</Button>
				<Button
					onclick={startGame}
					disabled={!selectedScenario || !selectedNationId || availableNations.length === 0 || isCreating}
				>
					{#if isCreating}
						Starting...
					{:else}
						Start Game
					{/if}
				</Button>
			</DialogFooter>
		</DialogContent>
	</Dialog>
</div>
