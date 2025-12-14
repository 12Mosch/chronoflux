<script lang="ts">
	import ActionInput from '$lib/components/game/ActionInput.svelte';
	import TurnSummary from '$lib/components/game/TurnSummary.svelte';
	import NationPanel from '$lib/components/game/NationPanel.svelte';
	import EventLog from '$lib/components/game/EventLog.svelte';
	import Advisor from '$lib/components/game/Advisor.svelte';
	import Map from '$lib/components/game/Map.svelte';
	import MapLegend from '$lib/components/game/MapLegend.svelte';
	import { useQuery } from 'convex-svelte';
	import { api } from '$convex/_generated/api';
	import type { Id } from '$convex/_generated/dataModel';
	import { page } from '$app/state';
	import { gameState } from '$lib/stores/gameState';
	import * as m from '$lib/paraglide/messages';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import * as Sheet from '$lib/components/ui/sheet';
	import {
		Search,
		Globe,
		Layers,
		Flag,
		History,
		Bell,
		Bot,
		Plus,
		Minus,
		Compass
	} from '@lucide/svelte';

	const gameId = $derived(page.params.gameId as Id<'games'>);
	const worldState = $derived(useQuery(api.world.getWorldState, gameId ? { gameId } : 'skip'));

	type TurnData = {
		turnNumber: number;
		playerAction: string;
		narrative?: string;
		consequences?: string;
		events?: Array<{
			type: string;
			title: string;
			description: string;
		}>;
		resourceChanges?: Record<string, number>;
	} | null;

	type MapComponent = {
		zoomIn: () => void;
		zoomOut: () => void;
		resetNorth: () => void;
		flyToTerritory: (name: string) => boolean;
	};

	let showTurnSummary = $state(false);
	let showNationPanel = $state(false);
	let showEventLog = $state(false);
	let showAdvisor = $state(false);
	let lastTurnData = $state<TurnData>(null);
	let mapComponent = $state<MapComponent | null>(null);

	// Map layer visibility
	let showTerritories = $state(true);
	let showTradeRoutes = $state(true);
	let showAlliances = $state(true);
	let showWarZones = $state(true);

	// Update game state store when world state loads
	$effect(() => {
		if (worldState.data) {
			const { game, scenario, playerNation } = worldState.data;
			gameState.set({
				nationName: playerNation?.name || 'Unknown',
				nationFlag: '', // Can be added later
				turn: game.currentTurn,
				year: scenario.startYear + game.currentTurn - 1,
				military: playerNation?.resources.military || 0,
				economy: playerNation?.resources.economy || 0,
				stability: playerNation?.resources.stability || 0,
				influence: playerNation?.resources.influence || 0
			});
		}
	});

	function handleTurnSubmitted(event: { turnData: TurnData }) {
		lastTurnData = event.turnData;
		showTurnSummary = true;
	}
</script>

<svelte:head>
	<title>ChronoFlux - {worldState.data?.scenario?.name || m.game_default_title()}</title>
</svelte:head>

