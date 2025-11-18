<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';

	let selectedNation = $state<string | null>(null);

	const nations = [
		{
			id: 'germany',
			name: 'German Empire',
			government: 'Monarchy',
			description: 'Industrial power with strong military'
		},
		{
			id: 'france',
			name: 'French Republic',
			government: 'Republic',
			description: 'Established power with colonial reach'
		},
		{
			id: 'britain',
			name: 'British Empire',
			government: 'Monarchy',
			description: 'Naval superpower with vast colonies'
		},
		{
			id: 'russia',
			name: 'Russian Empire',
			government: 'Monarchy',
			description: 'Vast territory with growing industry'
		}
	];

	async function startGame() {
		if (!selectedNation) return;

		// TODO: Call Convex mutation to create game
		console.log('Starting game with nation:', selectedNation);
		// Redirect to game page after creation
		// goto(`/game/${gameId}`);
	}
</script>

<div class="mx-auto max-w-4xl">
	<div class="mb-8">
		<h1 class="mb-2 text-3xl font-bold">World War I - 1914</h1>
		<p class="text-slate-400">Select a nation to control</p>
	</div>

	<!-- Nations Grid -->
	<div class="mb-8 grid gap-4 md:grid-cols-2">
		{#each nations as nation}
			<Card
				class="cursor-pointer border-slate-700 bg-slate-800 transition-all {selectedNation ===
				nation.id
					? 'border-blue-500 ring-2 ring-blue-500'
					: 'hover:border-slate-600'}"
				onclick={() => (selectedNation = nation.id)}
			>
				<CardHeader>
					<CardTitle>{nation.name}</CardTitle>
					<CardDescription>{nation.government}</CardDescription>
				</CardHeader>
				<CardContent>
					<p class="text-sm text-slate-300">{nation.description}</p>
				</CardContent>
			</Card>
		{/each}
	</div>

	<!-- Action Buttons -->
	<div class="flex gap-4">
		<Button onclick={startGame} disabled={!selectedNation} class="bg-blue-600 hover:bg-blue-700">
			Start Game
		</Button>
		<Button variant="outline" href="/scenarios">← Back to Scenarios</Button>
	</div>
</div>
