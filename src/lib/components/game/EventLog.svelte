<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import { Button } from '$lib/components/ui/button';
	import { useQuery } from 'convex-svelte';
	import { api } from '$convex/_generated/api';
	import type { Id } from '$convex/_generated/dataModel';
	import { page } from '$app/state';
	import {
		ListFilter,
		Newspaper,
		Swords,
		Handshake,
		TrendingUp,
		CircleAlert
	} from '@lucide/svelte';

	const gameId = $derived(page.params.gameId as Id<'games'>);
	const turns = $derived(useQuery(api.turns.getTurnsForGame, gameId ? { gameId } : 'skip'));

	let activeFilter = $state('all');

	const filters = [
		{ id: 'all', label: 'All', icon: ListFilter },
		{ id: 'political', label: 'Political', icon: Newspaper },
		{ id: 'military', label: 'Military', icon: Swords },
		{ id: 'diplomatic', label: 'Diplomatic', icon: Handshake },
		{ id: 'economic', label: 'Economic', icon: TrendingUp }
	];

	function getEventTypeIcon(type: string) {
		switch (type) {
			case 'political':
				return Newspaper;
			case 'military':
				return Swords;
			case 'diplomatic':
				return Handshake;
			case 'economic':
				return TrendingUp;
			default:
				return CircleAlert;
		}
	}

	function getEventTypeColor(type: string) {
		switch (type) {
			case 'political':
				return 'bg-blue-500/10 text-blue-600 border-blue-200';
			case 'military':
				return 'bg-red-500/10 text-red-600 border-red-200';
			case 'diplomatic':
				return 'bg-purple-500/10 text-purple-600 border-purple-200';
			case 'economic':
				return 'bg-yellow-500/10 text-yellow-600 border-yellow-200';
			default:
				return 'bg-gray-500/10 text-gray-600 border-gray-200';
		}
	}

	type TurnHeader = {
		type: 'turn_header';
		turnNumber: number;
		playerAction: string;
		narrative?: string;
		id: string;
	};

	type EventItem = {
		type: 'event';
		eventType: string;
		title: string;
		description: string;
		turnNumber: number;
		id: string;
	};

	type DisplayItem = TurnHeader | EventItem;

	// Flatten turns into a list of displayable items (events + turn summaries)
	const displayItems = $derived.by(() => {
		if (!turns.data) return [];

		const items: DisplayItem[] = [];

		turns.data.forEach((turn) => {
			// Add turn header/summary
			items.push({
				type: 'turn_header',
				turnNumber: turn.turnNumber,
				playerAction: turn.playerAction,
				narrative: turn.aiResponse?.narrative,
				id: `turn-${turn._id}`
			});

			// Add individual events
			if (turn.aiResponse?.events) {
				turn.aiResponse.events.forEach((event, index: number) => {
					items.push({
						type: 'event',
						eventType: event.type,
						title: event.title,
						description: event.description,
						turnNumber: turn.turnNumber,
						id: `event-${turn._id}-${index}`
					});
				});
			}
		});

		return items.filter((item) => {
			if (activeFilter === 'all') return true;
			if (item.type === 'turn_header') return true; // Always show headers, or maybe hide if no events match?
			// For events, check type
			return item.eventType === activeFilter;
		});
	});
</script>

<Card.Root class="flex h-full flex-col overflow-hidden">
	<Card.Header class="pb-2">
		<div class="flex items-center justify-between">
			<Card.Title class="flex items-center gap-2">
				<Newspaper class="h-5 w-5" />
				Event Log
			</Card.Title>
		</div>

		<!-- Filter Tabs -->
		<div class="mt-2 flex gap-1 overflow-x-auto pb-1">
			{#each filters as filter (filter.id)}
				{@const Icon = filter.icon}
				<Button
					variant={activeFilter === filter.id ? 'secondary' : 'ghost'}
					size="sm"
					class="h-7 px-2 text-xs"
					onclick={() => (activeFilter = filter.id)}
				>
					<Icon class="mr-1 h-3 w-3" />
					{filter.label}
				</Button>
			{/each}
		</div>
	</Card.Header>
	<Card.Content class="flex-1 overflow-hidden p-0">
		<ScrollArea class="h-full px-6 pb-6">
			{#if turns.isLoading}
				<div class="flex h-20 items-center justify-center text-muted-foreground">
					Loading events...
				</div>
			{:else if turns.error}
				<div class="flex h-20 items-center justify-center text-destructive">
					Error loading events.
				</div>
			{:else if displayItems.length === 0}
				<div class="flex h-20 items-center justify-center text-muted-foreground">
					No events found.
				</div>
			{:else}
				<div class="space-y-4 pt-2">
					{#each displayItems as item (item.id)}
						{#if item.type === 'turn_header'}
							<div class="relative border-l-2 border-primary/20 pt-2 pl-4">
								<div class="absolute top-3 -left-[5px] h-2.5 w-2.5 rounded-full bg-primary"></div>
								<div class="mb-1 flex items-center gap-2">
									<span class="text-sm font-bold text-primary">Turn {item.turnNumber}</span>
									<span class="text-xs text-muted-foreground">
										{new Date().toLocaleDateString()}
									</span>
								</div>
								{#if activeFilter === 'all'}
									<div
										class="mb-2 rounded-md bg-secondary/30 p-2 text-xs text-muted-foreground italic"
									>
										"{item.playerAction}"
									</div>
									{#if item.narrative}
										<p class="text-sm text-foreground/80">{item.narrative}</p>
									{/if}
								{/if}
							</div>
						{:else}
							{@const Icon = getEventTypeIcon(item.eventType)}
							<div class="ml-4 rounded-lg border bg-card p-3 shadow-sm">
								<div class="mb-1 flex items-center gap-2">
									<Badge
										variant="outline"
										class={`${getEventTypeColor(item.eventType)} capitalize`}
									>
										<Icon class="mr-1 h-3 w-3" />
										{item.eventType}
									</Badge>
									<span class="text-sm font-semibold">{item.title}</span>
								</div>
								<p class="text-xs text-muted-foreground">{item.description}</p>
							</div>
						{/if}
					{/each}
				</div>
			{/if}
		</ScrollArea>
	</Card.Content>
</Card.Root>
