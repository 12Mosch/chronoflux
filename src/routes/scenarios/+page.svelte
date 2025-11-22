<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { useConvexClient, useQuery } from 'convex-svelte';
	import { api } from '../../convex/_generated/api.js';
	import type { Doc } from '../../convex/_generated/dataModel';
	import { Search, Plus } from '@lucide/svelte';

	import ScenarioCard from '$lib/components/scenarios/ScenarioCard.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Select, SelectContent, SelectItem, SelectTrigger } from '$lib/components/ui/select';
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
	let deleteError = $state<string | null>(null);
	let scenarioToDelete = $state<ScenarioDoc | null>(null);
	let isDeleteDialogOpen = $state(false);

	let searchQuery = $state('');
	let selectedEra = $state('All Eras');

	const availableNations = $derived<NationConfig[]>(
		selectedScenario?.initialWorldState.nations ?? []
	);

	const filteredScenarios = $derived(
		scenarios.data?.filter((scenario) => {
			const matchesSearch =
				scenario.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				scenario.description.toLowerCase().includes(searchQuery.toLowerCase());
			const matchesEra = selectedEra === 'All Eras' || scenario.historicalPeriod === selectedEra;
			return matchesSearch && matchesEra;
		}) ?? []
	);

	const uniqueEras = $derived([
		'All Eras',
		...Array.from(new Set(scenarios.data?.map((s) => s.historicalPeriod) ?? []))
	]);

	function handlePlay(scenario: ScenarioDoc) {
		selectedScenario = scenario;
		selectedNationId = null;
		createError = null;
		isNationDialogOpen = true;
	}

	function handleDelete(scenario: ScenarioDoc) {
		scenarioToDelete = scenario;
		deleteError = null;
		isDeleteDialogOpen = true;
	}

	async function confirmDelete() {
		if (!scenarioToDelete) return;

		try {
			deleteError = null;
			await client.mutation(api.scenarios.deleteScenario, {
				id: scenarioToDelete._id
			});
			// The query will automatically refetch and update the UI
			isDeleteDialogOpen = false;
			scenarioToDelete = null;
		} catch (err) {
			console.error(err);
			deleteError = err instanceof Error ? err.message : 'Failed to delete scenario';
			// Show error for 5 seconds
			setTimeout(() => {
				deleteError = null;
			}, 5000);
		}
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

			await goto(resolve(`/game/${gameId}`));
		} catch (err) {
			console.error(err);
			createError = err instanceof Error ? err.message : 'Failed to create game';
		} finally {
			isCreating = false;
		}
	}
</script>

