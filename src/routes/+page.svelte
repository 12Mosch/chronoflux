<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { useConvexClient } from 'convex-svelte';
	import { api } from '../convex/_generated/api';
	import { onMount } from 'svelte';
	import { getOrCreateUserId } from '$lib/utils';
	import GameCard from '$lib/components/game/GameCard.svelte';
	import type { Doc, Id } from '../convex/_generated/dataModel';
	import * as m from '$lib/paraglide/messages';

	const client = useConvexClient();
	let games = $state<Doc<'games'>[]>([]);
	let scenarios = $state<Record<string, Doc<'scenarios'>>>({});
	let nations = $state<Record<string, Doc<'nations'>>>({});
	let loading = $state(true);
	let error = $state<string | null>(null);

	onMount(async () => {
		try {
			const userId = getOrCreateUserId();
			if (userId) {
				// Fetch games
				const userGames = await client.query(api.games.listGamesForUser, { playerId: userId });
				games = userGames;

				// Fetch related data for each game
				const scenarioIds: Record<string, boolean> = {};
				const nationIds: Record<string, boolean> = {};

				for (const game of userGames) {
					if (!scenarios[game.scenarioId]) {
						scenarioIds[game.scenarioId] = true;
					}
					if (game.playerNationId && !nations[game.playerNationId]) {
						nationIds[game.playerNationId] = true;
					}
				}

				const [fetchedScenarios, fetchedNations] = await Promise.all([
					Promise.all(
						Object.keys(scenarioIds).map(async (id) => {
							try {
								const scenario = await client.query(api.scenarios.getScenario, {
									id: id as Id<'scenarios'>
								});
								return { id, scenario };
							} catch (e) {
								console.error(`Failed to fetch scenario ${id}`, e);
								return { id, scenario: null };
							}
						})
					),
					Promise.all(
						Object.keys(nationIds).map(async (id) => {
							try {
								const nation = await client.query(api.nations.getNation, {
									nationId: id as Id<'nations'>
								});
								return { id, nation };
							} catch (e) {
								console.error(`Failed to fetch nation ${id}`, e);
								return { id, nation: null };
							}
						})
					)
				]);

				for (const { id, scenario } of fetchedScenarios) {
					if (scenario) scenarios[id] = scenario;
				}

				for (const { id, nation } of fetchedNations) {
					if (nation) nations[id] = nation;
				}
			}
		} catch (e) {
			console.error('Failed to load user games', e);
			error = m.error_loading_games();
		} finally {
			loading = false;
		}
	});
</script>

<svelte:head>
	<title>ChronoFlux</title>
</svelte:head>

<div class="min-h-screen bg-slate-950 text-white">
	<!-- Hero Section -->
	<div class="container mx-auto px-4 py-20 text-center">
		<h1 class="mb-6 text-5xl font-bold tracking-tight md:text-6xl">{m.hero_title()}</h1>
		<p class="mx-auto mb-8 max-w-2xl text-lg text-slate-300 md:text-xl">
			{m.hero_description()}
		</p>
		<p class="mx-auto mb-12 max-w-2xl text-sm text-slate-400">
			{m.hero_subtitle()}
		</p>

		<!-- CTA Button -->
		<div class="flex justify-center gap-4">
			{#if !loading && games.length > 0}
				<Button
					href="/game/{games[0]._id}"
					size="lg"
					class="bg-green-600 px-8 font-medium hover:bg-green-700"
				>
					{m.continue_playing()}
				</Button>
			{/if}
			<Button href="/scenarios" size="lg" class="bg-blue-600 px-8 font-medium hover:bg-blue-700">
				{m.start_new_game()}
			</Button>
		</div>

		{#if error}
			<div class="mt-8 rounded bg-red-900/50 p-4 text-red-200">
				{error}
			</div>
		{/if}
	</div>

	<!-- Continue Game Section -->
	{#if !loading && games.length > 0}
		<div class="container mx-auto px-4 py-8">
			<div class="mb-6 flex items-center justify-between">
				<h2 class="text-2xl font-bold">{m.continue_playing()}</h2>
			</div>

			<div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
				{#each games as game (game._id)}
					<GameCard
						{game}
						scenarioName={scenarios[game.scenarioId]?.name || m.unknown_scenario()}
						nationName={nations[game.playerNationId || '']?.name}
					/>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Features Section -->
	<div class="container mx-auto px-4 py-16">
		<div class="grid gap-8 md:grid-cols-3">
			<div class="rounded-lg border border-slate-700 bg-slate-800/50 p-6">
				<h3 class="mb-3 text-lg font-bold text-white">{m.feature_natural_language_title()}</h3>
				<p class="text-sm text-slate-400">
					{m.feature_natural_language_desc()}
				</p>
			</div>
			<div class="rounded-lg border border-slate-700 bg-slate-800/50 p-6">
				<h3 class="mb-3 text-lg font-bold text-white">{m.feature_historical_scenarios_title()}</h3>
				<p class="text-sm text-slate-400">
					{m.feature_historical_scenarios_desc()}
				</p>
			</div>
			<div class="rounded-lg border border-slate-700 bg-slate-800/50 p-6">
				<h3 class="mb-3 text-lg font-bold text-white">{m.feature_persistent_world_title()}</h3>
				<p class="text-sm text-slate-400">
					{m.feature_persistent_world_desc()}
				</p>
			</div>
		</div>
	</div>
</div>
