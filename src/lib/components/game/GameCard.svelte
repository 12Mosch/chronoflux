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
	import { ArrowRight, Calendar, Flag, RefreshCcw, Trash } from '@lucide/svelte';
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
	class={`group relative overflow-hidden rounded-xl border border-slate-700/70 bg-linear-to-b from-slate-900/80 via-slate-900/60 to-slate-900/40 shadow-md shadow-slate-950/60 transition-all hover:border-blue-500/70 hover:shadow-xl hover:shadow-blue-500/25 ${
		game.status === 'active' ? 'border-blue-500/80 shadow-blue-500/30' : ''
	}`}
>
	<CardHeader class="pb-3">
		<div class="flex items-start justify-between gap-4">
			<div class="flex-1 space-y-1.5">
				<div class="flex items-center gap-2">
					<Badge
						variant="outline"
						class={`rounded-full px-3 py-1 text-[0.7rem] font-semibold tracking-wide uppercase ${
							game.status === 'active'
								? 'bg-blue-500 text-slate-950 shadow-sm ring-2 shadow-blue-500/40 ring-blue-300/80'
								: 'border-slate-600/70 bg-slate-800 text-slate-200'
						}`}
					>
						{game.status}
					</Badge>
				</div>
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
		<div class="mb-5 space-y-2 text-sm text-slate-200">
			<div class="flex items-center gap-2">
				<Flag class="h-4 w-4 text-blue-400" />
				<span class="font-medium">{nationName || m.unknown_nation()}</span>
			</div>
			<div class="flex items-center gap-2 text-slate-300">
				<RefreshCcw class="h-4 w-4 text-emerald-400" />
				<span>{m.turn_header({ turnNumber: game.currentTurn })}</span>
			</div>
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
