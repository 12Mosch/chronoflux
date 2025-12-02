<script lang="ts">
	import * as m from '$lib/paraglide/messages';
	import {
		Card,
		CardContent,
		CardHeader,
		CardTitle,
		CardDescription
	} from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import {
		AlertDialog,
		AlertDialogAction,
		AlertDialogCancel,
		AlertDialogContent,
		AlertDialogDescription,
		AlertDialogFooter,
		AlertDialogHeader,
		AlertDialogTitle,
		AlertDialogTrigger
	} from '$lib/components/ui/alert-dialog';
	import { ArrowRight, Calendar, Flag, Trash } from '@lucide/svelte';
	import type { Doc } from '../../../convex/_generated/dataModel';

	interface Props {
		game: Doc<'games'>;
		scenarioName: string;
		nationName?: string;
		onDelete?: () => void;
	}

	let { game, scenarioName, nationName, onDelete }: Props = $props();

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
	class="group relative overflow-hidden border-slate-700 bg-slate-800/50 transition-all hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10"
>
	<CardHeader class="pb-2">
		<div class="flex items-start justify-between gap-4">
			<div class="flex-1">
				<CardTitle
					class="mb-1 text-lg font-bold text-white transition-colors group-hover:text-blue-400"
				>
					{scenarioName}
				</CardTitle>
				<CardDescription class="flex items-center gap-2 text-xs text-slate-400">
					<Calendar class="h-3 w-3" />
					{m.last_played({ date: formatDate(game.updatedAt) })}
				</CardDescription>
			</div>
			<div class="flex items-center gap-2">
				<Badge
					variant={game.status === 'active' ? 'default' : 'secondary'}
					class="capitalize {game.status === 'active'
						? 'bg-blue-600 hover:bg-blue-700'
						: 'bg-slate-700 text-slate-300'}"
				>
					{game.status}
				</Badge>
				<AlertDialog>
					<AlertDialogTrigger>
						<Button
							variant="ghost"
							size="icon"
							class="h-8 w-8 text-slate-400 hover:text-red-400"
							aria-label={m.delete_game_label()}
						>
							<Trash class="h-4 w-4" />
						</Button>
					</AlertDialogTrigger>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>{m.delete_game_title()}</AlertDialogTitle>
							<AlertDialogDescription>
								{m.delete_game_confirm()}
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel>{m.cancel()}</AlertDialogCancel>
							<AlertDialogAction onclick={onDelete} class="bg-red-600 hover:bg-red-700">
								{m.delete()}
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			</div>
		</div>
	</CardHeader>
	<CardContent>
		<div class="mb-6 flex items-center gap-2 text-sm text-slate-300">
			<div class="flex items-center gap-1.5 rounded-full bg-slate-800 px-2.5 py-1">
				<Flag class="h-3.5 w-3.5 text-blue-400" />
				<span class="font-medium">{nationName || m.unknown_nation()}</span>
			</div>
			<span class="text-slate-600">•</span>
			<span class="text-slate-400">{m.turn_header({ turnNumber: game.currentTurn })}</span>
		</div>

		<Button
			href="/game/{game._id}"
			class="w-full gap-2 bg-slate-800 text-white hover:bg-blue-600 hover:text-white"
			variant="secondary"
			size="sm"
		>
			{m.continue_playing()}
			<ArrowRight class="h-4 w-4 transition-transform group-hover:translate-x-1" />
		</Button>
	</CardContent>
</Card>
