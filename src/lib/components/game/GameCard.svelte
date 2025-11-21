<script lang="ts">
	import {
		Card,
		CardContent,
		CardHeader,
		CardTitle,
		CardDescription
	} from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { ArrowRight, Calendar, Flag } from '@lucide/svelte';
	import type { Doc } from '../../../convex/_generated/dataModel';

	interface Props {
		game: Doc<'games'>;
		scenarioName: string;
		nationName?: string;
	}

	let { game, scenarioName, nationName }: Props = $props();

	function formatDate(timestamp: number) {
		return new Intl.DateTimeFormat('en-US', {
			month: 'short',
			day: 'numeric',
			hour: 'numeric',
			minute: 'numeric'
		}).format(new Date(timestamp));
	}
</script>

<Card
	class="group relative overflow-hidden transition-all hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10"
>
	<CardHeader class="pb-3">
		<div class="flex items-start justify-between gap-4">
			<div>
				<CardTitle
					class="mb-1 text-lg font-bold text-white transition-colors group-hover:text-blue-400"
				>
					{scenarioName}
				</CardTitle>
				<CardDescription class="flex items-center gap-2 text-xs">
					<Calendar class="h-3 w-3" />
					Last played {formatDate(game.updatedAt)}
				</CardDescription>
			</div>
			<Badge variant={game.status === 'active' ? 'default' : 'secondary'} class="capitalize">
				{game.status}
			</Badge>
		</div>
	</CardHeader>
	<CardContent>
		<div class="mb-4 flex items-center gap-2 text-sm text-slate-300">
			<Flag class="h-4 w-4 text-blue-400" />
			<span>{nationName || 'Unknown Nation'}</span>
			<span class="text-slate-500">•</span>
			<span class="text-slate-400">Turn {game.currentTurn}</span>
		</div>

		<Button
			href="/game/{game._id}"
			class="w-full gap-2 transition-colors group-hover:bg-blue-600 group-hover:text-white"
			variant="secondary"
			size="sm"
		>
			Continue Game
			<ArrowRight class="h-4 w-4 transition-transform group-hover:translate-x-1" />
		</Button>
	</CardContent>
</Card>
