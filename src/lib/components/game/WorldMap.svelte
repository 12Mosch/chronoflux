<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import type { Doc } from '$convex/_generated/dataModel';

	interface Props {
		nations: Doc<'nations'>[];
		relationships: Doc<'relationships'>[];
		playerNation: Doc<'nations'> | null;
	}

	let { nations, relationships, playerNation }: Props = $props();

	function getRelationshipStatus(nationId: string): string {
		if (!playerNation) return 'unknown';

		const relationship = relationships.find(
			(rel) =>
				(rel.nation1Id === playerNation._id && rel.nation2Id === nationId) ||
				(rel.nation2Id === playerNation._id && rel.nation1Id === nationId)
		);

		return relationship?.status || 'neutral';
	}

	function getRelationshipScore(nationId: string): number {
		if (!playerNation) return 0;

		const relationship = relationships.find(
			(rel) =>
				(rel.nation1Id === playerNation._id && rel.nation2Id === nationId) ||
				(rel.nation2Id === playerNation._id && rel.nation1Id === nationId)
		);

		return relationship?.relationshipScore || 0;
	}

	function getStatusColor(status: string): string {
		switch (status) {
			case 'allied':
				return 'bg-green-500';
			case 'neutral':
				return 'bg-gray-500';
			case 'hostile':
				return 'bg-orange-500';
			case 'at_war':
				return 'bg-red-500';
			default:
				return 'bg-gray-400';
		}
	}

	function getStatusLabel(status: string): string {
		switch (status) {
			case 'allied':
				return 'Allied';
			case 'neutral':
				return 'Neutral';
			case 'hostile':
				return 'Hostile';
			case 'at_war':
				return 'At War';
			default:
				return 'Unknown';
		}
	}

	const otherNations = $derived(
		nations.filter((nation) => nation._id !== playerNation?._id)
	);
</script>

<Card.Root class="h-full min-h-[400px]">
	<Card.Header>
		<Card.Title>World Overview</Card.Title>
	</Card.Header>
	<Card.Content>
		{#if nations.length === 0}
			<div class="flex h-full items-center justify-center">
				<p class="text-muted-foreground">No nations data available.</p>
			</div>
		{:else}
			<div class="space-y-4">
				<!-- Player Nation -->
				{#if playerNation}
					<div class="rounded-lg border-2 border-primary bg-primary/10 p-3">
						<div class="mb-2 flex items-center justify-between">
							<h3 class="font-bold">{playerNation.name}</h3>
							<span class="rounded-md bg-primary px-2 py-1 text-xs text-primary-foreground">
								You
							</span>
						</div>
						<p class="text-xs text-muted-foreground">{playerNation.government}</p>
						{#if playerNation.territories.length > 0}
							<div class="mt-2 flex flex-wrap gap-1">
								{#each playerNation.territories.slice(0, 3) as territory (territory)}
									<span class="rounded bg-secondary px-1.5 py-0.5 text-xs">{territory}</span>
								{/each}
								{#if playerNation.territories.length > 3}
									<span class="rounded bg-secondary px-1.5 py-0.5 text-xs">
										+{playerNation.territories.length - 3} more
									</span>
								{/if}
							</div>
						{/if}
					</div>
				{/if}

				<!-- Other Nations -->
				<div>
					<h4 class="mb-2 text-sm font-semibold">Other Nations</h4>
					<div class="space-y-2">
						{#each otherNations as nation (nation._id)}
							{@const status = getRelationshipStatus(nation._id)}
							{@const score = getRelationshipScore(nation._id)}
							<div class="rounded-lg border border-border p-3">
								<div class="mb-2 flex items-center justify-between">
									<h4 class="font-medium">{nation.name}</h4>
									<span class={`rounded-md px-2 py-1 text-xs text-white ${getStatusColor(status)}`}>
										{getStatusLabel(status)}
									</span>
								</div>
								<p class="text-xs text-muted-foreground">{nation.government}</p>
								<div class="mt-2 flex items-center gap-2 text-xs">
									<span class="text-muted-foreground">Relationship:</span>
									<span class={score >= 0 ? 'text-green-600' : 'text-red-600'}>
										{score > 0 ? '+' : ''}{score}
									</span>
								</div>
								{#if nation.territories.length > 0}
									<div class="mt-2 flex flex-wrap gap-1">
										{#each nation.territories.slice(0, 2) as territory (territory)}
											<span class="rounded bg-secondary px-1.5 py-0.5 text-xs">{territory}</span>
										{/each}
										{#if nation.territories.length > 2}
											<span class="rounded bg-secondary px-1.5 py-0.5 text-xs">
												+{nation.territories.length - 2} more
											</span>
										{/if}
									</div>
								{/if}
							</div>
						{/each}
					</div>
				</div>
			</div>
		{/if}
	</Card.Content>
</Card.Root>
