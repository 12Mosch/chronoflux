<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import type { Doc } from '$convex/_generated/dataModel';

	interface Props {
		playerNation: Doc<'nations'> | null;
		allNations: Doc<'nations'>[];
	}

	let { playerNation, allNations }: Props = $props();

	const otherNations = $derived(
		allNations.filter((nation) => nation._id !== playerNation?._id)
	);

	function getResourceColor(value: number): string {
		if (value >= 70) return 'bg-green-500';
		if (value >= 40) return 'bg-yellow-500';
		return 'bg-red-500';
	}
</script>

<Card.Root class="h-full">
	<Card.Header>
		<Card.Title>Your Nation</Card.Title>
	</Card.Header>
	<Card.Content>
		{#if !playerNation}
			<p class="text-muted-foreground">Loading nation data...</p>
		{:else}
			<div class="space-y-4">
				<!-- Nation Name and Government -->
				<div>
					<h3 class="text-lg font-bold">{playerNation.name}</h3>
					<p class="text-sm text-muted-foreground">{playerNation.government}</p>
				</div>

				<!-- Resources -->
				<div class="space-y-3">
					<h4 class="text-sm font-semibold">Resources</h4>

					<div class="space-y-2">
						<div>
							<div class="mb-1 flex justify-between text-xs">
								<span>Military</span>
								<span>{playerNation.resources.military}</span>
							</div>
							<div class="h-2 w-full overflow-hidden rounded-full bg-secondary">
								<div
									class={`h-full ${getResourceColor(playerNation.resources.military)}`}
									style="width: {playerNation.resources.military}%"
								></div>
							</div>
						</div>

						<div>
							<div class="mb-1 flex justify-between text-xs">
								<span>Economy</span>
								<span>{playerNation.resources.economy}</span>
							</div>
							<div class="h-2 w-full overflow-hidden rounded-full bg-secondary">
								<div
									class={`h-full ${getResourceColor(playerNation.resources.economy)}`}
									style="width: {playerNation.resources.economy}%"
								></div>
							</div>
						</div>

						<div>
							<div class="mb-1 flex justify-between text-xs">
								<span>Stability</span>
								<span>{playerNation.resources.stability}</span>
							</div>
							<div class="h-2 w-full overflow-hidden rounded-full bg-secondary">
								<div
									class={`h-full ${getResourceColor(playerNation.resources.stability)}`}
									style="width: {playerNation.resources.stability}%"
								></div>
							</div>
						</div>

						<div>
							<div class="mb-1 flex justify-between text-xs">
								<span>Influence</span>
								<span>{playerNation.resources.influence}</span>
							</div>
							<div class="h-2 w-full overflow-hidden rounded-full bg-secondary">
								<div
									class={`h-full ${getResourceColor(playerNation.resources.influence)}`}
									style="width: {playerNation.resources.influence}%"
								></div>
							</div>
						</div>
					</div>
				</div>

				<!-- Territories -->
				{#if playerNation.territories.length > 0}
					<div>
						<h4 class="mb-2 text-sm font-semibold">Territories</h4>
						<div class="flex flex-wrap gap-1">
							{#each playerNation.territories as territory (territory)}
								<span class="rounded-md bg-secondary px-2 py-1 text-xs">{territory}</span>
							{/each}
						</div>
					</div>
				{/if}

				<!-- Other Nations -->
				{#if otherNations.length > 0}
					<div>
						<h4 class="mb-2 text-sm font-semibold">Other Nations</h4>
						<div class="space-y-1">
							{#each otherNations as nation (nation._id)}
								<div class="rounded-md border border-border p-2 text-xs">
									<div class="font-medium">{nation.name}</div>
									<div class="text-muted-foreground">{nation.government}</div>
								</div>
							{/each}
						</div>
					</div>
				{/if}
			</div>
		{/if}
	</Card.Content>
</Card.Root>
