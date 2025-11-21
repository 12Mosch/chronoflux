<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { useConvexClient } from 'convex-svelte';
	import { api } from '../convex/_generated/api';
	import { onMount } from 'svelte';
	import { getOrCreateUserId } from '$lib/utils';
	import GameCard from '$lib/components/game/GameCard.svelte';
	import type { Doc } from '../convex/_generated/dataModel';

	const client = useConvexClient();
	let games = $state<Doc<'games'>[]>([]);
	let scenarios = $state<Record<string, Doc<'scenarios'>>>({});
	let nations = $state<Record<string, Doc<'nations'>>>({});
	let loading = $state(true);

	onMount(async () => {
		const userId = getOrCreateUserId();
		if (userId) {
			// Fetch games
			const userGames = await client.query(api.games.listGamesForUser, { playerId: userId });
			games = userGames;

			// Fetch related data for each game
			for (const game of userGames) {
				// Fetch scenario if not already cached
				if (!scenarios[game.scenarioId]) {
					const scenario = await client.query(api.scenarios.getScenario, { id: game.scenarioId });
					if (scenario) {
						scenarios[game.scenarioId] = scenario;
					}
				}

				// Fetch player nation if applicable
				if (game.playerNationId && !nations[game.playerNationId]) {
					const nation = await client.query(api.nations.getNation, { id: game.playerNationId });
					if (nation) {
						nations[game.playerNationId] = nation;
					}
				}
			}
		}
		loading = false;
	});
</script>

<div class="min-h-screen bg-linear-to-b from-slate-900 to-slate-800 text-white">
	<!-- Hero Section -->
	<div class="container mx-auto px-4 py-20 text-center">
		<h1 class="mb-6 text-5xl font-bold md:text-6xl">ChronoFlux</h1>
		<p class="mx-auto mb-8 max-w-2xl text-xl text-slate-300 md:text-2xl">
			Shape history through natural language. Control nations, make decisions, and watch the AI
			simulate the consequences of your choices.
		</p>
		<p class="mx-auto mb-12 max-w-2xl text-lg text-slate-400">
			An AI-powered alternate history simulation game where every action matters.
		</p>

		<!-- CTA Button -->
		<div class="flex justify-center gap-4">
			<Button href="/scenarios" size="lg" class="bg-blue-600 hover:bg-blue-700">
				Start New Game
			</Button>
		</div>
	</div>

	<!-- Continue Game Section -->
	{#if !loading && games.length > 0}
		<div class="container mx-auto px-4 py-8">
			<div class="mb-6 flex items-center justify-between">
				<h2 class="text-2xl font-bold">Continue Playing</h2>
			</div>

			<div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
				{#each games as game (game._id)}
					<GameCard
						{game}
						scenarioName={scenarios[game.scenarioId]?.name || 'Unknown Scenario'}
						nationName={nations[game.playerNationId || '']?.name}
					/>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Features Section -->
	<div class="container mx-auto px-4 py-16">
		<div class="grid gap-8 md:grid-cols-3">
			<div class="rounded-lg bg-slate-700 p-6">
				<h3 class="mb-3 text-xl font-bold">Natural Language Actions</h3>
				<p class="text-slate-300">
					Describe your actions in free-form text. The AI understands context and generates
					plausible consequences.
				</p>
			</div>
			<div class="rounded-lg bg-slate-700 p-6">
				<h3 class="mb-3 text-xl font-bold">Historical Scenarios</h3>
				<p class="text-slate-300">
					Choose from pre-configured historical periods like WWI, Cold War, and Ancient Rome.
				</p>
			</div>
			<div class="rounded-lg bg-slate-700 p-6">
				<h3 class="mb-3 text-xl font-bold">Persistent World State</h3>
				<p class="text-slate-300">
					Every decision shapes the world. Watch relationships evolve and resources change based on
					your choices.
				</p>
			</div>
		</div>
	</div>
</div>
