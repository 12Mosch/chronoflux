<script lang="ts">
	import * as m from '$lib/paraglide/messages';
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
			alert(m.scenario_saved());
			await goto(resolve('/scenarios'));
		} catch (e: unknown) {
			const errorMessage = e instanceof Error ? e.message : String(e);
			alert(m.error_saving_scenario({ error: errorMessage }));
		}
	}
</script>

<Card class="mx-auto mt-8 w-full max-w-2xl">
	<CardHeader>
		<CardTitle>{scenario ? m.edit_scenario_title() : m.create_scenario_title()}</CardTitle>
	</CardHeader>
	<CardContent class="space-y-4">
		<div class="space-y-2">
			<label for="name" class="text-sm font-medium">{m.name_label()}</label>
			<Input id="name" bind:value={name} placeholder={m.scenario_name_placeholder()} />
		</div>

		<div class="space-y-2">
			<label for="description" class="text-sm font-medium">{m.description_label()}</label>
			<Textarea
				id="description"
				bind:value={description}
				placeholder={m.scenario_desc_placeholder()}
			/>
		</div>

		<div class="grid grid-cols-2 gap-4">
			<div class="space-y-2">
				<label for="period" class="text-sm font-medium">{m.period_label()}</label>
				<Input id="period" bind:value={historicalPeriod} placeholder={m.period_placeholder()} />
			</div>
			<div class="space-y-2">
				<label for="year" class="text-sm font-medium">{m.start_year_label()}</label>
				<Input id="year" type="number" bind:value={startYear} />
			</div>
		</div>

		<div class="space-y-2">
			<label for="aiContext" class="text-sm font-medium">{m.ai_context_label()}</label>
			<Textarea
				id="aiContext"
				bind:value={aiContext}
				placeholder={m.ai_context_placeholder()}
				class="h-24"
			/>
		</div>

		<div class="space-y-2">
			<label for="worldState" class="text-sm font-medium">{m.initial_world_state_label()}</label>
			<Textarea id="worldState" bind:value={initialWorldStateJSON} class="h-64 font-mono text-xs" />
			<p class="text-xs text-muted-foreground">
				{m.json_edit_hint()}
			</p>
		</div>

		<Button onclick={saveScenario} class="w-full">{m.save_scenario_button()}</Button>
	</CardContent>
</Card>
