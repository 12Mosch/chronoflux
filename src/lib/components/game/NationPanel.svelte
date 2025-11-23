<script lang="ts">
	import * as m from '$lib/paraglide/messages';
	import * as Card from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Separator } from '$lib/components/ui/separator';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import type { Doc } from '$convex/_generated/dataModel';
	import { Shield, Coins, Scale, Crown, MapPin, Flag } from '@lucide/svelte';

	interface Props {
		playerNation: Doc<'nations'> | null;
		allNations: Doc<'nations'>[];
	}

	let { playerNation, allNations }: Props = $props();

	const otherNations = $derived(allNations.filter((nation) => nation._id !== playerNation?._id));

	function getResourceColor(value: number): string {
		if (value >= 70) return 'bg-green-500';
		if (value >= 40) return 'bg-yellow-500';
		return 'bg-red-500';
	}
</script>

<Card.Root class="flex h-full flex-col overflow-hidden">
	<Card.Header class="pb-2">
		<Card.Title class="flex items-center gap-2">
			<Flag class="h-5 w-5" />
			{m.your_nation()}
		</Card.Title>
	</Card.Header>
	<Card.Content class="flex-1 overflow-hidden p-0">
		<ScrollArea class="h-full px-6 pb-6">
			{#if !playerNation}
				<div class="flex h-20 items-center justify-center text-muted-foreground">
					{m.loading_nation_data()}
				</div>
			{:else}
				<div class="space-y-6">
					<!-- Nation Header -->
					<div class="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
						<h3 class="text-xl font-bold text-primary">{playerNation.name}</h3>
						<div class="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
							<Crown class="h-4 w-4" />
							<span>{playerNation.government}</span>
						</div>
					</div>

					<Separator />

					<!-- Resources -->
					<div class="space-y-4">
						<h4 class="text-sm font-semibold tracking-wider text-muted-foreground uppercase">
							{m.resources_title()}
						</h4>

						<div class="grid gap-4">
							<!-- Military -->
							<div class="space-y-1.5">
								<div class="flex items-center justify-between text-sm">
									<div class="flex items-center gap-2">
										<Shield class="h-4 w-4 text-red-500" />
										<span class="font-medium">{m.resource_military()}</span>
									</div>
									<span class="font-mono font-bold">{playerNation.resources.military}</span>
								</div>
								<div class="h-2.5 w-full overflow-hidden rounded-full bg-secondary/50">
									<div
										class={`h-full transition-all duration-500 ${getResourceColor(playerNation.resources.military)}`}
										style="width: {playerNation.resources.military}%"
									></div>
								</div>
							</div>

							<!-- Economy -->
							<div class="space-y-1.5">
								<div class="flex items-center justify-between text-sm">
									<div class="flex items-center gap-2">
										<Coins class="h-4 w-4 text-yellow-500" />
										<span class="font-medium">{m.resource_economy()}</span>
									</div>
									<span class="font-mono font-bold">{playerNation.resources.economy}</span>
								</div>
								<div class="h-2.5 w-full overflow-hidden rounded-full bg-secondary/50">
									<div
										class={`h-full transition-all duration-500 ${getResourceColor(playerNation.resources.economy)}`}
										style="width: {playerNation.resources.economy}%"
									></div>
								</div>
							</div>

							<!-- Stability -->
							<div class="space-y-1.5">
								<div class="flex items-center justify-between text-sm">
									<div class="flex items-center gap-2">
										<Scale class="h-4 w-4 text-blue-500" />
										<span class="font-medium">{m.resource_stability()}</span>
									</div>
									<span class="font-mono font-bold">{playerNation.resources.stability}</span>
								</div>
								<div class="h-2.5 w-full overflow-hidden rounded-full bg-secondary/50">
									<div
										class={`h-full transition-all duration-500 ${getResourceColor(playerNation.resources.stability)}`}
										style="width: {playerNation.resources.stability}%"
									></div>
								</div>
							</div>

							<!-- Influence -->
							<div class="space-y-1.5">
								<div class="flex items-center justify-between text-sm">
									<div class="flex items-center gap-2">
										<Crown class="h-4 w-4 text-purple-500" />
										<span class="font-medium">{m.resource_influence()}</span>
									</div>
									<span class="font-mono font-bold">{playerNation.resources.influence}</span>
								</div>
								<div class="h-2.5 w-full overflow-hidden rounded-full bg-secondary/50">
									<div
										class={`h-full transition-all duration-500 ${getResourceColor(playerNation.resources.influence)}`}
										style="width: {playerNation.resources.influence}%"
									></div>
								</div>
							</div>
						</div>
					</div>

					<Separator />

					<!-- Territories -->
					<div class="space-y-3">
						<div class="flex items-center gap-2">
							<MapPin class="h-4 w-4 text-muted-foreground" />
							<h4 class="text-sm font-semibold tracking-wider text-muted-foreground uppercase">
								{m.territories_title()}
							</h4>
						</div>
						{#if playerNation.territories.length > 0}
							<div class="flex flex-wrap gap-2">
								{#each playerNation.territories as territory (territory)}
									<Badge variant="secondary" class="px-2 py-1">{territory}</Badge>
								{/each}
							</div>
						{:else}
							<p class="text-sm text-muted-foreground italic">{m.no_territories()}</p>
						{/if}
					</div>

					<Separator />

					<!-- Other Nations (Mini List) -->
					{#if otherNations.length > 0}
						<div class="space-y-3">
							<h4 class="text-sm font-semibold tracking-wider text-muted-foreground uppercase">
								{m.known_world()}
							</h4>
							<div class="grid gap-2">
								{#each otherNations as nation (nation._id)}
									<div class="flex items-center justify-between rounded-md border p-2 text-sm">
										<span class="font-medium">{nation.name}</span>
										<span class="text-xs text-muted-foreground">{nation.government}</span>
									</div>
								{/each}
							</div>
						</div>
					{/if}
				</div>
			{/if}
		</ScrollArea>
	</Card.Content>
</Card.Root>
