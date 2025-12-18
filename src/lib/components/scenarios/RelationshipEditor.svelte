<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { Switch } from '$lib/components/ui/switch';
	import * as Select from '$lib/components/ui/select';
	import { Trash2 } from '@lucide/svelte';
	import * as m from '$lib/paraglide/messages';

	let {
		relationship = $bindable(),
		nations,
		onDelete
	} = $props<{
		relationship: {
			nation1Id: string;
			nation2Id: string;
			status: 'allied' | 'neutral' | 'hostile' | 'at_war';
			tradeAgreements: boolean;
			militaryAlliance: boolean;
			relationshipScore: number;
		};
		nations: { id: string; name: string }[];
		onDelete: () => void;
	}>();

	let statuses = $derived([
		{ value: 'allied', label: m.status_allied() },
		{ value: 'neutral', label: m.status_neutral() },
		{ value: 'hostile', label: m.status_hostile() },
		{ value: 'at_war', label: m.status_at_war() }
	]);

	// Helper to sync Select value with relationship.status
	let selectedStatus = $derived({
		value: relationship.status,
		label: statuses.find((s) => s.value === relationship.status)?.label ?? relationship.status
	});

	// Helper to sync Select value with nation IDs
	let selectedNation1 = $derived(
		relationship.nation1Id
			? {
					value: relationship.nation1Id,
					label:
						nations.find((n: { id: string }) => n.id === relationship.nation1Id)?.name ??
						relationship.nation1Id
				}
			: undefined
	);
	let selectedNation2 = $derived(
		relationship.nation2Id
			? {
					value: relationship.nation2Id,
					label:
						nations.find((n: { id: string }) => n.id === relationship.nation2Id)?.name ??
						relationship.nation2Id
				}
			: undefined
	);
</script>

<Card class="mb-4">
	<CardContent class="pt-6">
		<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
			<div class="space-y-2">
				<Label>{m.label_nation_1()}</Label>
				<Select.Root
					type="single"
					value={selectedNation1?.value}
					onValueChange={(v) => (relationship.nation1Id = v)}
				>
					<Select.Trigger>
						{selectedNation1?.label ?? m.select_nation()}
					</Select.Trigger>
					<Select.Content>
						{#each nations as nation (nation.id)}
							<Select.Item value={nation.id} label={nation.name}>{nation.name}</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
			</div>
			<div class="space-y-2">
				<Label>{m.label_nation_2()}</Label>
				<Select.Root
					type="single"
					value={selectedNation2?.value}
					onValueChange={(v) => (relationship.nation2Id = v)}
				>
					<Select.Trigger>
						{selectedNation2?.label ?? m.select_nation()}
					</Select.Trigger>
					<Select.Content>
						{#each nations as nation (nation.id)}
							<Select.Item value={nation.id} label={nation.name}>{nation.name}</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
			</div>
			<div class="space-y-2">
				<Label>{m.label_status()}</Label>
				<Select.Root
					type="single"
					value={selectedStatus.value}
					onValueChange={(v) => (relationship.status = v as typeof relationship.status)}
				>
					<Select.Trigger>
						{selectedStatus.label}
					</Select.Trigger>
					<Select.Content>
						{#each statuses as status (status.value)}
							<Select.Item value={status.value} label={status.label}>{status.label}</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
			</div>
			<div class="space-y-2">
				<Label for="rel-score">{m.label_score_range()}</Label>
				<Input type="number" id="rel-score" bind:value={relationship.relationshipScore} />
			</div>
		</div>

		<div class="mt-4 grid grid-cols-2 gap-4">
			<div class="flex items-center space-x-2">
				<Switch id="trade-agreements" bind:checked={relationship.tradeAgreements} />
				<Label for="trade-agreements">{m.label_trade_agreements()}</Label>
			</div>
			<div class="flex items-center space-x-2">
				<Switch id="mil-alliance" bind:checked={relationship.militaryAlliance} />
				<Label for="mil-alliance">{m.label_military_alliance()}</Label>
			</div>
		</div>

		<div class="mt-4 flex justify-end">
			<Button variant="destructive" size="sm" onclick={onDelete}>
				<Trash2 class="mr-2 h-4 w-4" />
				{m.remove_relationship()}
			</Button>
		</div>
	</CardContent>
</Card>
