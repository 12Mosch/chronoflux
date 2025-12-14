<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { useConvexClient } from 'convex-svelte';
	import { api } from '../convex/_generated/api';
	import { onMount } from 'svelte';
	import { getOrCreateUserId } from '$lib/utils';
	import GameCard from '$lib/components/game/GameCard.svelte';
	import type { Doc, Id } from '../convex/_generated/dataModel';
	import * as m from '$lib/paraglide/messages';
	import WorldMapBg from '$lib/assets/world-map-bg.png?enhanced';
	import { Globe, MessageCircle, ScrollText, Play, Sparkles } from '@lucide/svelte';
	import { resolve } from '$app/paths';

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

	async function handleDeleteGame(gameId: string) {
		error = null;

		try {
			await client.mutation(api.games.deleteGame, { gameId: gameId as Id<'games'> });
			// Remove the game from the local state
			games = games.filter((g) => g._id !== gameId);
		} catch (e) {
			console.error('Failed to delete game', e);
			error = m.failed_delete_game();
		}
	}
</script>

<svelte:head>
	<title>ChronoFlux</title>
</svelte:head>

<div class="relative min-h-screen overflow-hidden bg-slate-950 text-white">
	<!-- Animated World Map Background -->
	<div class="world-map-container absolute inset-0">
		<enhanced:img src={WorldMapBg} alt="" />
		<div class="world-map-overlay"></div>
	</div>

	<!-- Hero Section -->
	<div class="relative z-10 container mx-auto px-4 py-20 text-center">
		<h1 class="mb-8 text-5xl font-bold tracking-tight md:text-6xl">{m.hero_title()}</h1>
		<p class="mx-auto mb-4 max-w-2xl text-base text-slate-300 md:text-lg">
			{m.hero_description()}
		</p>
		<p class="mx-auto mb-16 max-w-xl text-sm text-slate-400 md:text-base">
			{m.hero_subtitle()}
		</p>

		<!-- CTA Buttons -->
		<div class="flex justify-center gap-4">
			{#if !loading && games.length > 0}
				<!-- Use tap preloading for game data since it may update frequently -->
				<a
					href={resolve(`/game/${games[0]._id}`)}
					data-sveltekit-preload-data="tap"
					data-sveltekit-preload-code="eager"
				>
					<Button
						size="lg"
						class="btn-glow-green h-11 bg-green-600 px-8 font-medium hover:bg-green-700 md:h-12 md:px-9"
					>
						<Play aria-hidden="true" />
						<span>{m.continue_playing()}</span>
					</Button>
				</a>
			{/if}
			<!-- Eager code preloading for primary CTA -->
			<a href={resolve('/scenarios')} data-sveltekit-preload-code="eager">
				<Button
					size="lg"
					class="btn-glow-blue h-11 bg-blue-600 px-8 font-medium hover:bg-blue-700 md:h-12 md:px-9"
				>
					<Sparkles aria-hidden="true" />
					<span>{m.start_new_game()}</span>
				</Button>
			</a>
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

			<!-- Use tap preloading for game links since game state updates frequently -->
			<div
				class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
				data-sveltekit-preload-data="tap"
				data-sveltekit-preload-code="eager"
			>
				{#each games as game (game._id)}
					<GameCard
						{game}
						scenarioName={scenarios[game.scenarioId]?.name || m.unknown_scenario()}
						nationName={nations[game.playerNationId || '']?.name}
						onDelete={() => handleDeleteGame(game._id)}
					/>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Features Section -->
	<div
		class="container mx-auto border-slate-800/60 px-4 pt-20 pb-20"
		class:mt-16={!loading && games.length > 0}
		class:border-t={!loading && games.length > 0}
	>
		<div class="mb-10 text-center">
			<h2 class="text-sm font-semibold tracking-[0.25em] text-slate-400 uppercase">
				{m.features_section_title()}
			</h2>
		</div>
		<div class="grid gap-8 md:grid-cols-3">
			<div
				class="group relative overflow-hidden rounded-xl border border-slate-700/80 bg-slate-900/40 p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-blue-500/70 hover:bg-slate-900/70 hover:shadow-xl hover:shadow-blue-500/30"
			>
				<div
					class="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-950/80 text-blue-400 shadow-inner shadow-blue-500/30"
				>
					<MessageCircle class="h-7 w-7" />
				</div>
				<h3 class="mb-3 text-xl font-semibold tracking-tight text-white md:text-2xl">
					{m.feature_natural_language_title()}
				</h3>
				<p class="text-sm text-slate-400">
					{m.feature_natural_language_desc()}
				</p>
			</div>
			<div
				class="group relative overflow-hidden rounded-xl border border-slate-700/80 bg-slate-900/40 p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-emerald-500/70 hover:bg-slate-900/70 hover:shadow-xl hover:shadow-emerald-500/30"
			>
				<div
					class="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-950/80 text-emerald-400 shadow-inner shadow-emerald-500/30"
				>
					<ScrollText class="h-7 w-7" />
				</div>
				<h3 class="mb-3 text-xl font-semibold tracking-tight text-white md:text-2xl">
					{m.feature_historical_scenarios_title()}
				</h3>
				<p class="text-sm text-slate-400">
					{m.feature_historical_scenarios_desc()}
				</p>
			</div>
			<div
				class="group relative overflow-hidden rounded-xl border border-slate-700/80 bg-slate-900/40 p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-amber-500/70 hover:bg-slate-900/70 hover:shadow-xl hover:shadow-amber-500/30"
			>
				<div
					class="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-950/80 text-amber-300 shadow-inner shadow-amber-500/30"
				>
					<Globe class="h-7 w-7" />
				</div>
				<h3 class="mb-3 text-xl font-semibold tracking-tight text-white md:text-2xl">
					{m.feature_persistent_world_title()}
				</h3>
				<p class="text-sm text-slate-400">
					{m.feature_persistent_world_desc()}
				</p>
			</div>
		</div>
	</div>
</div>

<style>
	.world-map-container {
		position: absolute;
		inset: 0;
		z-index: 0;
		width: 100%;
		height: 100%;
		overflow: hidden;
	}

	.world-map-container :global(img) {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		object-position: center;
		opacity: 0.15;
		filter: blur(3px);
		animation:
			mapPan 60s ease-in-out infinite,
			mapPulse 8s ease-in-out infinite;
	}

	.world-map-overlay {
		position: absolute;
		inset: 0;
		background: radial-gradient(
			ellipse at center,
			transparent 0%,
			rgba(2, 6, 23, 0.4) 50%,
			rgba(2, 6, 23, 0.8) 100%
		);
		pointer-events: none;
	}

	@keyframes mapPan {
		0%,
		100% {
			transform: scale(1.1) translateX(0);
		}
		50% {
			transform: scale(1.15) translateX(-2%);
		}
	}

	@keyframes mapPulse {
		0%,
		100% {
			opacity: 0.15;
		}
		50% {
			opacity: 0.22;
		}
	}

	:global(.btn-glow-green) {
		box-shadow: 0 0 20px rgba(34, 197, 94, 0.6);
		transition: all 0.3s ease;
	}
	:global(.btn-glow-green:hover) {
		box-shadow: 0 0 30px rgba(34, 197, 94, 0.8);
	}

	:global(.btn-glow-blue) {
		box-shadow: 0 0 20px rgba(59, 130, 246, 0.6);
		transition: all 0.3s ease;
	}
	:global(.btn-glow-blue:hover) {
		box-shadow: 0 0 30px rgba(59, 130, 246, 0.8);
	}
</style>
