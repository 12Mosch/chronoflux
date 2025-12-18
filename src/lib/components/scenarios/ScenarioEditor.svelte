<script lang="ts">
	import * as m from '$lib/paraglide/messages';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Label } from '$lib/components/ui/label';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { useConvexClient } from 'convex-svelte';
	import { api } from '../../../convex/_generated/api';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import type { Doc } from '../../../convex/_generated/dataModel';
	import * as Tabs from '$lib/components/ui/tabs';
	import NationEditor from './NationEditor.svelte';
	import RelationshipEditor from './RelationshipEditor.svelte';
	import { Plus } from '@lucide/svelte';

	let { scenario = null } = $props<{ scenario?: Doc<'scenarios'> | null }>();

	let name = $state('');
	let description = $state('');
	let historicalPeriod = $state('');
	let startYear = $state(1900);
	let aiContext = $state('');

	let initialWorldState = $state({
		nations: [] as {
			id: string;
			name: string;
			government: string;
			resources: {
				military: number;
				economy: number;
				stability: number;
				influence: number;
			};
			territories: string[];
		}[],
		relationships: [] as {
			nation1Id: string;
			nation2Id: string;
			status: 'allied' | 'neutral' | 'hostile' | 'at_war';
			tradeAgreements: boolean;
			militaryAlliance: boolean;
			relationshipScore: number;
		}[],
		globalEvents: [] as string[]
	});

	$effect(() => {
		if (scenario) {
			name = scenario.name;
			description = scenario.description;
			historicalPeriod = scenario.historicalPeriod;
			startYear = scenario.startYear;
			aiContext = scenario.aiContext;
			initialWorldState = scenario.initialWorldState;
		}
	});

	let jsonString = $state('');
	let isEditingJson = $state(false);
	let jsonError = $state<string | null>(null);

	$effect(() => {
		if (!isEditingJson) {
			// Deep dependency tracking on initialWorldState
			// We need to access properties to track them if they are proxies
			// JSON.stringify accesses all properties, so it should be fine.
			jsonString = JSON.stringify(initialWorldState, null, 2);
			jsonError = null;
		}
	});

	function handleJsonInput(e: Event) {
		const target = e.target as HTMLTextAreaElement;
		jsonString = target.value;
		try {
			initialWorldState = JSON.parse(jsonString);
			jsonError = null;
		} catch (e) {
			jsonError = (e as Error).message;
		}
	}

	const client = useConvexClient();

	async function saveScenario() {
		try {
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

	function addNation() {
		initialWorldState.nations.push({
			id: `nation_${initialWorldState.nations.length + 1}`,
			name: m.default_new_nation(),
			government: m.default_republic(),
			resources: { military: 50, economy: 50, stability: 50, influence: 50 },
			territories: []
		});
	}

	function removeNation(index: number) {
		initialWorldState.nations.splice(index, 1);
	}

	function addRelationship() {
		initialWorldState.relationships.push({
			nation1Id: '',
			nation2Id: '',
			status: 'neutral',
			tradeAgreements: false,
			militaryAlliance: false,
			relationshipScore: 0
		});
	}

	function removeRelationship(index: number) {
		initialWorldState.relationships.splice(index, 1);
	}
</script>

<Card class="mx-auto mt-8 w-full max-w-4xl">
	<CardHeader>
		<CardTitle>{scenario ? m.edit_scenario_title() : m.create_scenario_title()}</CardTitle>
	</CardHeader>
	<CardContent class="space-y-6">
		<div class="space-y-2">
			<Label for="name">{m.name_label()}</Label>
			<Input id="name" bind:value={name} placeholder={m.scenario_name_placeholder()} />
		</div>

		<div class="space-y-2">
			<Label for="description">{m.description_label()}</Label>
			<Textarea
				id="description"
				bind:value={description}
				placeholder={m.scenario_desc_placeholder()}
			/>
		</div>

		<div class="grid grid-cols-2 gap-4">
			<div class="space-y-2">
				<Label for="period">{m.period_label()}</Label>
				<Input id="period" bind:value={historicalPeriod} placeholder={m.period_placeholder()} />
			</div>
			<div class="space-y-2">
				<Label for="year">{m.start_year_label()}</Label>
				<Input id="year" type="number" bind:value={startYear} />
			</div>
		</div>

		<div class="space-y-2">
			<Label for="aiContext">{m.ai_context_label()}</Label>
			<Textarea
				id="aiContext"
				bind:value={aiContext}
				placeholder={m.ai_context_placeholder()}
				class="h-24"
			/>
		</div>

		<div class="space-y-2">
			<Label>{m.initial_world_state_label()}</Label>

			<Tabs.Root value="nations" class="w-full">
				<Tabs.List class="grid w-full grid-cols-3">
					<Tabs.Trigger value="nations">{m.tab_nations()}</Tabs.Trigger>
					<Tabs.Trigger value="relationships">{m.tab_relationships()}</Tabs.Trigger>
					<Tabs.Trigger value="json">{m.tab_raw_json()}</Tabs.Trigger>
				</Tabs.List>

				<Tabs.Content value="nations" class="pt-4">
					{#each initialWorldState.nations as nation, i (nation)}
						<NationEditor
							bind:nation={initialWorldState.nations[i]}
							onDelete={() => removeNation(i)}
						/>
					{/each}
					<Button variant="outline" class="w-full" onclick={addNation}>
						<Plus class="mr-2 h-4 w-4" />
						{m.add_nation()}
					</Button>
				</Tabs.Content>

				<Tabs.Content value="relationships" class="pt-4">
					{#if initialWorldState.nations.length < 2}
						<p class="py-4 text-center text-sm text-muted-foreground">
							{m.min_two_nations()}
						</p>
					{:else}
						{#each initialWorldState.relationships as relationship, i (relationship)}
							<RelationshipEditor
								bind:relationship={initialWorldState.relationships[i]}
								nations={initialWorldState.nations}
								onDelete={() => removeRelationship(i)}
							/>
						{/each}
						<Button variant="outline" class="w-full" onclick={addRelationship}>
							<Plus class="mr-2 h-4 w-4" />
							{m.add_relationship()}
						</Button>
					{/if}
				</Tabs.Content>

				<Tabs.Content value="json" class="pt-4">
					<Textarea
						id="worldState"
						value={jsonString}
						oninput={handleJsonInput}
						onfocus={() => (isEditingJson = true)}
						onblur={() => (isEditingJson = false)}
						class="h-96 font-mono text-xs"
					/>
					{#if jsonError}
						<p class="mt-2 text-xs text-red-500">
							{jsonError}
						</p>
					{:else}
						<p class="mt-2 text-xs text-muted-foreground">
							{m.json_edit_hint()}
						</p>
					{/if}
				</Tabs.Content>
			</Tabs.Root>
		</div>

		<Button onclick={saveScenario} class="w-full">{m.save_scenario_button()}</Button>
	</CardContent>
</Card>
