<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
</script>

<div class="min-h-screen bg-slate-900 py-12 text-white">
	<div class="container mx-auto px-4">
		<div class="mb-12">
			<h1 class="mb-2 text-4xl font-bold">Select a Scenario</h1>
			<p class="text-slate-400">Choose a historical period and shape its future</p>
		</div>

		<!-- Scenarios Grid -->
		<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
			<!-- World War I -->
			<Card
				class="cursor-pointer border-slate-700 bg-slate-800 transition-colors hover:border-blue-500"
			>
				<CardHeader>
					<CardTitle>World War I</CardTitle>
					<CardDescription>1914 - The Great War</CardDescription>
				</CardHeader>
				<CardContent>
					<p class="mb-4 text-sm text-slate-300">
						Control a major European power during the First World War. Navigate alliances, manage
						resources, and determine the fate of empires.
					</p>
					<div class="flex items-center justify-between">
						<span class="text-xs text-slate-400">4 Nations</span>
						<Button size="sm" href="/scenarios/ww1">Play</Button>
					</div>
				</CardContent>
			</Card>

			<!-- Cold War -->
			<Card
				class="cursor-pointer border-slate-700 bg-slate-800 transition-colors hover:border-blue-500"
			>
				<CardHeader>
					<CardTitle>Cold War</CardTitle>
					<CardDescription>1947 - Ideological Conflict</CardDescription>
				</CardHeader>
				<CardContent>
					<p class="mb-4 text-sm text-slate-300">
						Lead a superpower through the tension of the Cold War. Manage nuclear deterrence, proxy
						wars, and diplomatic relations.
					</p>
					<div class="flex items-center justify-between">
						<span class="text-xs text-slate-400">2 Nations</span>
						<Button size="sm" href="/scenarios/coldwar">Play</Button>
					</div>
				</CardContent>
			</Card>

			<!-- Ancient Rome -->
			<Card
				class="cursor-pointer border-slate-700 bg-slate-800 transition-colors hover:border-blue-500"
			>
				<CardHeader>
					<CardTitle>Ancient Rome</CardTitle>
					<CardDescription>44 BC - The Republic's End</CardDescription>
				</CardHeader>
				<CardContent>
					<p class="mb-4 text-sm text-slate-300">
						Navigate the political intrigue of the Roman Republic. Form alliances, expand
						territories, and shape the empire's destiny.
					</p>
					<div class="flex items-center justify-between">
						<span class="text-xs text-slate-400">3 Nations</span>
						<Button size="sm" href="/scenarios/rome">Play</Button>
					</div>
				</CardContent>
			</Card>
		</div>

		<!-- Back Button -->
		<div class="mt-12">
			<Button variant="outline" href="/">← Back to Home</Button>
		</div>
	</div>
</div>