{#if worldState.isLoading}
	<div class="flex h-full items-center justify-center">
		<p class="text-muted-foreground">{m.loading_game_state()}</p>
	</div>
{:else if worldState.error}
	<div class="flex h-full items-center justify-center">
		<p class="text-destructive">{m.error_loading_game({ error: worldState.error.toString() })}</p>
	</div>
{:else if worldState.data === null}
	<div class="flex h-full items-center justify-center">
		<p class="text-muted-foreground">{m.game_not_found()}</p>
	</div>
{:else if worldState.data}
	<div class="relative h-full w-full bg-slate-900">
		<!-- Full Screen Map -->
		<div class="absolute inset-0 z-0">
			<Map
				bind:this={mapComponent}
				nations={worldState.data.nations}
				relationships={worldState.data.relationships}
				playerNationId={worldState.data.playerNation?._id}
				{showTerritories}
				{showTradeRoutes}
				{showAlliances}
				{showWarZones}
				year={worldState.data.scenario.startYear + worldState.data.game.currentTurn - 1}
			/>
		</div>

		<!-- Top Left: Search -->
		<div class="absolute top-4 left-4 z-10 w-64">
			<div class="relative">
				<Search class="absolute top-2.5 left-2 h-4 w-4 text-muted-foreground" />
				<Input
					placeholder={m.search_nation()}
					class="border-none bg-background/80 pl-8 text-foreground backdrop-blur-sm placeholder:text-muted-foreground"
				/>
			</div>
		</div>

		<!-- Left Sidebar Controls -->
		<div
			class="absolute top-1/2 left-4 z-10 flex -translate-y-1/2 flex-col gap-2 rounded-lg bg-background/80 p-2 backdrop-blur-sm"
		>
			<Button variant="ghost" size="icon" class="hover:bg-accent">
				<Globe class="h-5 w-5" />
			</Button>
			<Button variant="ghost" size="icon" class="hover:bg-accent">
				<Layers class="h-5 w-5" />
			</Button>
			<Button
				variant="ghost"
				size="icon"
				class="hover:bg-accent {showNationPanel ? 'bg-accent text-accent-foreground' : ''}"
				onclick={() => (showNationPanel = true)}
			>
				<Flag class="h-5 w-5" />
			</Button>
		</div>

		<!-- Right Sidebar Controls -->
		<div
			class="absolute top-1/2 right-4 z-10 flex -translate-y-1/2 flex-col gap-2 rounded-lg bg-background/80 p-2 backdrop-blur-sm"
		>
			<Button
				variant="ghost"
				size="icon"
				class="hover:bg-accent {showEventLog ? 'bg-accent text-accent-foreground' : ''}"
				onclick={() => (showEventLog = true)}
			>
				<History class="h-5 w-5" />
			</Button>
			<Button variant="ghost" size="icon" class="hover:bg-accent">
				<Bell class="h-5 w-5" />
			</Button>
			<Button
				variant="ghost"
				size="icon"
				class="hover:bg-accent {showAdvisor ? 'bg-accent text-accent-foreground' : ''}"
				onclick={() => (showAdvisor = true)}
				title={m.advisor_title()}
			>
				<Bot class="h-5 w-5" />
			</Button>
		</div>

		<!-- Bottom Right: Zoom Controls -->
		<div
			class="absolute right-4 bottom-4 z-10 flex flex-col gap-1 rounded-lg bg-background/80 p-1 backdrop-blur-sm"
		>
			<Button
				variant="ghost"
				size="icon"
				class="h-8 w-8 hover:bg-accent"
				onclick={() => mapComponent?.zoomIn()}
			>
				<Plus class="h-4 w-4" />
			</Button>
			<Button
				variant="ghost"
				size="icon"
				class="h-8 w-8 hover:bg-accent"
				onclick={() => mapComponent?.zoomOut()}
			>
				<Minus class="h-4 w-4" />
			</Button>
			<Button
				variant="ghost"
				size="icon"
				class="h-8 w-8 hover:bg-accent"
				onclick={() => mapComponent?.resetNorth()}
			>
				<Compass class="h-4 w-4" />
			</Button>
		</div>

		<!-- Bottom Left: Map Legend -->
		<div class="absolute bottom-4 left-4 z-10">
			<MapLegend bind:showTerritories bind:showTradeRoutes bind:showAlliances bind:showWarZones />
		</div>

		<!-- Action Input -->
		<div class="absolute bottom-8 left-1/2 z-10 w-full max-w-2xl -translate-x-1/2 px-4">
			<ActionInput onturnsubmitted={handleTurnSubmitted} />
		</div>
	</div>

	<!-- Nation Panel Sheet -->
	<Sheet.Root bind:open={showNationPanel}>
		<Sheet.Content
			side="left"
			class="w-[400px] border-none bg-transparent p-4 shadow-none sm:w-[540px]"
		>
			<NationPanel
				playerNation={worldState.data.playerNation}
				allNations={worldState.data.nations}
			/>
		</Sheet.Content>
	</Sheet.Root>

	<!-- Event Log Sheet -->
	<Sheet.Root bind:open={showEventLog}>
		<Sheet.Content
			side="right"
			class="w-[400px] border-none bg-transparent p-4 shadow-none sm:w-[540px]"
		>
			<EventLog />
		</Sheet.Content>
	</Sheet.Root>

	<Advisor bind:open={showAdvisor} />

	<TurnSummary bind:open={showTurnSummary} turnData={lastTurnData} />
{/if}
