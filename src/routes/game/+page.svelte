<script lang="ts">
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';

	let playerAction = $state('');
	let isSubmitting = $state(false);

	async function submitTurn() {
		if (!playerAction.trim()) return;

		isSubmitting = true;
		try {
			// TODO: Call Convex mutation to submit turn
			console.log('Submitting turn:', playerAction);
			playerAction = '';
		} finally {
			isSubmitting = false;
		}
	}
</script>

<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
	<!-- Left Column: Nation Panel & Event Log -->
	<div class="space-y-6 lg:col-span-1">
		<!-- Nation Panel -->
		<Card class="border-slate-700 bg-slate-800">
			<CardHeader>
				<CardTitle>Nation Status</CardTitle>
				<CardDescription>Your current position</CardDescription>
			</CardHeader>
			<CardContent class="space-y-4">
				<div>
					<p class="text-sm text-slate-400">Nation</p>
					<p class="text-lg font-semibold">Player Nation</p>
				</div>
				<div>
					<p class="text-sm text-slate-400">Government</p>
					<p class="text-lg font-semibold">Democracy</p>
				</div>
				<div class="space-y-2">
					<p class="text-sm text-slate-400">Resources</p>
					<div class="space-y-1">
						<div class="flex justify-between text-sm">
							<span>Military</span>
							<span>75/100</span>
						</div>
						<div class="h-2 w-full rounded bg-slate-700">
							<div class="h-2 rounded bg-red-500" style="width: 75%"></div>
						</div>
					</div>
					<div class="space-y-1">
						<div class="flex justify-between text-sm">
							<span>Economy</span>
							<span>60/100</span>
						</div>
						<div class="h-2 w-full rounded bg-slate-700">
							<div class="h-2 rounded bg-green-500" style="width: 60%"></div>
						</div>
					</div>
					<div class="space-y-1">
						<div class="flex justify-between text-sm">
							<span>Stability</span>
							<span>80/100</span>
						</div>
						<div class="h-2 w-full rounded bg-slate-700">
							<div class="h-2 rounded bg-blue-500" style="width: 80%"></div>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>

		<!-- Event Log -->
		<Card class="border-slate-700 bg-slate-800">
			<CardHeader>
				<CardTitle>Recent Events</CardTitle>
				<CardDescription>Last 5 turns</CardDescription>
			</CardHeader>
			<CardContent>
				<div class="max-h-64 space-y-3 overflow-y-auto">
					<div class="border-l-2 border-blue-500 py-1 pl-3 text-sm">
						<p class="font-semibold text-blue-400">Turn 1</p>
						<p class="text-slate-300">Game started</p>
					</div>
				</div>
			</CardContent>
		</Card>
	</div>

	<!-- Right Column: World Map & Action Input -->
	<div class="space-y-6 lg:col-span-2">
		<!-- World Map -->
		<Card class="border-slate-700 bg-slate-800">
			<CardHeader>
				<CardTitle>World Map</CardTitle>
				<CardDescription>Current turn: 1 | Year: 1914</CardDescription>
			</CardHeader>
			<CardContent>
				<div class="flex h-64 items-center justify-center rounded bg-slate-700">
					<p class="text-slate-400">Map visualization coming soon</p>
				</div>
			</CardContent>
		</Card>

		<!-- Action Input -->
		<Card class="border-slate-700 bg-slate-800">
			<CardHeader>
				<CardTitle>Submit Action</CardTitle>
				<CardDescription>Describe your action in natural language</CardDescription>
			</CardHeader>
			<CardContent class="space-y-4">
				<textarea
					bind:value={playerAction}
					placeholder="Describe your action (e.g., 'Form an alliance with France and increase military spending')"
					class="min-h-24 w-full rounded border border-slate-600 bg-slate-700 px-3 py-2 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
				></textarea>
				<Button
					onclick={submitTurn}
					disabled={isSubmitting || !playerAction.trim()}
					class="w-full bg-blue-600 hover:bg-blue-700"
				>
					{isSubmitting ? 'Processing...' : 'Submit Turn'}
				</Button>
			</CardContent>
		</Card>
	</div>
</div>
