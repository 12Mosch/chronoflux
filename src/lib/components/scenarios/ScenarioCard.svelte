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
	import { Trash2 } from '@lucide/svelte';

	type ScenarioDoc = Doc<'scenarios'>;

	let {
		scenario,
		onPlay,
		onDelete,
		disabled = false,
		isCreating = false
	}: {
		scenario: ScenarioDoc;
		onPlay?: (scenario: ScenarioDoc) => void;
		onDelete?: (scenario: ScenarioDoc) => void;
		disabled?: boolean;
		isCreating?: boolean;
	} = $props();

	const nationCount = $derived(scenario.initialWorldState.nations.length);
</script>

<Card
	class="flex h-full flex-col justify-between border-slate-700 bg-slate-800/50 transition-all hover:border-slate-500 hover:bg-slate-800"
>
	<CardHeader class="space-y-1">
		<div class="flex items-start justify-between gap-2">
			<div class="flex-1">
				<CardTitle class="text-xl text-white">{scenario.name}</CardTitle>
				<CardDescription class="text-slate-400">
					{scenario.historicalPeriod} • {scenario.startYear}
				</CardDescription>
			</div>
			{#if scenario.isUserCreated && onDelete}
				<button
					type="button"
					onclick={(e) => {
						e.preventDefault();
						e.stopPropagation();
						onDelete?.(scenario);
					}}
					class="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 opacity-20 transition-all hover:bg-red-900/20 hover:text-red-400 hover:opacity-100"
					title="Delete scenario"
				>
					<Trash2 class="h-4 w-4" />
				</button>
			{/if}
		</div>
	</CardHeader>
	<CardContent class="space-y-4">
		<p class="line-clamp-3 text-sm text-slate-300">
			{scenario.description}
		</p>
		<div class="flex items-center gap-2 text-sm text-slate-400">
			<span>Nations: {nationCount}</span>
		</div>
	</CardContent>
	<CardFooter class="mt-auto pt-4">
		<Button
			class="w-full bg-blue-600 font-semibold text-white hover:bg-blue-700"
			size="lg"
			onclick={() => onPlay?.(scenario)}
			disabled={disabled || isCreating}
		>
			{#if isCreating}
				Starting...
			{:else}
				PLAY
			{/if}
		</Button>
	</CardFooter>
</Card>
