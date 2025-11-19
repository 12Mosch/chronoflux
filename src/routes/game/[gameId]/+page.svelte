<script lang="ts">
	import NationPanel from '$lib/components/game/NationPanel.svelte';
	import WorldMap from '$lib/components/game/WorldMap.svelte';
	import EventLog from '$lib/components/game/EventLog.svelte';
	import ActionInput from '$lib/components/game/ActionInput.svelte';
	import TurnSummary from '$lib/components/game/TurnSummary.svelte';

	let showTurnSummary = false;
</script>

<div class="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
	<!-- Left Column: Nation Panel & Event Log -->
	<div class="lg:col-span-1 flex flex-col gap-4">
		<div class="flex-none">
			<NationPanel />
		</div>
		<div class="grow min-h-[300px]">
			<EventLog />
		</div>
	</div>

	<!-- Right Column: World Map & Action Input -->
	<div class="lg:col-span-2 flex flex-col gap-4">
		<div class="grow">
			<WorldMap />
		</div>
		<div class="flex-none">
			<ActionInput />
		</div>
	</div>
</div>

<TurnSummary bind:open={showTurnSummary} />
