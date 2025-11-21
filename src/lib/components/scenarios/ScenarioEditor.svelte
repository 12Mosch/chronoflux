<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { useConvexClient } from 'convex-svelte';
	import { api } from '../../../convex/_generated/api';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import type { Doc } from '../../../convex/_generated/dataModel';

	export let scenario: Doc<'scenarios'> | null = null;

	let name = scenario?.name || '';
	let description = scenario?.description || '';
	let historicalPeriod = scenario?.historicalPeriod || '';
	let startYear = scenario?.startYear || 1900;
	let aiContext = scenario?.aiContext || '';
	let initialWorldStateJSON = scenario
		? JSON.stringify(scenario.initialWorldState, null, 2)
		: JSON.stringify(
				{
					nations: [],
					relationships: [],
					globalEvents: []
				},
				null,
				2
			);

	const client = useConvexClient();

	async function saveScenario() {
		try {
			const initialWorldState = JSON.parse(initialWorldStateJSON);
			await client.mutation(api.scenarios.createOrUpdateScenario, {
				name,
				description,
				period: historicalPeriod,
				startYear,
				aiContext,
				initialWorldState
			});
			alert('Scenario saved!');
			await goto(resolve('/scenarios'));
		} catch (e: unknown) {
			const errorMessage = e instanceof Error ? e.message : String(e);
			alert('Error saving scenario: ' + errorMessage);
		}
	}
</script>

<Card class="mx-auto mt-8 w-full max-w-2xl">
	<CardHeader>
		<CardTitle>{scenario ? 'Edit Scenario' : 'Create New Scenario'}</CardTitle>
	</CardHeader>
	<CardContent class="space-y-4">
		<div class="space-y-2">
			<label for="name" class="text-sm font-medium">Name</label>
			<Input id="name" bind:value={name} placeholder="Scenario Name" />
		</div>

		<div class="space-y-2">
			<label for="description" class="text-sm font-medium">Description</label>
			<Textarea
				id="description"
				bind:value={description}
				placeholder="Brief description of the scenario"
			/>
		</div>

		<div class="grid grid-cols-2 gap-4">
			<div class="space-y-2">
				<label for="period" class="text-sm font-medium">Historical Period</label>
				<Input id="period" bind:value={historicalPeriod} placeholder="e.g. Cold War" />
			</div>
			<div class="space-y-2">
				<label for="year" class="text-sm font-medium">Start Year</label>
				<Input id="year" type="number" bind:value={startYear} />
			</div>
		</div>

		<div class="space-y-2">
			<label for="aiContext" class="text-sm font-medium">AI Context</label>
			<Textarea
				id="aiContext"
				bind:value={aiContext}
				placeholder="Historical context for the AI..."
				class="h-24"
			/>
		</div>

		<div class="space-y-2">
			<label for="worldState" class="text-sm font-medium">Initial World State (JSON)</label>
			<Textarea id="worldState" bind:value={initialWorldStateJSON} class="h-64 font-mono text-xs" />
			<p class="text-xs text-muted-foreground">
				Edit the JSON directly to configure nations and relationships.
			</p>
		</div>

		<Button onclick={saveScenario} class="w-full">Save Scenario</Button>
	</CardContent>
</Card>
