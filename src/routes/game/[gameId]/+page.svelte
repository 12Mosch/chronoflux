<script lang="ts">
	import NationPanel from '$lib/components/game/NationPanel.svelte';
	import WorldMap from '$lib/components/game/WorldMap.svelte';
	import EventLog from '$lib/components/game/EventLog.svelte';
	import ActionInput from '$lib/components/game/ActionInput.svelte';
	import TurnSummary from '$lib/components/game/TurnSummary.svelte';

	let showTurnSummary = false;
</script>

<div class="grid h-full grid-cols-1 gap-4 lg:grid-cols-3">
	<!-- Left Column: Nation Panel & Event Log -->
	<div class="flex flex-col gap-4 lg:col-span-1">
		<div class="flex-none">
			<NationPanel />
		</div>
		<div class="min-h-[300px] grow">
			<EventLog />
		</div>
	</div>

	<!-- Right Column: World Map & Action Input -->
	<div class="flex flex-col gap-4 lg:col-span-2">
		<div class="grow">
			<WorldMap />
		</div>
		<div class="flex-none">
			<ActionInput />
		</div>
	</div>
</div>

<TurnSummary bind:open={showTurnSummary} />
