<script lang="ts">
	import * as m from '$lib/paraglide/messages';
	import * as Card from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Separator } from '$lib/components/ui/separator';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import type { Doc } from '$convex/_generated/dataModel';
	import { Crown, MapPin, Flag } from '@lucide/svelte';

	interface Props {
		playerNation: Doc<'nations'> | null;
		allNations: Doc<'nations'>[];
	}

	let { playerNation, allNations }: Props = $props();

	const otherNations = $derived(allNations.filter((nation) => nation._id !== playerNation?._id));
</script>

<Card.Root
	class="flex h-full flex-col overflow-hidden rounded-xl border bg-background/95 shadow-lg backdrop-blur-sm"
>
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