<div class="min-h-screen bg-slate-950 text-white">
	<div class="container mx-auto px-4 py-10">
		<div class="mb-12 text-center">
			<h1 class="mb-8 text-5xl font-bold tracking-tight md:text-6xl">Choose Your History</h1>

			<div class="relative mx-auto mb-8 max-w-2xl">
				<Search class="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-slate-400" />
				<Input
					type="search"
					placeholder="Search Scenarios..."
					class="h-12 rounded-full border-slate-700 bg-slate-900/50 pl-10 text-lg text-white placeholder:text-slate-500 focus-visible:ring-slate-600"
					bind:value={searchQuery}
				/>
			</div>

			<div class="flex flex-wrap items-center justify-center gap-4">
				<div class="flex items-center gap-2">
					<span class="text-slate-400">Era</span>
					<Select type="single" bind:value={selectedEra}>
						<SelectTrigger class="w-[180px] border-slate-700 bg-slate-900/50 text-white">
							{selectedEra || 'Select Era'}
						</SelectTrigger>
						<SelectContent class="border-slate-700 bg-slate-900 text-white">
							{#each uniqueEras as era (era)}
								<SelectItem value={era} label={era}>{era}</SelectItem>
							{/each}
						</SelectContent>
					</Select>
				</div>

				<div class="flex flex-wrap gap-2">
					{#each uniqueEras.filter((e) => e !== 'All Eras').slice(0, 3) as era (era)}
						<button
							class="rounded-full border border-slate-700 bg-slate-900/50 px-4 py-1.5 text-sm text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
							class:bg-slate-700={selectedEra === era}
							class:text-white={selectedEra === era}
							aria-pressed={selectedEra === era}
							onclick={() => (selectedEra = era)}
						>
							{era}
						</button>
					{/each}
				</div>
			</div>
		</div>

		{#if deleteError}
			<div
				class="mb-6 rounded-lg border border-red-900/50 bg-red-950/30 p-4 text-center text-red-400"
			>
				{deleteError}
			</div>
		{/if}

		{#if scenarios.isLoading}
			<div class="flex justify-center py-20">
				<div
					class="h-8 w-8 animate-spin rounded-full border-4 border-slate-700 border-t-blue-500"
				></div>
			</div>
		{:else if scenarios.error}
			<div class="rounded-lg border border-red-900/50 bg-red-950/30 p-6 text-center text-red-400">
				<p>Failed to load scenarios: {scenarios.error.toString()}</p>
			</div>
		{:else if !scenarios.data || scenarios.data.length === 0}
			<div
				class="rounded-lg border border-slate-800 bg-slate-900/50 p-12 text-center text-slate-400"
			>
				<p class="text-xl">No scenarios found.</p>
				<p class="mt-2">Seed the database to get started.</p>
			</div>
		{:else if filteredScenarios.length === 0}
			<div class="py-20 text-center text-slate-400">
				<p class="text-xl">No scenarios match your search.</p>
				<Button
					variant="link"
					onclick={() => {
						searchQuery = '';
						selectedEra = 'All Eras';
					}}
				>
					Clear filters
				</Button>
			</div>
		{:else}
			<div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
				<!-- Create New Scenario Card -->
				<a
					href={resolve('/scenarios/editor')}
					class="group flex h-full min-h-[300px] flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-600 bg-slate-900/30 p-6 transition-all hover:border-slate-500 hover:bg-slate-800/50"
				>
					<div class="flex flex-col items-center gap-4 text-center">
						<div
							class="flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-slate-600 bg-slate-800/50 transition-all group-hover:border-blue-500 group-hover:bg-blue-900/20"
						>
							<Plus class="h-8 w-8 text-slate-400 transition-colors group-hover:text-blue-400" />
						</div>
						<div>
							<h3 class="text-xl font-bold text-white">Create New Scenario</h3>
							<p class="mt-2 text-sm text-slate-400">Design your own historical scenario</p>
						</div>
					</div>
				</a>

				<!-- Existing Scenarios -->
				{#each filteredScenarios as scenario (scenario._id)}
					<ScenarioCard
						{scenario}
						onPlay={handlePlay}
						onDelete={handleDelete}
						isCreating={isCreating && selectedScenario?._id === scenario._id}
					/>
				{/each}
			</div>
		{/if}
	</div>

	<Dialog bind:open={isNationDialogOpen}>
		<DialogContent class="max-w-lg border-slate-700 bg-slate-900 text-white">
			<DialogHeader>
				<DialogTitle class="text-xl">Select Nation</DialogTitle>
				{#if selectedScenario}
					<DialogDescription class="text-slate-400">
						Choose a nation to play in "{selectedScenario.name}".
					</DialogDescription>
				{/if}
			</DialogHeader>

			{#if !selectedScenario}
				<p class="text-sm text-slate-400">No scenario selected.</p>
			{:else if availableNations.length === 0}
				<p class="text-sm text-slate-400">This scenario has no nations configured yet.</p>
			{:else}
				<div class="mt-4 max-h-[60vh] space-y-2 overflow-y-auto pr-2">
					{#each availableNations as nation (nation.id)}
						<button
							type="button"
							class="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-3 text-left transition-all hover:border-slate-500 hover:bg-slate-800 data-[active=true]:border-blue-500 data-[active=true]:bg-blue-900/20"
							data-active={selectedNationId === nation.id}
							onclick={() => (selectedNationId = nation.id)}
						>
							<div class="flex items-center justify-between">
								<span class="font-medium text-white">{nation.name}</span>
								<span
									class="rounded border border-slate-700 bg-slate-900 px-2 py-0.5 text-xs text-slate-400"
									>{nation.government}</span
								>
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
					class="text-slate-300 hover:bg-slate-800 hover:text-white"
					onclick={() => (isNationDialogOpen = false)}
					disabled={isCreating}
				>
					Cancel
				</Button>
				<Button
					class="bg-blue-600 text-white hover:bg-blue-700"
					onclick={startGame}
					disabled={!selectedScenario ||
						!selectedNationId ||
						availableNations.length === 0 ||
						isCreating}
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

	<!-- Delete Confirmation Dialog -->
	<Dialog bind:open={isDeleteDialogOpen}>
		<DialogContent class="max-w-md border-slate-700 bg-slate-900 text-white">
			<DialogHeader>
				<DialogTitle class="text-xl">Delete Scenario</DialogTitle>
				<DialogDescription class="text-slate-400">
					Are you sure you want to delete "{scenarioToDelete?.name}"? This action cannot be undone.
				</DialogDescription>
			</DialogHeader>

			{#if deleteError}
				<div class="rounded-lg border border-red-900/50 bg-red-950/30 p-3 text-sm text-red-400">
					{deleteError}
				</div>
			{/if}

			<DialogFooter class="flex justify-end gap-2">
				<Button
					variant="ghost"
					class="text-slate-300 hover:bg-slate-800 hover:text-white"
					onclick={() => {
						isDeleteDialogOpen = false;
						scenarioToDelete = null;
						deleteError = null;
					}}
				>
					Cancel
				</Button>
				<Button class="bg-red-600 text-white hover:bg-red-700" onclick={confirmDelete}>
					Delete
				</Button>
			</DialogFooter>
		</DialogContent>
	</Dialog>
</div>
