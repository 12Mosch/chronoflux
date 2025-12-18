<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { Trash2 } from '@lucide/svelte';
	import * as m from '$lib/paraglide/messages';

	let { nation = $bindable(), onDelete } = $props<{
		nation: {
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
		};
		onDelete: () => void;
	}>();

	let territoriesInput = $state(nation.territories.join(', '));

	function updateTerritories() {
		nation.territories = territoriesInput
			.split(',')
			.map((t: string) => t.trim())
			.filter((t: string) => t.length > 0);
	}
</script>

<Card class="mb-4">
	<CardContent class="pt-6">
		<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
			<div class="space-y-2">
				<Label for="nation-id">{m.label_id()}</Label>
				<Input id="nation-id" bind:value={nation.id} placeholder={m.placeholder_nation_id()} />
			</div>
			<div class="space-y-2">
				<Label for="nation-name">{m.label_name()}</Label>
				<Input
					id="nation-name"
					bind:value={nation.name}
					placeholder={m.placeholder_nation_name()}
				/>
			</div>
			<div class="space-y-2">
				<Label for="nation-gov">{m.label_government()}</Label>
				<Input
					id="nation-gov"
					bind:value={nation.government}
					placeholder={m.placeholder_government()}
				/>
			</div>
			<div class="space-y-2">
				<Label for="nation-territories">{m.label_territories_csv()}</Label>
				<Input
					id="nation-territories"
					bind:value={territoriesInput}
					oninput={updateTerritories}
					placeholder={m.placeholder_territories()}
				/>
			</div>
		</div>

		<div class="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
			<div class="space-y-2">
				<Label for="res-mil">{m.resource_military()}</Label>
				<Input type="number" id="res-mil" bind:value={nation.resources.military} />
			</div>
			<div class="space-y-2">
				<Label for="res-eco">{m.resource_economy()}</Label>
				<Input type="number" id="res-eco" bind:value={nation.resources.economy} />
			</div>
			<div class="space-y-2">
				<Label for="res-stab">{m.resource_stability()}</Label>
				<Input type="number" id="res-stab" bind:value={nation.resources.stability} />
			</div>
			<div class="space-y-2">
				<Label for="res-inf">{m.resource_influence()}</Label>
				<Input type="number" id="res-inf" bind:value={nation.resources.influence} />
			</div>
		</div>

		<div class="mt-4 flex justify-end">
			<Button variant="destructive" size="sm" onclick={onDelete}>
				<Trash2 class="mr-2 h-4 w-4" />
				{m.remove_nation()}
			</Button>
		</div>
	</CardContent>
</Card>
