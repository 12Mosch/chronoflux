<script lang="ts">
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';

	let { params } = $props();
</script>

<div class="mx-auto max-w-4xl">
	<div class="mb-8">
		<h1 class="mb-2 text-4xl font-bold">Game History</h1>
		<p class="text-slate-400">Game ID: {params.gameId}</p>
	</div>

	<!-- Timeline -->
	<div class="space-y-4">
		<!-- Turn 1 -->
		<Card
			class="cursor-pointer border-slate-700 bg-slate-800 transition-colors hover:border-blue-500"
		>
			<CardHeader>
				<div class="flex items-start justify-between">
					<div>
						<CardTitle>Turn 1</CardTitle>
						<CardDescription>Year 1914 - Game Started</CardDescription>
					</div>
					<span class="rounded bg-blue-600 px-2 py-1 text-xs">Initial State</span>
				</div>
			</CardHeader>
			<CardContent>
				<p class="mb-4 text-slate-300">
					The game begins. You take control of your nation with initial resources and relationships
					established.
				</p>
				<Button variant="outline" size="sm">View Details</Button>
			</CardContent>
		</Card>

		<!-- Empty State -->
		<div class="py-12 text-center">
			<p class="mb-4 text-slate-400">
				No additional turns yet. Start playing to build your history!
			</p>
			<Button href="/game/{params.gameId}">← Back to Game</Button>
		</div>
	</div>
</div>
