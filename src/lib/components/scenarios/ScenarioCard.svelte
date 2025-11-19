<script lang="ts">
	import type { Doc } from '../../../convex/_generated/dataModel';
	import {
		Card,
		CardHeader,
		CardTitle,
		CardDescription,
		CardContent,
		CardFooter
	} from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';

	type ScenarioDoc = Doc<'scenarios'>;

	let {
		scenario,
		onPlay,
		disabled = false,
		isCreating = false
	}: {
		scenario: ScenarioDoc;
		onPlay?: (scenario: ScenarioDoc) => void;
		disabled?: boolean;
		isCreating?: boolean;
	} = $props();

	const nationCount = $derived(scenario.initialWorldState.nations.length);
</script>

<Card class="flex h-full flex-col justify-between">
	<CardHeader class="space-y-1">
		<CardTitle>{scenario.name}</CardTitle>
		<CardDescription>
			{scenario.historicalPeriod} • {scenario.startYear}
		</CardDescription>
	</CardHeader>
	<CardContent class="space-y-2">
		<p class="text-sm text-muted-foreground">
			{scenario.description}
		</p>
		<p class="text-xs text-slate-400">Nations: {nationCount}</p>
	</CardContent>
	<CardFooter class="mt-auto flex justify-end">
		<Button size="sm" onclick={() => onPlay?.(scenario)} disabled={disabled || isCreating}>
			{#if isCreating}
				Starting...
			{:else}
				Play
			{/if}
		</Button>
	</CardFooter>
</Card>
