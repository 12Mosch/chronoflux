<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import type { Doc } from '$convex/_generated/dataModel';
	import { Crown, Users, Swords, Handshake, ShieldAlert } from '@lucide/svelte';

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
				return 'bg-green-500/10 border-green-500 text-green-700 dark:text-green-400';
			case 'neutral':
				return 'bg-gray-500/10 border-gray-500 text-gray-700 dark:text-gray-400';
			case 'hostile':
				return 'bg-orange-500/10 border-orange-500 text-orange-700 dark:text-orange-400';
			case 'at_war':
				return 'bg-red-500/10 border-red-500 text-red-700 dark:text-red-400';
			default:
				return 'bg-gray-400/10 border-gray-400 text-gray-600';
		}
	}

	function getStatusIcon(status: string) {
		switch (status) {
			case 'allied':
				return Handshake;
			case 'neutral':
				return Users;
			case 'hostile':
				return ShieldAlert;
			case 'at_war':
				return Swords;
			default:
				return Users;
		}
	}

	const otherNations = $derived(
		nations.filter((nation) => nation._id !== playerNation?._id)
	);
</script>

<Card.Root class="flex h-full min-h-[400px] flex-col overflow-hidden">
	<Card.Header class="pb-2">
		<Card.Title class="flex items-center gap-2">
			<Users class="h-5 w-5" />
			World Schematic
		</Card.Title>
	</Card.Header>
	<Card.Content class="flex-1 overflow-hidden p-0">
		<div class="relative h-full w-full bg-secondary/20 p-6">
			<!-- Central Player Node -->
			{#if playerNation}
				<div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transform z-10">
					<div
						class="flex h-32 w-32 flex-col items-center justify-center rounded-full border-4 border-primary bg-background p-4 text-center shadow-xl ring-4 ring-primary/20"
					>
						<Crown class="mb-1 h-6 w-6 text-primary" />
						<span class="font-bold leading-tight">{playerNation.name}</span>
						<Badge variant="secondary" class="mt-1 text-[10px]">You</Badge>
					</div>
				</div>
			{/if}

			<!-- Other Nations in a Circle/Grid -->
			{#if otherNations.length > 0}
				<div class="grid h-full w-full grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
					{#each otherNations as nation (nation._id)}
						{@const status = getRelationshipStatus(nation._id)}
						{@const score = getRelationshipScore(nation._id)}
						{@const StatusIcon = getStatusIcon(status)}
						
						<div class="flex items-center justify-center p-2">
							<div
								class={`flex h-24 w-24 flex-col items-center justify-center rounded-xl border-2 bg-background p-2 text-center shadow-sm transition-all hover:scale-105 hover:shadow-md ${getStatusColor(status)}`}
							>
								<span class="line-clamp-2 text-xs font-bold">{nation.name}</span>
								<div class="mt-1 flex items-center gap-1">
									<StatusIcon class="h-3 w-3" />
									<span class="text-[10px] font-medium capitalize">{status.replace('_', ' ')}</span>
								</div>
								<span class={`text-[10px] font-bold ${score >= 0 ? 'text-green-600' : 'text-red-600'}`}>
									{score > 0 ? '+' : ''}{score}
								</span>
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<div class="flex h-full items-center justify-center text-muted-foreground">
					No other nations known.
				</div>
			{/if}
		</div>
	</Card.Content>
</Card.Root>

